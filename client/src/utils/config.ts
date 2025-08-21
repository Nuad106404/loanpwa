// Environment configuration

// API URL - use environment variable or default to localhost:5001
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// MongoDB URL - from environment variables
export const MONGO_URL = import.meta.env.VITE_MONGO_URL;

// JWT Secret - from environment variables
export const JWT_SECRET = import.meta.env.VITE_JWT_SECRET;

// Other configuration variables can be added here
export const FILE_UPLOAD_SIZE_LIMIT = 5 * 1024 * 1024; // 5MB
export const SUPPORTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
