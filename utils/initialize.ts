import { initializeAdminAccount } from './firebase';
import { initializeBlockchain } from './blockchain';
import { ENV, isDevelopment } from './env';

/**
 * Initialize application - sets up necessary resources on first launch
 * - Creates admin account in development environment
 * - Initializes blockchain with genesis block if needed
 */
export const initializeApp = async (): Promise<void> => {
  try {
    console.log(`Initializing app in ${ENV.app.environment} environment`);
    
    // Initialize blockchain
    const blockchainResult = await initializeBlockchain();
    if (blockchainResult.success) {
      console.log('Blockchain initialization:', blockchainResult.message);
    } else {
      console.error('Blockchain initialization failed:', blockchainResult.error);
    }
    
    // Initialize admin account in development environment
    if (isDevelopment()) {
      const adminResult = await initializeAdminAccount();
      if (adminResult.success) {
        console.log('Admin account initialization:', adminResult.message);
      } else {
        console.error('Admin account initialization failed:', adminResult.error);
      }
    }
    
    console.log('App initialization complete');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
};

export default initializeApp;