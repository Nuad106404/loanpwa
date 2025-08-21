import { 
  handleResponse,
  getAuthHeaders
} from '../shared/utils/authUtils';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api`;

// Admin interface for TypeScript
export interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  role: 'admin' | 'superadmin';
  permissions: {
    manageUsers: boolean;
    manageLoans: boolean;
  };
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  adminsByRole: {
    admin?: number;
    superadmin?: number;
  };
  recentActivity: AdminUser[];
}

export interface CreateAdminData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  password: string;
  role: 'admin' | 'superadmin';
  permissions?: {
    manageUsers: boolean;
    manageLoans: boolean;
  };
}

export interface UpdateAdminData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'superadmin';
  permissions?: {
    manageUsers?: boolean;
    manageLoans?: boolean;
  };
}

// Get admin statistics
export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch(`${API_URL}/superadmin/stats`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  const result = await handleResponse(response);
  return result.data;
}

// Get all admins
export async function getAllAdmins(): Promise<AdminUser[]> {
  try {
    const response = await fetch(`${API_URL}/superadmin/admins`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      return result.data as AdminUser[];
    } else {
      console.error('Unexpected response format:', result);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('getAllAdmins error:', error);
    throw error;
  }
}

// Get admin by ID
export async function getAdminById(adminId: string): Promise<AdminUser> {
  try {
    const response = await fetch(`${API_URL}/superadmin/admins/${adminId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('getAdminById API error:', errorText);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.status === 'success' && result.data) {
      return result.data as AdminUser;
    } else {
      console.error('Unexpected response format:', result);
      throw new Error('Invalid response format from server');
    }
  } catch (error) {
    console.error('getAdminById error:', error);
    throw error;
  }
}

// Create new admin
export async function createAdmin(adminData: CreateAdminData): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/superadmin/admins`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(adminData)
  });
  
  const result = await handleResponse(response);
  return result.data;
}

// Update admin
export async function updateAdmin(adminId: string, adminData: UpdateAdminData): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/superadmin/admins/${adminId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(adminData)
  });
  
  const result = await handleResponse(response);
  return result.data;
}

// Delete admin
export async function deleteAdmin(adminId: string): Promise<void> {
  const response = await fetch(`${API_URL}/superadmin/admins/${adminId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  await handleResponse(response);
}
