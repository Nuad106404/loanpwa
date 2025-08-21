import { jwtDecode } from 'jwt-decode';

// Helper function to check if token is expired
export function isTokenExpired(token: string): boolean {
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

// Helper function to get auth token
export function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

// Helper function to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
}

// Helper function to handle API responses
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'API request failed');
  }
  
  const data = await response.json();
  return data.data;
}

// User interface that matches the admin needs
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
