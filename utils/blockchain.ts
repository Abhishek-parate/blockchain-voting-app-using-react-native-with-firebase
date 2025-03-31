import CryptoJS from 'crypto-js';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { ENV } from './env';

/**
 * A simplified blockchain implementation for vote recording
 * This is a simulation and not a production-ready blockchain
 */

// Define the structure of a block in our blockchain
interface Block {
  index: number;
  timestamp: number;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
}

// Define the blockchain class
class Blockchain {
  chain: Block[];
  difficulty: number;
  
  constructor() {
    this.chain = [];
    // Get difficulty from environment variables
    this.difficulty = ENV.blockchain.difficulty;
    
    // Create the genesis block if the chain is empty
    if (this.chain.length === 0) {
      this.createGenesisBlock();
    }
  }
  
  // Create the first block in the chain
  createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: new Date().getTime(),
      data: { message: ENV.blockchain.genesisMessage },
      previousHash: "0",
      hash: "",
      nonce: 0
    };
    
    // Mine the genesis block
    this.mineBlock(genesisBlock);
    this.chain.push(genesisBlock);
  }
  
  // Get the latest block in the chain
  getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }
  
  // Add a new block to the chain
  async addBlock(data: any): Promise<Block> {
    const previousBlock = this.getLatestBlock();
    const newBlock: Block = {
      index: previousBlock.index + 1,
      timestamp: new Date().getTime(),
      data: data,
      previousHash: previousBlock.hash,
      hash: "",
      nonce: 0
    };
    
    // Mine the new block
    this.mineBlock(newBlock);
    this.chain.push(newBlock);
    
    // Save the block to Firebase
    await this.saveBlockToFirebase(newBlock);
    
    return newBlock;
  }
  
  // Mine a block (find a hash with the required number of leading zeros)
  mineBlock(block: Block): void {
    const target = Array(this.difficulty + 1).join("0");
    
    while (block.hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(block);
    }
    
    console.log(`Block mined: ${block.hash}`);
  }
  
  // Calculate the hash of a block
  calculateHash(block: Block): string {
    return CryptoJS.SHA256(
      block.index +
      block.previousHash +
      block.timestamp +
      JSON.stringify(block.data) +
      block.nonce
    ).toString();
  }
  
  // Validate the integrity of the blockchain
  isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Check if the hash is valid
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
      }
      
      // Check if the previous hash pointer is valid
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    
    return true;
  }
  
  // Save a block to Firebase
  async saveBlockToFirebase(block: Block): Promise<void> {
    try {
      await setDoc(doc(db, "blockchain", block.index.toString()), {
        ...block,
        timestamp: new Date(block.timestamp),
      });
    } catch (error) {
      console.error("Error saving block to Firebase:", error);
    }
  }
  
  // Load the blockchain from Firebase
  async loadFromFirebase(): Promise<void> {
    try {
      const q = query(collection(db, "blockchain"), orderBy("index"));
      const querySnapshot = await getDocs(q);
      
      this.chain = [];
      querySnapshot.forEach((doc) => {
        const blockData = doc.data() as Block;
        // Convert Firestore timestamp to number
        blockData.timestamp = blockData.timestamp.toDate().getTime();
        this.chain.push(blockData);
      });
      
      // If no blocks were loaded (first time), create the genesis block
      if (this.chain.length === 0) {
        this.createGenesisBlock();
      }
      
      console.log(`Loaded ${this.chain.length} blocks from Firebase`);
    } catch (error) {
      console.error("Error loading blockchain from Firebase:", error);
      
      // If there's an error, create a new chain with a genesis block
      this.chain = [];
      this.createGenesisBlock();
    }
  }
}

// Create a hash of a vote
export const createVoteHash = (electionId: string, candidateId: number, voterId: string): string => {
  return CryptoJS.SHA256(`${electionId}|${candidateId}|${voterId}|${new Date().getTime()}`).toString();
};

// Record a vote on the blockchain
export const recordVoteOnBlockchain = async (
  electionId: string,
  candidateId: number,
  voterId: string
): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
  try {
    const blockchain = new Blockchain();
    await blockchain.loadFromFirebase();
    
    const voteHash = createVoteHash(electionId, candidateId, voterId);
    
    const voteData = {
      type: "VOTE",
      electionId,
      candidateId,
      voterIdHash: CryptoJS.SHA256(voterId).toString(), // Hash the voter ID for privacy
      voteHash,
      timestamp: new Date().getTime()
    };
    
    const newBlock = await blockchain.addBlock(voteData);
    
    return {
      success: true,
      transactionHash: newBlock.hash
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Verify the blockchain's integrity
export const verifyBlockchain = async (): Promise<{ valid: boolean; blockCount: number }> => {
  try {
    const blockchain = new Blockchain();
    await blockchain.loadFromFirebase();
    
    return {
      valid: blockchain.isChainValid(),
      blockCount: blockchain.chain.length
    };
  } catch (error) {
    console.error("Error verifying blockchain:", error);
    return {
      valid: false,
      blockCount: 0
    };
  }
};

// Get all votes for a specific election
export const getElectionVotes = async (electionId: string): Promise<any[]> => {
  try {
    const blockchain = new Blockchain();
    await blockchain.loadFromFirebase();
    
    const electionVotes = blockchain.chain.filter(block => 
      block.data && block.data.type === "VOTE" && block.data.electionId === electionId
    );
    
    return electionVotes.map(block => ({
      blockIndex: block.index,
      blockHash: block.hash,
      candidateId: block.data.candidateId,
      timestamp: block.data.timestamp,
      voteHash: block.data.voteHash
    }));
  } catch (error) {
    console.error("Error getting election votes:", error);
    return [];
  }
};

// Initialize the blockchain
export const initializeBlockchain = async (): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    // Check if blockchain already has blocks
    const q = query(collection(db, "blockchain"), orderBy("index"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("Initializing blockchain with genesis block");
      const blockchain = new Blockchain();
      await blockchain.saveBlockToFirebase(blockchain.chain[0]);
      return { 
        success: true, 
        message: "Blockchain initialized with genesis block"
      };
    } else {
      console.log("Blockchain already initialized");
      return { 
        success: true, 
        message: "Blockchain already initialized"
      };
    }
  } catch (error: any) {
    console.error("Error initializing blockchain:", error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export default Blockchain;