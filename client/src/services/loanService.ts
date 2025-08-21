import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

// Types
export interface PersonalInfoData {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  dateOfBirth: string;
}

export interface IdVerificationData {
  idCardFront: File | null;
  idCardBack: File | null;
  selfieWithId: File | null;
  signature: string;
}

export interface ApiResponse {
  status: string;
  message?: string;
  data?: any;
}

// Save personal information to the database
export const savePersonalInfo = async (personalInfo: PersonalInfoData): Promise<ApiResponse> => {
  try {
    // Get authentication token
    const token = localStorage.getItem('userToken');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Only add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Get the stored userId - this is critical for updates
    const userId = localStorage.getItem('userId');
    const originalPhone = localStorage.getItem('phoneNumber');
    const originalNationalId = localStorage.getItem('nationalId');
    
    // IMPORTANT: This fixed the update issue - make sure we have original values
    if (!originalPhone && personalInfo.phone) {
      localStorage.setItem('phoneNumber', personalInfo.phone);
    }
    
    if (!originalNationalId && personalInfo.nationalId) {
      localStorage.setItem('nationalId', personalInfo.nationalId);
    }
    
    // Re-fetch values to ensure we have something
    const finalOriginalPhone = localStorage.getItem('phoneNumber') || personalInfo.phone;
    const finalOriginalNationalId = localStorage.getItem('nationalId') || personalInfo.nationalId;
    
    // Validate required fields before sending
    const firstName = personalInfo.firstName?.trim();
    const lastName = personalInfo.lastName?.trim();
    const nationalId = personalInfo.nationalId?.trim();
    const phone = personalInfo.phone?.trim();
    
    if (!firstName || !lastName || !nationalId || !phone) {
      return {
        status: 'error',
        message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, เลขบัตรประชาชน, เบอร์โทรศัพท์)'
      };
    }
    
    // Format the data to match what the backend expects
    const requestData = {
      firstName,
      lastName,
      nationalId,
      phone,
      dateOfBirth: personalInfo.dateOfBirth || new Date().toISOString().split('T')[0], // Ensure a valid date
      // Enhanced identification for user matching - use the final values
      userId: userId || '',
      originalPhone: finalOriginalPhone,
      originalNationalId: finalOriginalNationalId,
      // Add address object to prevent undefined errors
      address: {
        homeNumber: 'N/A',
        subdistrict: 'N/A',
        district: 'N/A',
        province: 'N/A',
        zipCode: '10000'
      }
    };
    
    // Log the exact data being sent to the server
    console.log('🚀 Sending request to:', `${API_URL}/loans/personal-info`);
    console.log('📦 Request data:', JSON.stringify(requestData, null, 2));
    console.log('🔑 Headers:', headers);

    // Always use POST for simplicity - the backend will decide whether to update or create
    const response = await axios.post(`${API_URL}/loans/personal-info`, requestData, { headers });
    
    // For debugging
    console.log('✅ Response received:', response.status, response.data);
    
    // If successful, update the stored values for future reference
    const responseData = response.data as ApiResponse;
    
    if (responseData && responseData.status === 'success') {
      // Store all the key identifiers
      localStorage.setItem('phoneNumber', personalInfo.phone);
      localStorage.setItem('nationalId', personalInfo.nationalId);
      
      // IMPORTANT: Check for ID mismatch flags from server
      if (responseData.data?.idMismatch) {
        console.warn('ID MISMATCH DETECTED:', { 
          oldId: responseData.data.oldUserId,
          newId: responseData.data.userId
        });
        
        // Always use the server's userId as the source of truth
        const correctUserId = responseData.data.userId;
        if (correctUserId) {
          localStorage.setItem('userId', correctUserId.toString());
        }
      } else {
        // Normal case - just store the userId
        const userId = responseData.data?.userId || responseData.data?.user?.id;
        if (userId) {
          localStorage.setItem('userId', userId.toString());
        } else {
          console.warn('WARNING: No userId found in response!', responseData);
        }
      }
    }
    
    // Return the properly typed response data
    return responseData;
  } catch (error) {
    console.error('❌ Error saving personal information:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      const errorResponse = (error as any).response;
      console.error('📋 Error response status:', errorResponse?.status);
      console.error('📋 Error response data:', errorResponse?.data);
      console.error('📋 Error response headers:', errorResponse?.headers);
      
      const responseData = errorResponse?.data as { message?: string; missingFields?: string[]; receivedData?: any };
      return {
        status: 'error',
        message: responseData?.message || 'ไม่สามารถบันทึกข้อมูลส่วนตัวได้',
        data: responseData
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Save ID verification data to the database
export const saveIdVerification = async (idVerification: IdVerificationData, phone: string): Promise<ApiResponse> => {
  try {
    // Get authentication token
    const token = localStorage.getItem('userToken');
    
    // Set up headers - for FormData, don't set Content-Type as it will be set automatically
    const headers: Record<string, string> = {};
    
    // Only add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Create FormData object for file upload
    const formData = new FormData();
    
    // Add phone number (needed for user identification)
    formData.append('phone', phone);
    
    // Add files if they exist
    if (idVerification.idCardFront) {
      formData.append('idCardFront', idVerification.idCardFront);
    }
    
    if (idVerification.idCardBack) {
      formData.append('idCardBack', idVerification.idCardBack);
    }
    
    if (idVerification.selfieWithId) {
      formData.append('selfieWithId', idVerification.selfieWithId);
    }
    
    // Add signature as base64 string
    if (idVerification.signature) {
      formData.append('signature', idVerification.signature);
    }

    // Call the backend API - note the different endpoint
    const response = await axios.post(`${API_URL}/loans/id-verification`, formData, {
      headers
    });

    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any).data as { message?: string };
      return {
        status: 'error',
        message: responseData.message || 'ไม่สามารถบันทึกการยืนยันตัวตนได้'
      };
    }
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Create a loan application directly from the calculator
// Save address information to the database
export const saveAddressInfo = async (addressData: {
  homeNumber: string;
  subdistrict: string;
  district: string;
  province: string;
  zipCode: string;
}): Promise<ApiResponse> => {
  try {
    // Get authentication token and user identifiers
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const phone = localStorage.getItem('phoneNumber');
    const nationalId = localStorage.getItem('nationalId');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare request data with all possible user identifiers
    const requestData = {
      address: addressData,
      userId: userId || '',
      phone: phone || '',
      nationalId: nationalId || ''
    };
    
    
    // Call the API endpoint
    const response = await axios.post(`${API_URL}/loans/address-info`, requestData, { headers });
    
    return response.data as ApiResponse;
  } catch (error) {
    console.error('Error saving address information:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any)?.data as { message?: string };
      return {
        status: 'error',
        message: responseData?.message || 'ไม่สามารถบันทึกข้อมูลที่อยู่ได้'
      };
    }
        
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Fetch the applicant's address from the database
export const getApplicantAddress = async (): Promise<ApiResponse> => {
  try {
    // Get authentication token and user identifiers
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const phone = localStorage.getItem('phoneNumber');
    const nationalId = localStorage.getItem('nationalId');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare request data with all possible user identifiers to find the user
    const params = {
      userId: userId || '',
      phone: phone || '',
      nationalId: nationalId || ''
    };
    
    
    // Call the API endpoint
    const response = await axios.get(`${API_URL}/loans/address-info`, { 
      headers,
      params
    });
    
    return response.data as ApiResponse;
  } catch (error) {
    console.error('Error fetching address information:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any)?.data as { message?: string };
      return {
        status: 'error',
        message: responseData?.message || 'ไม่สามารถดึงข้อมูลที่อยู่ได้'
      };
    }
    
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Save family contact information to the database
export const saveFamilyContact = async (familyContactData: {
  name: string;
  phone: string;
  relationship: string;
  address: {
    homeNumber: string;
    subdistrict: string;
    district: string;
    province: string;
    zipCode: string;
  };
}): Promise<ApiResponse> => {
  try {
    // Get authentication token and user identifiers
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const userPhone = localStorage.getItem('phoneNumber');
    const nationalId = localStorage.getItem('nationalId');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare request data with all possible user identifiers
    const requestData = {
      familyName: familyContactData.name,
      familyPhone: familyContactData.phone,
      relationship: familyContactData.relationship,
      familyAddress: familyContactData.address,
      phone: userPhone || '',
      userId: userId || '',
      nationalId: nationalId || ''
    };
    
    
    // Call the API endpoint
    const response = await axios.post(`${API_URL}/loans/family-contact`, requestData, { headers });
    
    return response.data as ApiResponse;
  } catch (error) {
    console.error('Error saving family contact information:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any)?.data as { message?: string };
      return {
        status: 'error',
        message: responseData?.message || 'ไม่สามารถบันทึกข้อมูลผู้ติดต่อครอบครัวได้'
      };
    }
    
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Save financial information to the database
export const saveFinancialInfo = async (financialData: {
  bankName: string;
  accountNumber: string;
  accountName: string;
  incomeMonthly: number | string;
  employmentStatus: 'full-time' | 'part-time' | 'self-employed' | 'unemployed';
  loanPurpose: string;
}): Promise<ApiResponse> => {
  try {
    // Get authentication token and user identifiers
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const phone = localStorage.getItem('phoneNumber');
    const nationalId = localStorage.getItem('nationalId');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare request data with all possible user identifiers
    const requestData = {
      financialInfo: financialData,
      userId: userId || '',
      phone: phone || '',
      nationalId: nationalId || ''
    };
    
    
    // Call the API endpoint
    const response = await axios.post(`${API_URL}/loans/financial-info`, requestData, { headers });
    
    return response.data as ApiResponse;
  } catch (error) {
    console.error('Error saving financial information:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any)?.data as { message?: string };
      return {
        status: 'error',
        message: responseData?.message || 'ไม่สามารถบันทึกข้อมูลทางการเงินได้'
      };
    }
    
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Get user's loan details including the ObjectID from MongoDB
export const getUserLoanDetails = async (): Promise<ApiResponse> => {
  try {
    // Get authentication token and user identifiers
    const token = localStorage.getItem('userToken');
    const userId = localStorage.getItem('userId');
    const phone = localStorage.getItem('phoneNumber');
    const nationalId = localStorage.getItem('nationalId');
    const currentLoanId = localStorage.getItem('currentLoanId');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare request params with all possible user identifiers
    const params = {
      userId: userId || '',
      phone: phone || '',
      nationalId: nationalId || '',
      loanId: currentLoanId || ''
    };
    
    
    // Call the API endpoint
    const response = await axios.get(`${API_URL}/loans/details`, { 
      headers,
      params
    });
    
    return response.data as ApiResponse;
  } catch (error) {
    console.error('Error fetching loan details:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      const responseData = axiosError.response?.data as { message?: string };
      
      // Handle 404 as "no loans found" rather than an error
      if (axiosError.response?.status === 404) {
        return {
          status: 'success',
          message: 'No existing loan applications found',
          data: { hasExistingLoan: false, loans: [] }
        };
      }
      
      return {
        status: 'error',
        message: responseData?.message || 'ไม่สามารถดึงข้อมูลรายละเอียดสินเชื่อได้'
      };
    }
    
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};

// Create a loan application directly from the calculator
export const createLoanApplication = async (loanData: {
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  totalPayment?: number; // Optional totalPayment field
  phone: string; // Phone is now required
}): Promise<ApiResponse> => {
  try {
    // Get authentication token
    const token = localStorage.getItem('userToken');
    
    // Set up headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Prepare request data - phone is the only required identifier
    const requestData = {
      ...loanData
    };
    
    
    // Call the API endpoint
    const response = await axios.post(`${API_URL}/loans/create-application`, requestData, { headers });
    
    // Type assertion for the response data
    const responseData = response.data as ApiResponse;
    
    // Store the loan ID in localStorage for future reference
    if (responseData.status === 'success' && responseData.data && 'loanId' in responseData.data) {
      const mongoDbId = responseData.data.loanId as string;
      localStorage.setItem('currentLoanId', mongoDbId);
      localStorage.setItem('mongoDbLoanId', mongoDbId); // Store the MongoDB ObjectID for the application reference number
    }
    
    return responseData;
  } catch (error) {
    console.error('Error creating loan application:', error);
    
    if (error && typeof error === 'object' && 'response' in error) {
      const responseData = (error.response as any)?.data as { 
        message?: string; 
        status?: string;
        data?: {
          existingLoanId?: string;
          existingLoanStatus?: string;
          existingLoanAmount?: number;
        }
      };
      
      // Return the full backend response including existing loan data
      return {
        status: responseData?.status || 'error',
        message: responseData?.message || 'ไม่สามารถสร้างใบสมัครสินเชื่อได้',
        data: responseData?.data || undefined
      };
    }
    
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    };
  }
};
