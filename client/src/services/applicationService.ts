import axios from 'axios';

// Auth utility functions (matching the ones defined in authUtils.ts)
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api`;

// Define interfaces that match MongoDB schema structure
export interface PersonalInformation {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  nationalId: string;
}

export interface Documents {
  idCardFront: {
    url: string;
    verified: boolean;
  };
  idCardBack: {
    url: string;
    verified: boolean;
  };
  selfieWithId: {
    url: string;
    verified: boolean;
  };
}

export interface Address {
  homeNumber: string;
  subdistrict: string;
  district: string;
  province: string;
  zipCode: string;
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface FinancialInformation {
  incomeMonthly: number;
  employmentStatus: 'full-time' | 'part-time' | 'self-employed' | 'unemployed';
  loanPurpose: string;
}

export interface FamilyContact {
  familyName: string;
  familyPhone: string;
  relationship: string;
  address?: {
    houseNumber: string;
    subdistrict: string;
    district: string;
    province: string;
    zipCode: string;
  };
}

// Main application data interface that matches MongoDB User model
export interface ApplicationData {
  personalInformation: PersonalInformation;
  phone: string;
  documents: Documents;
  signatureUrl?: string;
  address: Address;
  bankAccount: BankAccount;
  financialInformation: FinancialInformation;
  familyContact: FamilyContact;
}

// Client form data interface (used in the UI forms)
export interface ClientFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  
  // ID Verification
  idCardFront: File | string | null;
  idCardBack: File | string | null;
  selfieWithId: File | string | null;
  signature: string | null;
  
  // Address
  homeNumber: string;
  subdistrict: string;
  district: string;
  province: string;
  zipCode: string;
  
  // Financial Information
  bankName: string;
  accountNumber: string;
  accountName: string;
  incomeMonthly: string;
  employmentStatus: string;
  loanPurpose: string;
  occupation?: string;
  employer?: string;
  
  // Family Contact
  familyName: string;
  familyPhone: string;
  relationship: string;
  familyHouseNumber?: string;
  familySubdistrict?: string;
  familyDistrict?: string;
  familyProvince?: string;
  familyZipCode?: string;
}

// API response interfaces for type safety
export interface ApiSuccessResponse {
  status: 'success';
  data: {
    referenceNumber?: string;
    url?: string;
    [key: string]: any;
  };
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// Map client form data to MongoDB schema structure
export const mapFormDataToApplicationData = (formData: ClientFormData): ApplicationData => {
  // Helper function to safely get URL from either File or string
  const getUrlFromFileOrString = (value: File | string | null): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return URL.createObjectURL(value); // Create temporary URL for File objects
  };
  
  return {
    personalInformation: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      nationalId: formData.nationalId,
      dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined
    },
    phone: formData.phone,
    documents: {
      idCardFront: {
        url: getUrlFromFileOrString(formData.idCardFront),
        verified: false
      },
      idCardBack: {
        url: getUrlFromFileOrString(formData.idCardBack),
        verified: false
      },
      selfieWithId: {
        url: getUrlFromFileOrString(formData.selfieWithId),
        verified: false
      }
    },
    signatureUrl: formData.signature || undefined,
    address: {
      homeNumber: formData.homeNumber,
      subdistrict: formData.subdistrict,
      district: formData.district,
      province: formData.province,
      zipCode: formData.zipCode
    },
    bankAccount: {
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      accountName: formData.accountName
    },
    financialInformation: {
      incomeMonthly: parseFloat(formData.incomeMonthly),
      employmentStatus: formData.employmentStatus.toLowerCase().replace('-', '') as 'full-time' | 'part-time' | 'self-employed' | 'unemployed',
      loanPurpose: formData.loanPurpose,
      // Add optional fields if provided
      ...(formData.occupation ? { occupation: formData.occupation } : {}),
      ...(formData.employer ? { employer: formData.employer } : {})
    },
    familyContact: {
      familyName: formData.familyName,
      familyPhone: formData.familyPhone,
      relationship: formData.relationship,
      address: formData.familyHouseNumber ? {
        houseNumber: formData.familyHouseNumber,
        subdistrict: formData.familySubdistrict || '',
        district: formData.familyDistrict || '',
        province: formData.familyProvince || '',
        zipCode: formData.familyZipCode || ''
      } : undefined
    }
  };
};

// Submit application data to the backend
export const submitApplication = async (formData: ClientFormData): Promise<ApiResponse> => {
  try {
    const token = getAuthToken();
    const applicationData = mapFormDataToApplicationData(formData);
    
    const response = await axios.post(`${API_URL}/applications`, applicationData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseData = response.data as Record<string, any>;
    
    return {
      status: 'success',
      data: {
        referenceNumber: responseData.referenceNumber || `APP-${Math.floor(Math.random() * 1000000)}`,
        ...responseData
      }
    };
  } catch (error: any) {
    console.error('Error submitting application:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'ไม่สามารถส่งใบสมัครได้'
    };
  }
};



// Upload a document (ID card front, back, selfie, etc.)
export const uploadDocument = async (file: File, documentType: string): Promise<ApiResponse> => {
  try {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('document', file);
    formData.append('type', documentType);
    
    const response = await axios.post(`${API_URL}/documents/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const responseData = response.data as Record<string, any>;
    
    return {
      status: 'success',
      data: {
        url: responseData.url || URL.createObjectURL(file), // Fallback to local URL if server doesn't provide one
        ...responseData
      }
    };
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return {
      status: 'error',
      message: error.response?.data?.message || 'ไม่สามารถอัปโหลดเอกสารได้'
    };
  }
};
