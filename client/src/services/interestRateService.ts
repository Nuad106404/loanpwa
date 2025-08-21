import axios from 'axios';

// API URL for backend
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/public`;

export interface InterestRateResponse {
  status: string;
  message?: string;
  data?: InterestRate[] | InterestRate;
}

export interface InterestRate {
  _id: string;
  term: number;
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Get all interest rates
export const getAllInterestRates = async (): Promise<InterestRateResponse> => {
  try {
    const response = await axios.get<InterestRateResponse>(`${API_URL}/interest-rates`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching interest rates:', error);
    
    return {
      status: 'error',
      message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลอัตราดอกเบี้ยได้'
    };
  }
};

// Get interest rate by term
export const getInterestRateByTerm = async (term: number): Promise<InterestRateResponse> => {
  try {
    const response = await axios.get<InterestRateResponse>(`${API_URL}/interest-rates/${term}`);
    return response.data;
  } catch (error: any) {
    console.error(`Error fetching interest rate for term ${term}:`, error);
    
    return {
      status: 'error',
      message: error.response?.data?.message || 'ไม่สามารถดึงข้อมูลอัตราดอกเบี้ยได้'
    };
  }
};

// Calculate monthly payment with actual interest rate
export const calculateMonthlyPayment = (
  principal: number, 
  term: number, 
  interestRate: number
): number => {
  // interestRate is expected as a decimal (e.g., 0.03 for 3%)
  // Formula: Uses simple interest calculated for the entire term
  const totalInterest = principal * interestRate;
  const totalPayment = principal + totalInterest;
  const monthlyPayment = totalPayment / term;
  
  return Math.round(monthlyPayment * 100) / 100; // Round to 2 decimal places
};
