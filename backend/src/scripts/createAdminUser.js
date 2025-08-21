import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Admin from '../models/Admin.js';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const existingAdmin = await Admin.findOne({ phone: '0000000000' });
    
    if (existingAdmin) {
      process.exit(0);
    }
    
    // Create a new admin user
    const adminUser = new Admin({
      firstName: 'Admin',
      lastName: 'User',
      phone: '0000000000', // Admin phone number (plain, unformatted)
      password: 'admin123', // Will be hashed by the pre-save hook
      role: 'admin',
      permissions: {
        manageUsers: true,
        manageLoans: true,
        manageSettings: true,
        viewReports: true
      }
    });
    
    await adminUser.save();
    
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();
