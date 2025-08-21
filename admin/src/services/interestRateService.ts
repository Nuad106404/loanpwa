import axios from 'axios';

// API URLs for backend
const PUBLIC_API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/public`;
const ADMIN_API_URL = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/admin`;

export interface InterestRate {
  _id: string;
  term: number;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InterestRateResponse {
  status: string;
  message?: string;
  data?: InterestRate[] | InterestRate;
}

// Fetch all interest rates (public)
export const fetchInterestRates = async (): Promise<InterestRate[]> => {
  try {
    const response = await axios.get<InterestRateResponse>(`${PUBLIC_API_URL}/interest-rates`);
    if (response.data.status === 'success' && response.data.data) {
      return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
    }
    return [];
  } catch (error) {
    console.error('Error fetching interest rates:', error);
    return [];
  }
};

// Admin: Fetch all interest rates
export const adminFetchInterestRates = async (): Promise<InterestRate[]> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.get<InterestRateResponse>(`${ADMIN_API_URL}/interest-rates`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.status === 'success' && response.data.data) {
      return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
    }
    return [];
  } catch (error) {
    console.error('Error fetching interest rates:', error);
    throw error;
  }
};

// Fetch interest rate by term (public)
export const fetchInterestRateByTerm = async (term: number): Promise<InterestRate | null> => {
  try {
    const response = await axios.get<InterestRateResponse>(`${PUBLIC_API_URL}/interest-rates/${term}`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data as InterestRate;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching interest rate for term ${term}:`, error);
    return null;
  }
};

// Calculate monthly payment with actual interest rate
export const calculateMonthlyPayment = (
  principal: number, 
  term: number, 
  interestRate: number
): number => {
  // Interest rate is expected as a decimal (e.g., 0.03 for 3%)
  // Formula: Uses simple interest calculated for the entire term
  const totalInterest = principal * interestRate;
  const totalPayment = principal + totalInterest;
  const monthlyPayment = totalPayment / term;
  
  return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimal places
};

// Admin: Create a new interest rate
export const adminCreateInterestRate = async (interestRate: Omit<InterestRate, '_id' | 'createdAt' | 'updatedAt'>): Promise<InterestRate> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.post<InterestRateResponse>(`${ADMIN_API_URL}/interest-rates`, interestRate, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data as InterestRate;
    }
    
    throw new Error(response.data.message || 'Failed to create interest rate');
  } catch (error) {
    console.error('Error creating interest rate:', error);
    throw error;
  }
};

// Admin: Update an interest rate
export const adminUpdateInterestRate = async (id: string, updates: Partial<InterestRate>): Promise<InterestRate> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    
    const response = await axios.put<InterestRateResponse>(`${ADMIN_API_URL}/interest-rates/${id}`, updates, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data as InterestRate;
    }
    
    throw new Error(response.data.message || 'Failed to update interest rate');
  } catch (error) {
    console.error(`Error updating interest rate with ID ${id}:`, error);
    throw error;
  }
};

// Admin: Delete an interest rate
export const adminDeleteInterestRate = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.delete<InterestRateResponse>(`${ADMIN_API_URL}/interest-rates/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete interest rate');
    }
  } catch (error) {
    console.error(`Error deleting interest rate with ID ${id}:`, error);
    throw error;
  }
};
