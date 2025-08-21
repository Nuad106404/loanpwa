import axios from 'axios';

// API Configuration
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth`;
const API_TIMEOUT = 5000; // 5 seconds

// Local caching parameters
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
let cachedUser: User | null = null;
let lastValidationTime = 0;

// Types and Interfaces
interface Address {
  houseNumber: string;
  subdistrict: string;
  district: string;
  province: string;
  zipCode: string;
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface FamilyContact {
  name: string;
  relationship: string;
  phone: string;
  address: Address;
}

interface FinancialInfo {
  income: string;
  employmentStatus: string;
  loanPurpose?: string;
}

interface IdentityVerification {
  idCardFront: string | null;
  idCardBack: string | null;
  selfieWithId: string | null;
  signature: string | null;
}

export interface User {
  // Basic Info
  id: string;
  phone: string;
  role: string;
  token: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  status: 'active' | 'inactive' | 'suspended';
  
  // Extended Info
  address?: Address;
  bankInfo?: BankInfo;
  financialInfo?: FinancialInfo;
  familyContact?: FamilyContact;
  identityVerification?: IdentityVerification;
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
}

export interface SuccessResponse {
  status: 'success';
  data: User;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterData {
  phone: string;
  password: string;
}

export type ApiResponse = SuccessResponse | ErrorResponse;

// Helper functions
const validateThaiPhoneNumber = (phone: string): boolean => {
  return /^0\d{9}$/.test(phone.replace(/\D/g, ''));
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

const handleAxiosError = (error: unknown): ErrorResponse => {
  // Handle request cancellation
  if (error instanceof Error && ['CanceledError', 'AbortError'].includes(error.name)) {
    return {
      status: 'error',
      message: 'คำขอถูกยกเลิก'
    };
  }
  
  // Handle timeout
  if (error instanceof Error && 'code' in error && error.code === 'ECONNABORTED') {
    return {
      status: 'error',
      message: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง'
    };
  }
  
  // Handle API errors
  if (error instanceof Error && 
      'response' in error && 
      error.response && 
      typeof error.response === 'object' && 
      'data' in error.response) {
    return error.response.data as ErrorResponse;
  }
  
  // Generic network error
  return {
    status: 'error',
    message: 'Network error. Please check your connection.'
  };
};

// Core authentication functions
export const login = async (credentials: LoginCredentials): Promise<ApiResponse> => {
  try {
    // Local validation first - fail fast
    const cleanPhone = credentials.phone.replace(/\D/g, '');
    if (!validateThaiPhoneNumber(cleanPhone)) {
      return {
        status: 'error',
        message: 'Invalid phone number format. Please use Thai format (e.g., 0812345678)'
      };
    }

    // Make the API request
    const response = await axios.post<ApiResponse>(
      `${API_URL}/login`,
      { phone: cleanPhone, password: credentials.password },
      { timeout: API_TIMEOUT }
    );

    // Handle successful login
    if (response.data.status === 'success') {
      const { data: userData } = response.data;
      
      // Store auth data
      localStorage.setItem('userToken', userData.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Store userId separately for easy access by other services
      if (userData.id) {
        localStorage.setItem('userId', userData.id.toString());
      }
      
      // Update in-memory cache
      cachedUser = userData;
      lastValidationTime = Date.now();
    }

    return response.data;
  } catch (error) {
    return handleAxiosError(error);
  }
};

export const register = async (data: RegisterData): Promise<ApiResponse> => {
  try {
    // Local validation first - fail fast
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (!validateThaiPhoneNumber(cleanPhone)) {
      return {
        status: 'error',
        message: 'Invalid phone number format. Please use Thai format (e.g., 0812345678)'
      };
    }
    
    if (!validatePassword(data.password)) {
      return {
        status: 'error',
        message: 'Password must be at least 6 characters long'
      };
    }

    // Make the API request
    const response = await axios.post<ApiResponse>(
      `${API_URL}/register`,
      { phone: cleanPhone, password: data.password },
      { timeout: API_TIMEOUT }
    );

    // Handle successful registration
    if (response.data.status === 'success') {
      const { data: userData } = response.data;
      
      // Store auth data
      localStorage.setItem('userToken', userData.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Store userId separately for easy access by other services
      if (userData.id) {
        localStorage.setItem('userId', userData.id.toString());
      }
      
      // Update in-memory cache
      cachedUser = userData;
      lastValidationTime = Date.now();
    }

    return response.data;
  } catch (error) {
    const errorResponse = handleAxiosError(error);
    
    // Enhance error messages for common registration issues
    if (errorResponse.message?.toLowerCase().includes('already exists')) {
      return {
        status: 'error',
        message: 'This phone number is already registered. Please login instead.'
      };
    }
    
    return errorResponse;
  }
};

export const logout = async (): Promise<void> => {
  try {
    // Get token before clearing it
    const token = localStorage.getItem('userToken');
    
    // Call the backend logout endpoint to update isOnline status
    if (token) {
      try {
        // Ensure we wait for the API call to complete before proceeding
        const response = await axios.post('/api/auth/logout', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Add a small delay to ensure the Socket.IO event has time to propagate
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (apiError) {
        console.error('Error calling logout API:', apiError);
        // Continue with local logout even if API call fails
      }
    }
    
    // Clear cache
    cachedUser = null;
    lastValidationTime = 0;
    
    // Clear storage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    
    // Remove auth header
    delete axios.defaults.headers.common['Authorization'];
    
    // Clear session storage for this domain
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('auth_'))
      .forEach(key => sessionStorage.removeItem(key));
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    // Return cached user if available and recently validated
    if (cachedUser && (Date.now() - lastValidationTime < AUTH_CACHE_DURATION)) {
      return cachedUser;
    }

    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      return null;
    }

    // Add token to headers for API call
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;

    // Fetch fresh user data from the server
    const response = await axios.get<ApiResponse>(
      `${API_URL}/profile`,
      { timeout: API_TIMEOUT }
    );

    if (response.data.status === 'success') {
      const userData = response.data.data;
      
      // Update local storage
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Update cache
      cachedUser = userData;
      lastValidationTime = Date.now();
      
      return cachedUser;
    }

    throw new Error('Failed to fetch user profile');
  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Clean up on error
    localStorage.removeItem('userData');
    localStorage.removeItem('userToken');
    delete axios.defaults.headers.common['Authorization'];
    cachedUser = null;
    lastValidationTime = 0;
    return null;
  }
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('userToken');
};

// Get fresh user status directly from database (bypasses all caching)
export const getFreshUserStatus = async (): Promise<{ status: string; id: string } | null> => {
  try {
    const userToken = localStorage.getItem('userToken');
    if (!userToken) {
      return null;
    }

    
    // Make direct API call with cache-busting headers
    const response = await axios.get<ApiResponse>(
      `${API_URL}/profile`,
      { 
        timeout: API_TIMEOUT,
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      }
    );

    if (response.data.status === 'success') {
      const userData = response.data.data;
      
      return {
        status: userData.status,
        id: userData.id
      };
    }

    throw new Error('Failed to fetch fresh user status');
  } catch (error) {
    console.error('❌ Error fetching fresh user status:', error);
    return null;
  }
};

// Setup default request interceptors
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
