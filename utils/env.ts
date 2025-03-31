// utils/env.ts (hardcoded for testing)
import Constants from 'expo-constants';

interface EnvConfig {
  // Firebase Configuration
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  
  // Blockchain Configuration
  blockchain: {
    difficulty: number;
    genesisMessage: string;
  };
  
  // Application Settings
  app: {
    name: string;
    version: string;
    environment: 'development' | 'testing' | 'production';
  };
  
  // Admin Settings
  admin: {
    email: string;
    defaultPassword: string;
  };
}

// For testing purposes, hardcode your Firebase config directly
const hardcodedConfig: EnvConfig = {
  firebaseConfig: {
    apiKey: "AIzaSyB9tlPz9ybrrsktXJM7gZI8EACT-CvHFWE",
    authDomain: "voting-system-38114.firebaseapp.com",
    projectId: "voting-system-38114",
    storageBucket: "voting-system-38114.firebaseapp.com", // Note: I fixed this from firebasestorage.app to firebaseapp.com
    messagingSenderId: "801143363502",
    appId: "1:801143363502:web:19a6c6b20b2d5d42fcda3f",
    measurementId: "G-Z5XLH5QXSY"
  },
  blockchain: {
    difficulty: 2,
    genesisMessage: 'Blockchain Voting System Genesis Block'
  },
  app: {
    name: 'Blockchain Voting System',
    version: '1.0.0',
    environment: 'development'
  },
  admin: {
    email: 'admin@example.com',
    defaultPassword: 'admin123'
  }
};

// Export the environment configuration
export const ENV: EnvConfig = hardcodedConfig;

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => ENV.app.environment === 'development';

// Helper function to check if we're in production mode
export const isProduction = (): boolean => ENV.app.environment === 'production';

// Helper function to get Firebase configuration
export const getFirebaseConfig = (): EnvConfig['firebaseConfig'] => ENV.firebaseConfig;

export default ENV;