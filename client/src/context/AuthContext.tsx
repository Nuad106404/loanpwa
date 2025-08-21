import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { User, login as authLogin, logout as authLogout, getCurrentUser } from '../services/authService';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth`;  // Make sure this matches the authService API_URL

interface TokenValidationResponse {
  status: 'success' | 'error';
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored user data and validate token on mount
    const validateSession = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        try {
          // Validate token with backend
          const response = await axios.get<TokenValidationResponse>(`${API_URL}/validate-token`, {
            headers: { Authorization: `Bearer ${currentUser.token}` }
          });
          if (response.data.status === 'success') {
            // Update axios default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${currentUser.token}`;
            setUser(currentUser);
          } else {
            throw new Error(response.data.message || 'Invalid token');
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          authLogout(); // Clear invalid session
          setUser(null);
        }
      }
    };
    
    validateSession();

    // Cleanup function to handle unmount
    return () => {
      delete axios.defaults.headers.common['Authorization'];
    };
  }, []);

  const login = async (phone: string, password: string) => {
    const response = await authLogin({ phone, password });
    if (response.status === 'success') {
      setUser(response.data);
      // No need to manually store user data as authService handles it
    } else {
      throw new Error(response.message);
    }
  };

  const logout = () => {
    authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};