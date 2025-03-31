// theme/theme.ts
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, getUserProfile } from '../utils/firebase';
import * as SecureStore from 'expo-secure-store';

interface AuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signOut: () => Promise<{ error?: string }>;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: any;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  userProfile: null,
  loading: true,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  signOut: async () => ({ error: 'Not implemented' }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Get user profile from Firestore
        const { profile, error } = await getUserProfile(currentUser.uid);
        if (profile && !error) {
          setUserProfile(profile as UserProfile);
          // Store user info in secure storage
          await SecureStore.setItemAsync('user', JSON.stringify({
            uid: currentUser.uid,
            email: currentUser.email,
          }));
        }
      } else {
        setUserProfile(null);
        // Clear user info from secure storage
        await SecureStore.deleteItemAsync('user');
      }
      
      setLoading(false);
    });

    // Check for stored user on app load
    const checkStoredUser = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('user');
        if (storedUser && !user) {
          const parsedUser = JSON.parse(storedUser);
          // User data exists, but we'll wait for Firebase Auth to confirm
          console.log('Found stored user, waiting for Firebase auth check', parsedUser.uid);
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
      }
    };

    checkStoredUser();

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await import('../utils/firebase').then(module => module.signIn(email, password));
      
      if (result.error) {
        return { error: result.error };
      }
      
      // User will be set by the auth state listener
      return {};
    } catch (error: any) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const result = await import('../utils/firebase').then(module => module.signUp(email, password, name));
      
      if (result.error) {
        return { error: result.error };
      }
      
      // User will be set by the auth state listener
      return {};
    } catch (error: any) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await import('../utils/firebase').then(module => module.signOut());
      
      if (result.error) {
        return { error: result.error };
      }
      
      // User will be cleared by the auth state listener
      return {};
    } catch (error: any) {
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};