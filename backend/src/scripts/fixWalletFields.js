import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Get current file path (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// If that doesn't work, try relative to the current directory
if (!process.env.MONGO_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}


// Connect to MongoDB directly without Mongoose schemas to bypass any schema validation
const fixWalletFields = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    
    // Get direct access to the users collection
    const db = mongoose.connection;
    const usersCollection = db.collection('users');
    
    // Update all users to ensure they have wallet fields
    const result = await usersCollection.updateMany(
      {}, // Match all documents
      {
        $set: {
          availableBalance: 0,
          approvedLoanAmount: 0,
          pendingWithdrawals: 0
        }
      },
      { upsert: false } // Don't create new documents
    );
    
    
    // Verify the update by getting all users
    const users = await usersCollection.find({}).toArray();
    
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error fixing wallet fields:', error);
    process.exit(1);
  }
};

// Run the fix
fixWalletFields();
