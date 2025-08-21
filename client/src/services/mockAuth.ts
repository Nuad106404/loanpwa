/**
 * Mock authentication data for development and testing
 * This simulates the Supabase backend responses for faster development
 */

import { User, ApiResponse, LoginCredentials, RegisterData } from './authService';

// Sample users for testing
const MOCK_USERS = [
  {
    id: 'user1',
    phone: '0812345678',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    nationalId: '1100800123456',
    dateOfBirth: '1990-01-01',
    role: 'user',
    token: 'mock-token-john-doe',
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'user2',
    phone: '0898765432',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    nationalId: '1100800654321',
    dateOfBirth: '1992-05-15',
    role: 'user',
    token: 'mock-token-jane-smith',
    createdAt: '2023-02-15T00:00:00.000Z',
    updatedAt: '2023-02-15T00:00:00.000Z'
  }
];

// Function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock login function
export const mockLogin = async (credentials: LoginCredentials): Promise<ApiResponse> => {
  // Simulate network delay (100-300ms for faster performance)
  await delay(Math.random() * 200 + 100);
  
  const user = MOCK_USERS.find(u => u.phone === credentials.phone);
  
  if (!user) {
    return {
      status: 'error',
      message: 'User not found. Please register first.'
    };
  }
  
  if (user.password !== credentials.password) {
    return {
      status: 'error',
      message: 'Invalid password. Please try again.'
    };
  }
  
  // Create a user object without the password
  const { password, ...userData } = user;
  
  return {
    status: 'success',
    data: userData as User
  };
};

// Mock register function
export const mockRegister = async (data: RegisterData): Promise<ApiResponse> => {
  // Simulate network delay (100-300ms for faster performance)
  await delay(Math.random() * 200 + 100);
  
  // Check if user already exists
  const existingUser = MOCK_USERS.find(u => u.phone === data.phone);
  if (existingUser) {
    return {
      status: 'error',
      message: 'User with this phone number already exists.'
    };
  }
  
  // Create new user
  const newUser = {
    id: `user${MOCK_USERS.length + 1}`,
    phone: data.phone,
    password: data.password,
    firstName: 'New',
    lastName: 'User',
    nationalId: '',
    dateOfBirth: '',
    role: 'user',
    token: `mock-token-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to mock database (this won't persist on reload)
  MOCK_USERS.push(newUser);
  
  // Return user data without password
  const { password, ...userData } = newUser;
  
  return {
    status: 'success',
    data: userData as User
  };
};
