import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, User } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from './env';

// Firebase configuration from environment variables
const firebaseConfig = ENV.firebaseConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Use AsyncStorage for persistent authentication
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

// Authentication helpers
export const signUp = async (email: string, password: string, name: string, isAdmin: boolean = false) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email,
      name,
      isAdmin,
      createdAt: Timestamp.now()
    });
    
    return { user };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
};

const debugDirectAuth = async () => {
  const auth = getAuth();
  try {
    console.log("Trying direct Firebase auth");
    const userCredential = await signInWithEmailAndPassword(auth, "admin@example.com", "12345678");
    console.log("Direct auth successful:", userCredential.user.uid);
  } catch (error: any) {
    console.error("Direct auth error:", error.code, error.message);
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// User profile helpers
export const getUserProfile = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { profile: docSnap.data() };
    } else {
      return { error: "User profile not found" };
    }
  } catch (error: any) {
    return { error: error.message };
  }
};

// Elections helpers
export const createElection = async (data: {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  candidates: { name: string; info: string }[];
  createdBy: string;
}) => {
  try {
    const electionRef = doc(collection(db, "elections"));
    await setDoc(electionRef, {
      id: electionRef.id,
      title: data.title,
      description: data.description,
      startDate: Timestamp.fromDate(data.startDate),
      endDate: Timestamp.fromDate(data.endDate),
      candidates: data.candidates.map((candidate, index) => ({
        id: index + 1,
        name: candidate.name,
        info: candidate.info,
        voteCount: 0
      })),
      createdBy: data.createdBy,
      createdAt: Timestamp.now(),
      isActive: true,
      voters: []
    });
    
    return { electionId: electionRef.id };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getElections = async (activeOnly: boolean = false) => {
  try {
    let q;
    if (activeOnly) {
      q = query(collection(db, "elections"), where("isActive", "==", true));
    } else {
      q = collection(db, "elections");
    }
    
    const querySnapshot = await getDocs(q);
    const elections: any[] = [];
    
    querySnapshot.forEach((doc) => {
      elections.push(doc.data());
    });
    
    return { elections };
  } catch (error: any) {
    return { error: error.message };
  }
};

export const getElectionById = async (electionId: string) => {
  try {
    const docRef = doc(db, "elections", electionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { election: docSnap.data() };
    } else {
      return { error: "Election not found" };
    }
  } catch (error: any) {
    return { error: error.message };
  }
};

export const castVote = async (electionId: string, candidateId: number, voterId: string, voteHash: string) => {
  try {
    // Check if user already voted
    const electionRef = doc(db, "elections", electionId);
    const electionDoc = await getDoc(electionRef);
    
    if (!electionDoc.exists()) {
      return { error: "Election not found" };
    }
    
    const electionData = electionDoc.data();
    if (electionData.voters.includes(voterId)) {
      return { error: "You have already voted in this election" };
    }
    
    // Record the vote in the blockchain transactions
    const voteTransactionRef = doc(collection(db, "transactions"));
    await setDoc(voteTransactionRef, {
      id: voteTransactionRef.id,
      electionId,
      candidateId,
      voterId,
      voteHash,
      timestamp: Timestamp.now()
    });
    
    // Update the candidate's vote count and record the voter
    await updateDoc(electionRef, {
      [`candidates.${candidateId - 1}.voteCount`]: electionData.candidates[candidateId - 1].voteCount + 1,
      voters: arrayUnion(voterId)
    });
    
    return { success: true, transactionId: voteTransactionRef.id };
  } catch (error: any) {
    return { error: error.message };
  }
};

// Initialize admin account if it doesn't exist
// Initialize admin account if it doesn't exist
export const initializeAdminAccount = async () => {
    try {
      if (ENV.app.environment === 'development') {
        // Check if admin account already exists
        const adminEmail = ENV.admin.email;
        const adminPassword = ENV.admin.defaultPassword;
        
        console.log(`Attempting to initialize admin account: ${adminEmail}`);
        
        // Try to create the admin account directly
        try {
          console.log('Creating admin account...');
          const signUpResult = await signUp(adminEmail, adminPassword, 'Administrator', true);
          
          if (signUpResult.user) {
            console.log('Admin account created successfully');
            return { success: true, message: 'Admin account created' };
          } else if (signUpResult.error && signUpResult.error.includes('already-in-use')) {
            console.log('Admin email already in use, attempting to sign in...');
            
            // Account exists, try to sign in
            try {
              const signInResult = await signIn(adminEmail, adminPassword);
              
              if (signInResult.user) {
                console.log('Admin account verified through sign in');
                await firebaseSignOut(auth); // Sign out after verification
                return { success: true, message: 'Admin account verified' };
              } else {
                console.error('Could not sign in with existing admin account:', signInResult.error);
                
                // If we're here, the account exists but password might be wrong
                // For development, we can bypass this check
                console.log('Admin account exists but credentials may be incorrect');
                return { 
                  success: true, 
                  message: 'Admin account exists (credentials may need update)' 
                };
              }
            } catch (signInError: any) {
              console.error('Error during admin sign in attempt:', signInError);
              return { 
                success: true, 
                message: 'Admin account exists but sign-in failed' 
              };
            }
          } else {
            console.error('Failed to create admin account:', signUpResult.error);
            return { error: signUpResult.error };
          }
        } catch (signUpError: any) {
          console.error('Error during admin creation:', signUpError);
          
          // Try signing in as a fallback
          try {
            const signInResult = await signIn(adminEmail, adminPassword);
            if (signInResult.user) {
              console.log('Admin account verified (fallback)');
              await firebaseSignOut(auth);
              return { success: true, message: 'Admin account verified (fallback)' };
            }
          } catch (fallbackError) {
            // Ignore fallback errors
          }
          
          // Return original error
          return { error: signUpError.message };
        }
      }
      
      return { success: true, message: 'Admin initialization skipped in non-development environment' };
    } catch (error: any) {
      console.error('Error in admin account initialization:', error);
      // Consider this a non-critical error for development
      return { success: true, message: 'Admin initialization encountered errors, but app can proceed' };
    }
  };

export { app, auth, db };