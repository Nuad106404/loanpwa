import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth`;

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

    // Check session cache first for faster repeat logins
    const cacheKey = `auth_${cleanPhone}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Date.now() - parsed._cacheTime < AUTH_CACHE_DURATION) {
          return parsed.response;
        }
      } catch (e) {
        // Invalid cache, remove it
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Make the API request with timeout for faster failure
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await axios.post<ApiResponse>(`${API_URL}/login`, 
      { phone: cleanPhone, password: credentials.password },
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    // Handle successful login
    if (response.data.status === 'success') {
      const { data } = response.data;
      
      // Store auth data
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data));
      
      // Cache for future use
      sessionStorage.setItem(cacheKey, JSON.stringify({
        response: response.data,
        _cacheTime: Date.now()
      }));
      
      // Update in-memory cache
      cachedUser = data;
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

    // Make the API request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await axios.post<ApiResponse>(`${API_URL}/register`, 
      { phone: cleanPhone, password: data.password },
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);

    // Handle successful registration
    if (response.data.status === 'success') {
      const { data: userData } = response.data;
      
      // Store auth data
      localStorage.setItem('userToken', userData.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Cache for future use
      const cacheKey = `auth_${cleanPhone}`;
      sessionStorage.setItem(cacheKey, JSON.stringify({
        response: response.data,
        _cacheTime: Date.now()
      }));
      
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

export const logout = (): void => {
  try {
    // Clear cache first
    cachedUser = null;
    lastValidationTime = 0;
    
    // Then clear storage
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

export const getCurrentUser = (): User | null => {
  try {
    // Return cached user if available and recently validated
    if (cachedUser && (Date.now() - lastValidationTime < AUTH_CACHE_DURATION)) {
      return cachedUser;
    }

    const userToken = localStorage.getItem('userToken');
    const userDataString = localStorage.getItem('userData');
    
    if (!userToken || !userDataString) {
      return null;
    }
    
    const userData = JSON.parse(userDataString);
    // Quick validation of critical fields only
    if (!userData.id || !userData.phone || !userData.token) {
      throw new Error('Invalid user data');
    }
    
    // Validate token matches
    if (userData.token !== userToken) {
      throw new Error('Token mismatch');
    }
    
    // Add token to headers for future API calls
    axios.defaults.headers.common['Authorization'] = `Bearer ${userToken}`;
    
    // Update cache
    cachedUser = userData as User;
    lastValidationTime = Date.now();
    
    return cachedUser;
  } catch (error) {
    console.error('Error validating user session:', error);
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
