# Blockchain Voting System

A secure, transparent, and tamper-proof mobile voting application built with React Native, Expo, Firebase, and blockchain technology.

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
   - Get your Firebase configuration (apiKey, authDomain, etc.)
   - Update the configuration in `utils/firebase.ts`

4. **Start the development server**:
   ```bash
   npx expo start
   ```

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
│   └── firebase.ts           # Firebase configuration and helpers
├── app.json                  # Expo configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## Key Components

### Blockchain Implementation

The blockchain implementation in `utils/blockchain.ts` simulates a real blockchain with the following features:

- **Blocks**: Contains transaction data, timestamps, and cryptographic hashes
- **Mining**: Simple proof-of-work algorithm to secure the chain
- **Validation**: Verifies the integrity of the blockchain
- **Persistence**: Stores the blockchain in Firebase Firestore

### Authentication

User authentication is handled through Firebase Authentication and managed using React Context:

- **Sign Up**: Create a new account with email, password, and user profile
- **Sign In**: Authenticate existing users
- **Sign Out**: End user sessions securely
- **Protected Routes**: Access control based on authentication state

### Election Management

Elections are stored in Firebase Firestore with the following structure:

- **Election Details**: Title, description, start/end dates
- **Candidates**: List of candidates with names and information
- **Votes**: Count of votes per candidate
- **Blockchain Records**: References to blockchain transactions for verification

## User Roles

### Voters (Regular Users)

- View active elections
- Cast votes in active elections
- View election results
- View voting history

### Administrators

- Create new elections
- Manage existing elections
- View detailed election analytics
- Access the admin panel

## Security Measures

- **Blockchain Verification**: Votes are verified against the blockchain to prevent tampering
- **One Vote Per User**: Each user can only vote once per election
- **Encrypted User Data**: Sensitive user information is encrypted
- **Role-Based Access Control**: Admin features are restricted to authorized users
- **Vote Privacy**: User votes are hashed on the blockchain for privacy

## Extending the Application

### Adding Real Blockchain Integration

To integrate with a real blockchain network like Ethereum:

1. Install Web3.js or ethers.js library
2. Create smart contracts for elections and voting
3. Update the blockchain.ts file to interact with the smart contracts
4. Implement wallet connections for transaction signing

### Enhancing Authentication

To add more authentication methods:

1. Enable additional providers in Firebase Authentication (Google, Apple, etc.)
2. Update the AuthContext.tsx file to support these providers
3. Create UI components for the new sign-in methods

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.