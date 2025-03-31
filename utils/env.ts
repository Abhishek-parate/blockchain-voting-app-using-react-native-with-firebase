// A utility file to load and use environment variables in the app

// Import environment variables if using Expo
import Constants from 'expo-constants';

/**
 * Environment configuration 
 * 
 * This pattern allows us to access environment variables
 * in a consistent way across the app, with type safety.
 * 
 * For Expo, you would define variables in your app.json
 * under the "extra" section, like:
 * 
 * "extra": {
 *   "firebaseApiKey": "your_api_key_here",
 *   ...
 * }
 * 
 * Then you can access them with Constants.expoConfig.extra
 */

interface EnvConfig {
  // Firebase Configuration
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
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

// Load values from Constants (Expo) or from environment variables
const getEnvValues = (): EnvConfig => {
  // For Expo
  if (Constants.expoConfig?.extra) {
    const extra = Constants.expoConfig.extra as any;
    
    return {
      firebaseConfig: {
        apiKey: extra.firebaseApiKey || '',
        authDomain: extra.firebaseAuthDomain || '',
        projectId: extra.firebaseProjectId || '',
        storageBucket: extra.firebaseStorageBucket || '',
        messagingSenderId: extra.firebaseMessagingSenderId || '',
        appId: extra.firebaseAppId || ''
      },
      blockchain: {
        difficulty: Number(extra.blockchainDifficulty || 2),
        genesisMessage: extra.blockchainGenesisMessage || 'Blockchain Voting System Genesis Block'
      },
      app: {
        name: extra.appName || 'Blockchain Voting System',
        version: extra.appVersion || '1.0.0',
        environment: (extra.appEnvironment || 'development') as EnvConfig['app']['environment']
      },
      admin: {
        email: extra.adminEmail || 'admin@example.com',
        defaultPassword: extra.adminDefaultPassword || 'admin_initial_password_123'
      }
    };
  }
  
  // Fallback to hardcoded defaults if not using Expo or if variables are missing
  return {
    firebaseConfig: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || ''
    },
    blockchain: {
      difficulty: Number(process.env.BLOCKCHAIN_DIFFICULTY || 2),
      genesisMessage: process.env.BLOCKCHAIN_GENESIS_MESSAGE || 'Blockchain Voting System Genesis Block'
    },
    app: {
      name: process.env.APP_NAME || 'Blockchain Voting System',
      version: process.env.APP_VERSION || '1.0.0',
      environment: (process.env.APP_ENVIRONMENT || 'development') as EnvConfig['app']['environment']
    },
    admin: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || 'admin_initial_password_123'
    }
  };
};

// Export the environment configuration
export const ENV: EnvConfig = getEnvValues();

// Helper function to check if we're in development mode
export const isDevelopment = (): boolean => ENV.app.environment === 'development';

// Helper function to check if we're in production mode
export const isProduction = (): boolean => ENV.app.environment === 'production';

// Helper function to get Firebase configuration
export const getFirebaseConfig = (): EnvConfig['firebaseConfig'] => ENV.firebaseConfig;

export default ENV;