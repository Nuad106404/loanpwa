import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import { fileURLToPath } from 'url';
import path from 'path';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error('MongoDB URL not found in environment variables');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGO_URL)
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ phone: '0987654321' });
    
    if (existingAdmin) {
      process.exit(0);
    }
    
    // Create new admin
    const admin = new Admin({
      firstName: 'Admin',
      lastName: 'User',
      phone: '0987654321',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      permissions: {
        manageUsers: true,
        manageLoans: true
      }
    });
    
    await admin.save();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
