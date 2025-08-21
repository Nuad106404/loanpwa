import { 
  AuthResponse, 
  LoginCredentials,
  handleResponse,
  getAuthHeaders
} from '../shared/utils/authUtils';

const API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api`;

// Admin login
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });
  
  const data = await handleResponse<AuthResponse>(response);
  
  // Save token to localStorage
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
}

// Get dashboard statistics
export async function getDashboardStats() {
  const response = await fetch(`${API_URL}/admin/dashboard/stats`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}

// Get all users
export async function getAllUsers() {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}

// Get user by ID
export async function getUserById(userId: string) {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}

// Update user
export async function updateUser(userId: string, userData: any) {
  const response = await fetch(`${API_URL}/admin/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  
  return handleResponse(response);
}

// Get all loans
export async function getAllLoans() {
  const response = await fetch(`${API_URL}/admin/loans`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}

// Get loan by ID
export async function getLoanById(loanId: string) {
  const response = await fetch(`${API_URL}/admin/loans/${loanId}`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}

// Update loan status
export async function updateLoanStatus(loanId: string, statusData: { status: string, notes?: string }) {
  const response = await fetch(`${API_URL}/admin/loans/${loanId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(statusData)
  });
  
  return handleResponse(response);
}

// Get all transactions
export async function getAllTransactions() {
  const response = await fetch(`${API_URL}/admin/transactions`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}



// Get interest rates
export async function getInterestRates() {
  const response = await fetch(`${API_URL}/admin/interest-rates`, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return handleResponse(response);
}

// Create interest rate
export async function createInterestRate(rateData: { term: number, rate: number, isActive?: boolean }) {
  const response = await fetch(`${API_URL}/admin/interest-rates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(rateData)
  });
  
  return handleResponse(response);
}

// Update interest rate
export async function updateInterestRate(rateId: string, rateData: { term?: number, rate?: number, isActive?: boolean }) {
  const response = await fetch(`${API_URL}/admin/interest-rates/${rateId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(rateData)
  });
  
  return handleResponse(response);
}
