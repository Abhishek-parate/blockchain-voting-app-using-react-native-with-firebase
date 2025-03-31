// contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, getUserProfile } from '../utils/firebase';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

interface AuthContextProps {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string; success?: boolean }>;
  signOut: () => Promise<{ error?: string; success?: boolean }>;
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
  const [initialized, setInitialized] = useState(false);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!loading && initialized) {
      console.log('Auth state ready, navigating based on user:', user ? 'logged in' : 'logged out');
      
      if (user) {
        // Give a slight delay to ensure context is fully updated
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 300);
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, loading, initialized]);

  useEffect(() => {
    console.log('Setting up auth state listener');
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      console.log('Auth state changed:', currentUser ? `User: ${currentUser.uid}` : 'No user');
      setUser(currentUser);
      
      if (currentUser) {
        try {
          // Get user profile from Firestore
          console.log('Fetching user profile for:', currentUser.uid);
          const { profile, error } = await getUserProfile(currentUser.uid);
          
          if (profile && !error) {
            console.log('User profile loaded successfully');
            setUserProfile(profile as UserProfile);
            
            // Store user info in secure storage
            await SecureStore.setItemAsync('user', JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
            }));
          } else {
            console.error('Error loading user profile:', error);
          }
        } catch (profileError) {
          console.error('Exception in profile loading:', profileError);
        }
      } else {
        console.log('No user, clearing profile data');
        setUserProfile(null);
        
        // Clear user info from secure storage
        try {
          await SecureStore.deleteItemAsync('user');
        } catch (storageError) {
          console.error('Error clearing secure storage:', storageError);
        }
      }
      
      setLoading(false);
      setInitialized(true);
    });

    // Check for stored user on app load
    const checkStoredUser = async () => {
      try {
        console.log('Checking for stored user');
        const storedUser = await SecureStore.getItemAsync('user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Found stored user:', parsedUser.uid);
          // We'll wait for Firebase Auth to confirm
        } else {
          console.log('No stored user found');
        }
      } catch (error) {
        console.error('Error checking stored user:', error);
      }
    };

    checkStoredUser();

    // Cleanup subscription
    return () => {
      console.log('Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Sign in attempt for:', email);
      setLoading(true);
      
      const result = await import('../utils/firebase').then(module => module.signIn(email, password));
      
      if (result.error) {
        console.error('Sign in error:', result.error);
        return { error: result.error };
      }
      
      console.log('Sign in successful, user will be set by listener');
      // User will be set by the auth state listener
      return { success: true };
    } catch (error: any) {
      console.error('Exception in sign in:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Sign up attempt for:', email);
      setLoading(true);
      
      const result = await import('../utils/firebase').then(module => module.signUp(email, password, name));
      
      if (result.error) {
        console.error('Sign up error:', result.error);
        return { error: result.error };
      }
      
      console.log('Sign up successful, user will be set by listener');
      // User will be set by the auth state listener
      return { success: true };
    } catch (error: any) {
      console.error('Exception in sign up:', error);
      return { error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log('Sign out attempt');
      setLoading(true);
      
      const result = await import('../utils/firebase').then(module => module.signOut());
      
      if (result.error) {
        console.error('Sign out error:', result.error);
        return { error: result.error };
      }
      
      console.log('Sign out successful, user will be cleared by listener');
      // User will be cleared by the auth state listener
      return { success: true };
    } catch (error: any) {
      console.error('Exception in sign out:', error);
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