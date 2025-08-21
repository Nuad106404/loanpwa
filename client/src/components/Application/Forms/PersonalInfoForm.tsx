import React, { useState, useEffect } from 'react';
import { savePersonalInfo } from '../../../services/loanService';
import toast from 'react-hot-toast';

interface PersonalInfoData {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  dateOfBirth: string;
}

interface PersonalInfoFormProps {
  data: PersonalInfoData;
  updateData: (data: PersonalInfoData) => void;
  onNext: () => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ data, updateData, onNext }) => {
  // Removed unused user variable from useAuth()
  const [formData, setFormData] = useState<PersonalInfoData>(data);
  const [errors, setErrors] = useState<Partial<PersonalInfoData>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load any existing userId from localStorage and other critical data
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedPhone = localStorage.getItem('phoneNumber');
    const savedNationalId = localStorage.getItem('nationalId');
    
    
    // If we have either a userId or phone number saved, but no nationalId saved yet and we have one in the form,
    // store the nationalId immediately for future reference
    if ((savedUserId || savedPhone) && !savedNationalId && formData.nationalId) {
      localStorage.setItem('nationalId', formData.nationalId);
    }
  }, [formData.nationalId]);

  // Debug stored identifiers when component mounts
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    const currentPhone = localStorage.getItem('phoneNumber'); 
    const currentNationalId = localStorage.getItem('nationalId');
  }, []); // Only run once when component mounts

  // Update local form state when parent data changes
  useEffect(() => {
    setFormData(data);
  }, [data]);

  // Validate a single field
  const validateField = (name: string, value: string) => {
    let error = '';
    
    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value.trim()) {
          error = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
        }
        break;
      case 'nationalId':
        if (!value.trim()) {
          error = 'National ID is required';
        } else if (!/^\d{13}$/.test(value.trim())) {
          error = 'National ID must be 13 digits';
        }
        break;
      case 'phone':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else if (!/^\d{10}$/.test(value.trim())) {
          error = 'Phone number must be 10 digits';
        }
        break;
      case 'dateOfBirth':
        if (!value) {
          error = 'Date of birth is required';
        } else {
          const dob = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - dob.getFullYear();
          
          if (age < 18) {
            error = 'You must be at least 18 years old';
          } else if (age > 100) {
            error = 'กรุณาระบุวันเกิดที่ถูกต้อง';
          }
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors: Partial<PersonalInfoData> = {};
    let isValid = true;
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value as string);
      if (error) {
        newErrors[key as keyof PersonalInfoData] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate on change if the field has been touched
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Get the current userId from localStorage BEFORE we update other values
        const currentUserId = localStorage.getItem('userId');
        
        // Store phone number and national ID in localStorage for use in subsequent steps
        // DON'T UPDATE these values yet so we can still find the user by original values
        const originalPhone = localStorage.getItem('phoneNumber');
        const originalNationalId = localStorage.getItem('nationalId');
        
        // Show loading toast
        const loadingToast = toast.loading('Saving personal information...');
        
        
        // Save to MongoDB
        const response = await savePersonalInfo(formData);
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.status === 'success') {
          // IMPORTANT: Always update userId from response to ensure we have the correct ID
          if (response.data?.userId) {
            // Force update userId in localStorage with the value from the server
            localStorage.setItem('userId', response.data.userId.toString());
          } else if (response.data?.user?.id) {
            localStorage.setItem('userId', response.data.user.id.toString());
          }
          
          // Only update local storage with new values AFTER successful update
          localStorage.setItem('phoneNumber', formData.phone);
          localStorage.setItem('nationalId', formData.nationalId);
          
          // Show success and continue
          toast.success('Personal information saved successfully');
          updateData(formData);
          onNext();
        } else {
          toast.error(response.message || 'ไม่สามารถบันทึกข้อมูลได้');
        }
      } catch (error) {
        console.error('Error saving form:', error);
        toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Form validation failed
      const firstErrorField = document.querySelector('.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">ข้อมูลส่วนตัว</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อจริง <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.firstName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="กรอกชื่อของคุณ"
            />
            {errors.firstName && <p className="mt-1 text-sm text-red-500 error">{errors.firstName}</p>}
          </div>
          
          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              นามสกุล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.lastName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="กรอกนามสกุลของคุณ"
            />
            {errors.lastName && <p className="mt-1 text-sm text-red-500 error">{errors.lastName}</p>}
          </div>
          
          {/* National ID */}
          <div>
            <label htmlFor="nationalId" className="block text-sm font-medium text-gray-700 mb-1">
              เลขบัตรประจำตัวประชาชน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nationalId"
              name="nationalId"
              value={formData.nationalId}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.nationalId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="Enter your 13-digit ID number"
              maxLength={13}
            />
            {errors.nationalId && <p className="mt-1 text-sm text-red-500 error">{errors.nationalId}</p>}
          </div>
          
          {/* Phone Number */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="Enter your 10-digit phone number"
              maxLength={10}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500 error">{errors.phone}</p>}
          </div>
          
          {/* Date of Birth */}
          <div className="md:col-span-2">
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              วันเกิด <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <p className="mt-1 text-sm text-red-500 error">{errors.dateOfBirth}</p>}
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังบันทึก...
              </>
            ) : (
              'ดำเนินการต่อ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalInfoForm;
