import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Get current file path (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables - similar to main app
dotenv.config();

// If that doesn't work, try relative to the current directory
if (!process.env.MONGO_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const initializeWallets = async () => {
  try {
    // Find all users without a wallet field
    const users = await User.find({ wallet: { $exists: false } });

    // Initialize wallet for each user
    for (const user of users) {
      user.wallet = {
        availableBalance: 0,
        approvedLoanAmount: 0,
        pendingWithdrawals: 0,
        transactions: [],
        bankDetails: {
          // Copy from user's bankAccount if it exists
          bankName: user.bankAccount?.bankName || '',
          accountNumber: user.bankAccount?.accountNumber || '',
          accountName: user.bankAccount?.accountName || ''
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await user.save();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error initializing wallets:', error);
    process.exit(1);
  }
};

// Run the initialization
initializeWallets();
