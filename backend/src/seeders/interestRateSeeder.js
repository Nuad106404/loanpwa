import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InterestRate from '../models/InterestRate.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .catch(err => console.error('MongoDB connection error:', err));

// Define the interest rates to seed
const interestRates = [
  {
    term: 6,
    rate: 0.03, // 3% monthly interest
    isActive: true
  },
  {
    term: 12,
    rate: 0.025, // 2.5% monthly interest
    isActive: true
  },
  {
    term: 24,
    rate: 0.02, // 2% monthly interest
    isActive: true
  },
  {
    term: 36,
    rate: 0.018, // 1.8% monthly interest
    isActive: true
  }
];

// Function to seed the database
async function seedInterestRates() {
  try {
    // Clear existing interest rates
    await InterestRate.deleteMany({});
    
    // Insert new interest rates
    const result = await InterestRate.insertMany(interestRates);
    
    // Close the connection
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding interest rates:', error);
    mongoose.connection.close();
  }
}

// Run the seeder
seedInterestRates();
