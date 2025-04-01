# Blockchain Voting System

A secure, transparent, and tamper-proof mobile voting application built with React Native, Expo, Firebase, and blockchain technology.

[![React Native](https://img.shields.io/badge/React_Native-0.72.6+-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK_49+-white.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.0+-orange.svg)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation and Setup](#installation-and-setup)
- [Project Structure](#project-structure)
- [Key Components](#key-components)
- [User Roles](#user-roles)
- [Security Measures](#security-measures)
- [Blockchain Implementation](#blockchain-implementation)
- [Extending the Application](#extending-the-application)
- [Contributing](#contributing)
- [License](#license)

## Overview

This Blockchain Voting System creates a secure and transparent platform for conducting elections with the immutability and verification benefits of blockchain technology. The application combines the accessibility of a mobile interface with the security of distributed ledger technology to ensure votes cannot be tampered with once cast.

## Features

- **User Authentication**: Secure login and registration using Firebase Authentication
- **Blockchain-Based Voting**: Immutable record of votes using a simulated blockchain implementation
- **Election Management**: Create, view, and manage elections
- **Voting System**: Cast votes securely with verification
- **Results Visualization**: View live election results with charts
- **Admin Panel**: Administrators can create and manage elections
- **Secure Architecture**: Data integrity maintained through blockchain verification

## Tech Stack

- **Frontend**: React Native with Expo and TypeScript
- **UI Components**: React Native Elements (@rneui/base, @rneui/themed)
- **Navigation**: Expo Router
- **Backend/Database**: Firebase (Authentication, Firestore)
- **Blockchain**: Custom blockchain implementation in TypeScript (simulated)
- **State Management**: React Context API

## Installation and Setup

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI
- Firebase account

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/blockchain-voting-app-using-react-native-with-firebase.git
   cd blockchain-voting-app-using-react-native-with-firebase
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Firebase Setup**:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password) and Firestore
   - Get your Firebase configuration
   - Create a `.env` file in the root directory with the following variables:
     ```
     EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Configure Firestore Security Rules**:
   - Use the provided `firestore.rules` file or customize it for your security needs
   - Deploy the rules to your Firebase project:
     ```bash
     firebase deploy --only firestore:rules
     ```

5. **Start the development server**:
   ```bash
   npx expo start
   ```

6. **Test on a device or emulator**:
   - Scan the QR code with the Expo Go app on your physical device
   - Press `a` to open in an Android emulator
   - Press `i` to open in an iOS simulator

## Project Structure

```
blockchain-voting-app-using-react-native-with-firebase/
├── app/                      # Main application directory (Expo Router)
│   ├── (tabs)/               # Tab-based navigation screens
│   │   ├── home.tsx          # Home screen
│   │   ├── elections.tsx     # Elections list screen
│   │   ├── admin.tsx         # Admin panel screen
│   │   ├── profile.tsx       # User profile screen
│   │   └── _layout.tsx       # Tab navigation layout
│   ├── admin/                # Admin-specific screens
│   │   └── create-election.tsx # Create election screen
│   ├── auth/                 # Authentication screens
│   │   ├── login.tsx         # Login screen
│   │   └── register.tsx      # Registration screen
│   ├── election/             # Election-related screens
│   │   └── [id]/             # Dynamic routing based on election ID
│   │       ├── index.tsx     # Voting screen
│   │       └── results.tsx   # Results screen
│   ├── _layout.tsx           # Root layout component
│   └── index.tsx             # Entry point
├── assets/                   # Images, fonts, etc.
├── contexts/                 # React Context API implementations
│   └── AuthContext.tsx       # Authentication context
├── theme/                    # Theme configuration
│   └── theme.ts              # Theme settings for React Native Elements
├── utils/                    # Utility functions
│   ├── blockchain.ts         # Blockchain implementation
│   ├── firebase.ts           # Firebase configuration and helpers
│   ├── env.ts                # Environment variables handling
│   └── initialize.ts         # Application initialization
├── app.json                  # Expo configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Key Components

### Authentication (AuthContext.tsx)

The authentication system is built using Firebase Authentication and managed through React Context:

```typescript
// Example of the AuthContext usage
import { useAuth } from '../contexts/AuthContext';

function ProfileScreen() {
  const { user, signOut } = useAuth();
  
  return (
    <View style={styles.container}>
      <Text>Welcome, {user?.displayName || 'User'}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

### Election Management

Elections are stored in Firebase Firestore with a structured schema:

```typescript
// Example election document structure
interface Election {
  id: string;
  title: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  candidates: Candidate[];
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
}

interface Candidate {
  id: string;
  name: string;
  info: string;
  imageUrl?: string;
  voteCount: number;
}
```

### Voting Process

The voting process involves several steps to ensure security and verifiability:

1. **User Authentication**: Verify user identity
2. **Election Verification**: Check eligibility and election status
3. **Vote Casting**: Record the vote in the database
4. **Blockchain Record**: Add the vote to the blockchain with a hash
5. **Confirmation**: Provide confirmation to the user

## User Roles

### Voters (Regular Users)

- View active elections
- Cast votes in active elections
- View election results
- View voting history

### Administrators

- Create new elections
- Manage existing elections (edit, activate, deactivate)
- View detailed election analytics
- Access the admin panel

## Security Measures

- **Blockchain Verification**: Votes are verified against the blockchain to prevent tampering
- **One Vote Per User**: Each user can only vote once per election
- **Vote Privacy**: User votes are hashed on the blockchain for privacy
- **Role-Based Access Control**: Admin features are restricted to authorized users
- **Firestore Security Rules**: Database access is controlled by custom security rules
- **Input Validation**: All user inputs are validated both client and server-side

## Blockchain Implementation

The blockchain implementation (`utils/blockchain.ts`) provides a simulated distributed ledger with:

```typescript
// Simplified structure of the blockchain implementation
class Block {
  constructor(
    public index: number,
    public timestamp: number,
    public data: any,
    public previousHash: string,
    public hash: string,
    public nonce: number
  ) {}
  
  // Compute the hash of the block
  computeHash(): string {
    // Implementation uses SHA-256 hashing algorithm
  }
}

class Blockchain {
  public chain: Block[];
  
  constructor() {
    this.chain = [this.createGenesisBlock()];
  }
  
  // Create the first block in the chain
  private createGenesisBlock(): Block {
    // Implementation creates initial block
  }
  
  // Add a new block to the chain
  addBlock(data: any): Block {
    // Implementation adds new block with proof-of-work
  }
  
  // Verify the integrity of the chain
  isChainValid(): boolean {
    // Implementation checks each block's hash and links
  }
  
  // Sync with Firebase for persistence
  async syncWithFirebase(): Promise<void> {
    // Implementation syncs blockchain state
  }
}
```

Features of the blockchain implementation:

- **Genesis Block**: Initializes the chain with a first block
- **Proof of Work**: Requires computational effort to add new blocks
- **Chain Validation**: Verifies the integrity of the entire chain
- **Firebase Integration**: Persists the blockchain state to Firebase
- **Vote Hashing**: Secures vote data with cryptographic hashing

## Extending the Application

### Adding Real Blockchain Integration

To integrate with a real blockchain network like Ethereum:

1. Install Web3.js or ethers.js library
   ```bash
   npm install ethers
   ```

2. Create smart contracts for elections and voting (Solidity)
   ```solidity
   // Example simplified smart contract
   contract VotingSystem {
       struct Candidate {
           uint id;
           string name;
           uint voteCount;
       }
       
       struct Election {
           uint id;
           string title;
           mapping(uint => Candidate) candidates;
           uint candidatesCount;
           mapping(address => bool) voters;
           bool active;
       }
       
       mapping(uint => Election) public elections;
       uint public electionsCount;
       
       function createElection(string memory _title) public {
           // Implementation
       }
       
       function addCandidate(uint _electionId, string memory _name) public {
           // Implementation
       }
       
       function vote(uint _electionId, uint _candidateId) public {
           // Implementation
       }
   }
   ```

3. Update the `utils/blockchain.ts` file to interact with the smart contracts
4. Implement wallet connections for transaction signing

### Enhancing Authentication

To add more authentication methods:

1. Enable additional providers in Firebase Authentication (Google, Apple, etc.)
2. Update the `AuthContext.tsx` file to support these providers:

```typescript
// Example of adding Google authentication
const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Handle result
  } catch (error) {
    // Handle error
  }
};
```

3. Create UI components for the new sign-in methods

### Implementing Biometric Verification

For higher security, add biometric verification using Expo's LocalAuthentication:

1. Install the required package
   ```bash
   expo install expo-local-authentication
   ```

2. Implement biometric verification before voting
   ```typescript
   import * as LocalAuthentication from 'expo-local-authentication';
   
   const authenticateUser = async () => {
     const hasHardware = await LocalAuthentication.hasHardwareAsync();
     if (!hasHardware) {
       alert('Device does not support biometric authentication');
       return false;
     }
     
     const isEnrolled = await LocalAuthentication.isEnrolledAsync();
     if (!isEnrolled) {
       alert('No biometrics enrolled on this device');
       return false;
     }
     
     const result = await LocalAuthentication.authenticateAsync({
       promptMessage: 'Authenticate to cast your vote',
       fallbackLabel: 'Use passcode',
     });
     
     return result.success;
   };
   ```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure your code adheres to the existing style and passes all tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.