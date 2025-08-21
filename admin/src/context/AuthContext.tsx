import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../utils/api';
import toast from 'react-hot-toast';
import { User, isTokenExpired } from '../shared/utils/authUtils';

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
    // Check for stored user data and token on mount
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      // Check if token is expired
      try {
        if (isTokenExpired(token)) {
          // Token is expired, log out user
          logout();
        } else {
          // Token is valid, set user
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        // Invalid token, log out user
        logout();
      }
    }
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      // Call the real API login endpoint
      const response = await apiLogin({ phone, password });
      
      // Set user data from API response
      setUser(response.user);
      
      // Token is saved in localStorage by the API service
      
      // Show success message
      toast.success('Login successful');
      
      // Navigate to home page after successful login
      window.location.href = '/';
    } catch (error) {
      // Show error message
      toast.error(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Redirect to login page
    window.location.href = '/';
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