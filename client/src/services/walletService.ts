import axios from 'axios';
import { API_URL } from '../utils/config';

// Types
export interface Transaction {
  _id: string;
  type: 'loan' | 'withdrawal';
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'failed';
  amount: number;
  date: string;
  bankAccount?: string;
  reference?: string;
  failureReason?: string;
  userId: string;
}

export interface WalletData {
  availableBalance: number;
  approvedLoanAmount: number;
  pendingWithdrawals: number;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  transactions: Transaction[];
}

export interface ApiResponse {
  status: string;
  message?: string;
  data?: any;
}

// Get wallet data
export const getWallet = async (): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`${API_URL}/api/wallet`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      }
    });

    return response.data as ApiResponse;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถดึงข้อมูลกระเป๋าเงินได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Create a withdrawal
export const createWithdrawal = async (amount: number, bankAccount?: string): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`${API_URL}/api/wallet/withdraw`, 
      { amount, bankAccount },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('userToken')}`
        }
      }
    );

    return response.data as ApiResponse;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถดำเนินการถอนเงินได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Get transactions with filtering and sorting
export const getTransactions = async (
  type?: string,
  status?: string,
  sort: 'date' | 'amount' = 'date',
  order: 'asc' | 'desc' = 'desc'
): Promise<ApiResponse> => {
  try {
    const params = new URLSearchParams();
    if (type && type !== 'all') params.append('type', type);
    if (status && status !== 'all') params.append('status', status);
    params.append('sort', sort);
    params.append('order', order);

    const response = await axios.get(`${API_URL}/api/wallet/transactions`, {
      params,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      }
    });

    return response.data as ApiResponse;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถดึงข้อมูลรายการธุรกรรมได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Update bank details
export const updateBankDetails = async (
  bankName: string,
  accountNumber: string,
  accountName: string
): Promise<ApiResponse> => {
  try {
    const response = await axios.put(`${API_URL}/api/wallet/bank-details`,
      { bankName, accountNumber, accountName },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('userToken')}`
        }
      }
    );

    return response.data as ApiResponse;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถอัปเดตข้อมูลธนาคารได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Delete a transaction
export const deleteTransaction = async (transactionId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(`${API_URL}/api/wallet/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      }
    });

    return response.data as ApiResponse;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถลบรายการธุรกรรมได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Get transaction by ID
export const getTransactionById = async (transactionId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.get(`${API_URL}/api/wallet/transactions/${transactionId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('userToken')}`
      }
    });

    return response.data as ApiResponse;
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถดึงข้อมูลรายละเอียดธุรกรรมได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};
