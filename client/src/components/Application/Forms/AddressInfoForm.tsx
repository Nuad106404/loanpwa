import React, { useState, useEffect, useRef } from 'react';
import { useThailandAddressData } from '../../../services/addressService';
import { saveAddressInfo } from '../../../services/loanService';
import toast from 'react-hot-toast';
import './AddressInfoForm.css';

interface AddressInfoData {
  homeNumber: string;
  subdistrict: string;
  district: string;
  province: string;
  zipCode: string;
}

interface AddressInfoFormProps {
  data: AddressInfoData;
  updateData: (data: Partial<AddressInfoData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const AddressInfoForm: React.FC<AddressInfoFormProps> = ({ data, updateData, onNext, onPrev }) => {
  // Form data state
  const [formData, setFormData] = useState<AddressInfoData>(data);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInfoData, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  // Reference for click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use the Thailand address data hook
  const {
    // Using only what we need and removing unused variables to fix lint warnings
    filteredSubDistricts,
    selectedProvince,
    selectedDistrict,
    zipCode,
    loading,
    searchQuery,
    setSearchQuery,
    setAddressBySubDistrict
  } = useThailandAddressData();
  
  // Update local form state when parent data changes
  useEffect(() => {
    setFormData(data);
  }, [data]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update zipCode when it changes in the address service
  useEffect(() => {
    if (zipCode) {
      setFormData(prev => {
        if (prev.zipCode !== zipCode) {
          return { ...prev, zipCode };
        }
        return prev;
      });
    }
  }, [zipCode]);
  
  // Calculate completion percentage whenever form data changes
  useEffect(() => {
    const totalFields = 5; // Total number of fields in the form
    const filledFields = Object.values(formData)
      .filter(value => String(value).trim() !== '').length;
    setCompletionPercentage((filledFields / totalFields) * 100);
  }, [formData]);
  
  // Validate a single field
  const validateField = (name: string, value: string): string => {
    let error = '';
    
    switch (name) {
      case 'homeNumber':
        if (!value.trim()) {
          error = 'House number is required';
        }
        break;
      case 'subdistrict':
        if (!value.trim()) {
          error = 'Subdistrict is required';
        }
        break;
      case 'district':
        if (!value.trim()) {
          error = 'District is required';
        }
        break;
      case 'province':
        if (!value.trim()) {
          error = 'Province is required';
        }
        break;
      case 'zipCode':
        if (!value.trim()) {
          error = 'Zip code is required';
        } else if (!/^\d{5}$/.test(value.trim())) {
          error = 'Zip code must be 5 digits';
        }
        break;
      default:
        break;
    }
    
    return error;
  };
  
  // Validate all form fields
  const validateForm = (): Partial<Record<keyof AddressInfoData, string>> => {
    const newErrors: Partial<Record<keyof AddressInfoData, string>> = {};
    let isValid = true;
    
    // Validate each field
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value as string);
      if (error) {
        newErrors[key as keyof AddressInfoData] = error;
        isValid = false;
      }
    });
    
    return newErrors;
  };
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate on change if the field has been touched
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, value)
      }));
    }
  };
  
  // Handle input focus
  const handleFocus = (fieldName: string): void => {
    setFocusedField(fieldName);
  };
  
  // Handle dropdown input focus
  const handleInputFocus = (): void => {
    setFocusedField('subdistrict');
    setIsDropdownOpen(true);
  };
  
  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    // Don't unfocus if clicking on a dropdown item
    if (e.relatedTarget?.className.includes('dropdown-item')) {
      return;
    }
    
    setFocusedField(null);
    setTouched(prev => ({ ...prev, [name]: true }));
    
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };
  
  // Handle subdistrict search
  const handleSubdistrictSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchQuery(e.target.value);
    setIsDropdownOpen(true);
  };
  
  // Handle subdistrict selection
  const handleSubdistrictSelect = async (subDistrictId: number): Promise<void> => {
    await setAddressBySubDistrict(subDistrictId);
    
    setTimeout(() => {
      const subDistrict = filteredSubDistricts.find(sd => sd.SUB_DISTRICT_ID === subDistrictId);
      if (!subDistrict) return;
      
      const enhancedData: any = subDistrict;
      
      setFormData(prev => {
        const newZipCode = enhancedData.ZIP_CODE || zipCode || prev.zipCode || '';
        
        return {
          ...prev,
          subdistrict: subDistrict.SUB_DISTRICT_NAME,
          district: enhancedData.DISTRICT_NAME || selectedDistrict?.DISTRICT_NAME || '',
          province: enhancedData.PROVINCE_NAME || selectedProvince?.PROVINCE_NAME || '',
          zipCode: newZipCode
        };
      });
      
      // Close dropdown and clear search
      setIsDropdownOpen(false);
      setSearchQuery('');
    }, 100);
    
    // Mark fields as touched
    setTouched(prev => ({
      ...prev,
      subdistrict: true,
      district: true,
      province: true,
      zipCode: true
    }));
    
    // Clear any errors
    setErrors(prev => ({
      ...prev,
      subdistrict: '',
      district: '',
      province: '',
      zipCode: ''
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validate all fields
    const validationErrors = validateForm();
    setErrors(validationErrors);
    
    // If no errors, save address data to server then proceed
    if (Object.keys(validationErrors).length === 0) {
      try {
        // Show loading indicator
        const loadingToast = toast.loading('Saving address information...');
        
        // Save address information to the database
        const response = await saveAddressInfo({
          homeNumber: formData.homeNumber,
          subdistrict: formData.subdistrict,
          district: formData.district,
          province: formData.province,
          zipCode: formData.zipCode
        });
        
        // Save to localStorage for use in other forms (e.g., 'Same as applicant' feature)
        localStorage.setItem('applicantAddress', JSON.stringify({
          homeNumber: formData.homeNumber,
          subdistrict: formData.subdistrict,
          district: formData.district,
          province: formData.province,
          zipCode: formData.zipCode
        }));
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.status === 'success') {
          toast.success('Address information saved successfully!');
          updateData(formData);
          onNext();
        } else {
          toast.error(response.message || 'ไม่สามารถบันทึกข้อมูลที่อยู่ได้');
        }
      } catch (error) {
        console.error('Error saving address information:', error);
        toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      }
    }
  };
  
  // Determine if an input should have the filled class
  const isFieldFilled = (fieldName: keyof AddressInfoData): boolean => {
    return formData[fieldName].trim() !== '';
  };
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4">ข้อมูลที่อยู่</h3>
      
      {/* Progress Indicator */}
      <div className="progress-container mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-sm text-gray-600">ความคืบหน้าแบบฟอร์ม</span>
          <span className="text-sm font-medium text-indigo-600">{Math.round(completionPercentage)}%</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-6">
          {/* 1. House Number with floating label */}
          <div className="input-group">
            <input
              type="text"
              id="homeNumber"
              name="homeNumber"
              value={formData.homeNumber}
              onChange={handleInputChange}
              onFocus={() => handleFocus('homeNumber')}
              onBlur={handleBlur}
              className={`${isFieldFilled('homeNumber') ? 'filled' : ''} ${errors.homeNumber ? 'input-error' : ''}`}
              placeholder=" "
            />
            <label htmlFor="homeNumber" className={`${focusedField === 'homeNumber' ? 'focused' : ''}`}>
              เลขที่บ้าน/อาคาร <span className="text-red-500">*</span>
            </label>
            
            {isFieldFilled('homeNumber') && (
              <div className="success-icon">✓</div>
            )}
            
            {errors.homeNumber && <p className="error-message">{errors.homeNumber}</p>}
          </div>
          
          {/* Section header for address search */}
          <div className="mt-6 mb-2">
            <h3 className="text-md font-semibold text-gray-700">ค้นหาที่อยู่ของคุณ</h3>
            <p className="text-sm text-gray-500">ค้นหาด้วยชื่อตำบลหรือชื่ออำเภอ</p>
          </div>
          
          {/* 2. Subdistrict Search with dropdown and floating label */}
          <div className="input-group dropdown-container" ref={dropdownRef}>
            <input
              type="text"
              id="subdistrictSearch"
              className={`dropdown-input ${isFieldFilled('subdistrict') ? 'filled' : ''} ${errors.subdistrict ? 'input-error' : ''}`}
              value={searchQuery}
              onChange={handleSubdistrictSearch}
              onFocus={handleInputFocus}
              onBlur={handleBlur}
              placeholder="กรอกชื่อตำบลหรืออำเภอ..."
            />
            <label htmlFor="subdistrictSearch" className={`${focusedField === 'subdistrict' || isFieldFilled('subdistrict') ? 'focused' : ''}`}>
              ค้นหาตามตำบลหรืออำเภอ <span className="text-red-500">*</span>
            </label>
            
            {isFieldFilled('subdistrict') && (
              <div className="success-icon">✓</div>
            )}
            
            {errors.subdistrict && <p className="error-message">{errors.subdistrict}</p>}
            
            {/* Search Results Dropdown */}
            {isDropdownOpen && filteredSubDistricts.length > 0 && (
              <div className="dropdown-results">
                {filteredSubDistricts.map((subdistrict: any) => {
                  // Highlight matching text if there's a search query
                  const highlightName = searchQuery ? 
                    subdistrict.SUB_DISTRICT_NAME.replace(
                      new RegExp(searchQuery, 'gi'),
                      (match: string) => `<span class="dropdown-highlight">${match}</span>`
                    ) : subdistrict.SUB_DISTRICT_NAME;
                    
                  return (
                    <div 
                      key={subdistrict.SUB_DISTRICT_ID} 
                      className="dropdown-item"
                      onClick={() => handleSubdistrictSelect(subdistrict.SUB_DISTRICT_ID)}
                    >
                      <div className="text-sm">
                        <span 
                          className="font-medium" 
                          dangerouslySetInnerHTML={{ __html: highlightName }}
                        />
                        {subdistrict.DISTRICT_NAME && (
                          <> » <span>{subdistrict.DISTRICT_NAME}</span></>
                        )}
                        {subdistrict.PROVINCE_NAME && (
                          <> » <span>{subdistrict.PROVINCE_NAME}</span></>
                        )}
                        {subdistrict.ZIP_CODE && (
                          <> » <span className="text-gray-500">{subdistrict.ZIP_CODE}</span></>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredSubDistricts.length >= 200 && (
                  <div className="p-2 text-xs text-center text-gray-500">
                    Showing first 200 results. Please refine your search if you don't see your location.
                  </div>
                )}
              </div>
            )}
            
            {/* Loading state with spinner */}
            {isDropdownOpen && loading && (
              <div className="dropdown-results">
                <div className="dropdown-empty">
                  <div className="loading-spinner"></div>
                  <span className="ml-2">Loading results...</span>
                </div>
              </div>
            )}
            
            {/* Empty state with helpful suggestions */}
            {isDropdownOpen && !loading && searchQuery && filteredSubDistricts.length === 0 && (
              <div className="dropdown-results">
                <div className="dropdown-empty">
                  <p className="font-medium mb-2">No matching locations found</p>
                  <p className="text-sm mb-2">Try these search tips:</p>
                  <ul className="list-disc pl-5 text-xs text-left">
                    <li>Use Thai language for better results</li>
                    <li>Try searching by district name</li>
                    <li>Try with partial names</li>
                    <li>Check for spelling errors</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Divider for address fields */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-sm text-gray-500">รายละเอียดที่อยู่</span>
            </div>
          </div>
          
          {/* Subdistrict field - editable */}
          <div className="input-group">
            <input
              type="text"
              id="subdistrict"
              name="subdistrict"
              value={formData.subdistrict}
              onChange={handleInputChange}
              onFocus={() => handleFocus('subdistrict')}
              onBlur={handleBlur}
              className={`${isFieldFilled('subdistrict') ? 'filled' : ''} ${errors.subdistrict ? 'input-error' : ''}`}
              placeholder=" "
            />
            <label htmlFor="subdistrict" className={`${focusedField === 'subdistrict' ? 'focused' : ''}`}>
              ตำบล <span className="text-red-500">*</span>
            </label>
            
            {isFieldFilled('subdistrict') && (
              <div className="success-icon">✓</div>
            )}
            {errors.subdistrict && <p className="error-message">{errors.subdistrict}</p>}
          </div>
          
          {/* District field - editable */}
          <div className="input-group">
            <input
              type="text"
              id="district"
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              onFocus={() => handleFocus('district')}
              onBlur={handleBlur}
              className={`${isFieldFilled('district') ? 'filled' : ''} ${errors.district ? 'input-error' : ''}`}
              placeholder=" "
            />
            <label htmlFor="district" className={`${focusedField === 'district' ? 'focused' : ''}`}>
              อำเภอ <span className="text-red-500">*</span>
            </label>
            
            {isFieldFilled('district') && (
              <div className="success-icon">✓</div>
            )}
            {errors.district && <p className="error-message">{errors.district}</p>}
          </div>
          
          {/* Province field - editable */}
          <div className="input-group">
            <input
              type="text"
              id="province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              onFocus={() => handleFocus('province')}
              onBlur={handleBlur}
              className={`${isFieldFilled('province') ? 'filled' : ''} ${errors.province ? 'input-error' : ''}`}
              placeholder=" "
            />
            <label htmlFor="province" className={`${focusedField === 'province' ? 'focused' : ''}`}>
              จังหวัด <span className="text-red-500">*</span>
            </label>
            
            {isFieldFilled('province') && (
              <div className="success-icon">✓</div>
            )}
            {errors.province && <p className="error-message">{errors.province}</p>}
          </div>
          
          {/* Zip Code field - editable */}
          <div className="input-group">
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              onFocus={() => handleFocus('zipCode')}
              onBlur={handleBlur}
              className={`${isFieldFilled('zipCode') ? 'filled' : ''} ${errors.zipCode ? 'input-error' : ''}`}
              maxLength={5}
              placeholder=" "
            />
            <label htmlFor="zipCode" className={`${focusedField === 'zipCode' ? 'focused' : ''}`}>
              รหัสไปรษณีย์ <span className="text-red-500">*</span>
            </label>
            
            {isFieldFilled('zipCode') && (
              <div className="success-icon">✓</div>
            )}
            {loading && <div className="loading-spinner mt-1"></div>}
            {errors.zipCode && <p className="error-message">{errors.zipCode}</p>}
          </div>
        </div>
        
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
                ย้อนกลับ
            </span>
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <span className="flex items-center">
              ดำเนินการต่อ
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddressInfoForm;
