import axios from 'axios';
import { getAuthToken } from './authService';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

export interface ApiResponse {
  status: string;
  message?: string;
  data?: any;
}

/**
 * Fetches the user's profile data from the MongoDB database
 * @returns Promise with the user's profile data
 */
export const getUserProfile = async (): Promise<ApiResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        status: 'error',
        message: 'ไม่ได้รับการยืนยันตัวตน'
      };
    }

    const response = await axios.get(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.data;
  } catch (error: any) {
    // Handle specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        status: 'error',
        message: error.response.data.message || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้'
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        status: 'error',
        message: 'No response from server. Please check your connection.'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        status: 'error',
        message: error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      };
    }
  }
};

/**
 * Updates the user's profile data in the MongoDB database
 * @param profileData The profile data to update
 * @returns Promise with the updated profile data
 */
export const updateUserProfile = async (profileData: any): Promise<ApiResponse> => {
  try {
    const token = getAuthToken();
    if (!token) {
      return {
        status: 'error',
        message: 'ไม่ได้รับการยืนยันตัวตน'
      };
    }

    const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    // Handle specific error cases
    if (error.response) {
      return {
        status: 'error',
        message: error.response.data.message || 'ไม่สามารถอัปเดตข้อมูลโปรไฟล์ได้'
      };
    } else if (error.request) {
      return {
        status: 'error',
        message: 'No response from server. Please check your connection.'
      };
    } else {
      return {
        status: 'error',
        message: error.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      };
    }
  }
};
