import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  getCurrentUser,
  LoginCredentials,
  RegisterData,
  ApiResponse
} from '../services/authService';
import socketService from '../services/socketService';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<ApiResponse>;
  register: (data: RegisterData) => Promise<ApiResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUser(userData);
          // Identify user to socket service for notifications if already logged in
          if (userData.id) {
            
            // Ensure socket connection is established first
            socketService.connect();
            
            // Retry user identification with multiple attempts to ensure it works
            const identifyWithRetry = (attempts = 0) => {
              if (attempts >= 5) {
                console.error('🔐❌ Failed to identify user after 5 attempts:', userData.id);
                return;
              }
              
              setTimeout(() => {
                if (socketService.isConnected()) {
                  socketService.identifyUser(userData.id);
                } else {
                  identifyWithRetry(attempts + 1);
                }
              }, 1000 + (attempts * 1000)); // Increasing delay for each retry
            };
            
            identifyWithRetry();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await loginService(credentials);
      if (response.status === 'success') {
        setUser(response.data);
        // Identify user to socket service for notifications
        if (response.data && response.data.id) {
          // Add small delay to ensure socket connection is stable after login
          setTimeout(() => {
            socketService.identifyUser(response.data.id);
          }, 500);
        }
      }
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await registerService(data);
      if (response.status === 'success') {
        setUser(response.data);
      }
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during registration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Get user ID before clearing user data
      const currentUser = user;
      
      // Emit logout event to backend to mark user as inactive
      if (currentUser && currentUser.id) {
        await socketService.emitLogout(currentUser.id);
      }
      
      // Call logout service
      await logoutService();
      
      // Disconnect socket and clean up all socket-related data
      socketService.disconnectSocket();
      
      // Clear user data
      setUser(null);
      localStorage.removeItem('user');
      setError(null);
      
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
