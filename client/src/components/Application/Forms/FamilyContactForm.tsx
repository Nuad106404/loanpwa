import React, { useState, useEffect, useRef } from 'react';
import { useThailandAddressData, SubDistrict } from '../../../hooks/useThailandAddressData';
import toast from 'react-hot-toast';
import './AddressInfoForm.css';

interface FamilyContactData {
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
}

interface FamilyContactFormProps {
  data: FamilyContactData;
  updateData: (data: Partial<FamilyContactData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FamilyContactForm: React.FC<FamilyContactFormProps> = ({ data, updateData, onNext, onPrev }) => {
  const [formData, setFormData] = useState<FamilyContactData>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  // State to track if family member has same address as applicant
  const [sameAsApplicant, setSameAsApplicant] = useState(false);
  
  // Handle checkbox change for same address as applicant
  const handleSameAddressChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsApplicant(checked);
    
    if (checked) {
      // Show loading indicator
      const loadingToast = toast.loading('Fetching applicant\'s address...');
      
      try {
        // Import the getApplicantAddress function dynamically to avoid circular dependencies
        const { getApplicantAddress } = await import('../../../services/loanService');
        
        // Call the API to get applicant's address from MongoDB
        const response = await getApplicantAddress();
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.status === 'success' && response.data && response.data.address) {
          const applicantAddress = response.data.address;
          
          // Update form data with applicant's address from database
          setFormData(prev => ({
            ...prev,
            address: {
              homeNumber: applicantAddress.homeNumber || '',
              subdistrict: applicantAddress.subdistrict || '',
              district: applicantAddress.district || '',
              province: applicantAddress.province || '',
              zipCode: applicantAddress.zipCode || ''
            }
          }));
          
          // If using the address service hook, update the search query too
          if (setSearchQuery) {
            setSearchQuery(applicantAddress.subdistrict || '');
          }
          
          toast.success('Address copied successfully');
        } else {
          console.warn('No applicant address found in database');
          toast.error('ไม่พบที่อยู่ของผู้สมัคร กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วนก่อน');
          setSameAsApplicant(false);
        }
      } catch (error) {
        // Dismiss loading toast in case of error
        toast.dismiss(loadingToast);
        
        console.error('Error fetching applicant address:', error);
        toast.error('เกิดข้อผิดพลาดในการโหลดที่อยู่ของผู้สมัคร');
        setSameAsApplicant(false);
      }
    } else {
      // Reset address fields if unchecked
      setFormData(prev => ({
        ...prev,
        address: {
          homeNumber: '',
          subdistrict: '',
          district: '',
          province: '',
          zipCode: ''
        }
      }));
      
      // Clear the search query if using the address service hook
      if (setSearchQuery) {
        setSearchQuery('');
      }
    }
    
    // Mark address fields as touched for validation
    setTouched({
      ...touched,
      'address.homeNumber': true,
      'address.subdistrict': true,
      'address.district': true,
      'address.province': true,
      'address.zipCode': true
    });
  };
  // State to track which field is currently focused for styling purposes
  // Use this for highlighting active form field if needed later
  const [, setFocusedField] = useState<string | null>(null);
  // State for address search functionality
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use the Thailand address data hook
  const {
    filteredSubDistricts,
    searchQuery,
    setSearchQuery,
    loading: isLoading,
    selectedDistrict,
    selectedProvince,
    selectedSubDistrict,
    zipCode,
    setAddressBySubDistrict,
    districts,
    provinces,
    zipCodes
  } = useThailandAddressData();

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
  
  // Update form data when selected address changes
  useEffect(() => {
    if (selectedSubDistrict && selectedDistrict && selectedProvince) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          district: selectedDistrict.DISTRICT_NAME,
          province: selectedProvince.PROVINCE_NAME,
          zipCode: zipCode
        }
      }));
    }
  }, [selectedSubDistrict, selectedDistrict, selectedProvince, zipCode]);

  // Relationship options
  const relationshipOptions = [
    'บิดามารดา', 'พี่น้อง', 'คู่สมรส', 'บุตร', 'ญาติ', 'เพื่อน'
  ];

  // Update local form state when parent data changes
  useEffect(() => {
    setFormData(data);
  }, [data]);

  // Validate a single field
  const validateField = (name: string, value: string) => {
    let error = '';
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      if (parent === 'address') {
        switch (child) {
          case 'homeNumber':
            if (!value.trim()) {
              error = 'จำเป็นต้องกรอกเลขที่บ้าน';
            }
            break;
          case 'subdistrict':
            if (!value.trim()) {
              error = 'Subdistrict is required';
            }
            break;
          case 'district':
            if (!value.trim()) {
              error = 'จำเป็นต้องกรอกอำเภอ';
            }
            break;
          case 'province':
            if (!value.trim()) {
              error = 'จำเป็นต้องกรอกจังหวัด';
            }
            break;
          case 'zipCode':
            if (!value.trim()) {
              error = 'จำเป็นต้องกรอกรหัสไปรษณีย์';
            } else if (!/^\d{5}$/.test(value.trim())) {
              error = 'Zip code must be 5 digits';
            }
            break;
        }
      }
    } else {
      switch (name) {
        case 'name':
          if (!value.trim()) {
            error = 'จำเป็นต้องกรอกชื่อสมาชิกในครอบครัว';
          }
          break;
        case 'phone':
          if (!value.trim()) {
            error = 'จำเป็นต้องกรอกหมายเลขโทรศัพท์';
          } else if (!/^\d{10}$/.test(value.trim())) {
            error = 'Phone number must be 10 digits';
          }
          break;
        case 'relationship':
          if (!value.trim()) {
            error = 'จำเป็นต้องเลือกความสัมพันธ์';
          }
          break;
      }
    }
    
    return error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Validate main fields
    ['name', 'phone', 'relationship'].forEach(field => {
      const error = validateField(field, formData[field as keyof FamilyContactData] as string);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });
    
    // Validate address fields
    Object.entries(formData.address).forEach(([key, value]) => {
      const fieldName = `address.${key}`;
      const error = validateField(fieldName, value);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If this is an address field, update the nested address object
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      // For non-address fields, update directly
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Only validate if the field has been touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors({
        ...errors,
        [name]: error
      });
    }
  };
  
  // Handle input focus
  const handleFocus = (fieldName: string) => {
    setFocusedField(fieldName);
  };
  
  // Handle subdistrict search input focus
  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };
  
  // Handle subdistrict search
  const handleSubdistrictSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setIsDropdownOpen(true);
    
    // Also update the formData directly for manual editing
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        subdistrict: value
      }
    }));
  };
  
  // Handle subdistrict selection
  const handleSubdistrictSelect = async (subDistrict: SubDistrict) => {
    try {
      setIsDropdownOpen(false);
      
      // Find district and province directly from our data
      const district = districts.find(d => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
      const province = provinces.find(p => p.PROVINCE_ID === subDistrict.PROVINCE_ID);
      
      // Find zipcode for this subdistrict
      const zipCodeEntry = zipCodes.find(z => 
        z.SUB_DISTRICT_ID === subDistrict.SUB_DISTRICT_ID.toString() || 
        z.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE
      );
      
      let currentZipCode = '';
      if (zipCodeEntry) {
        currentZipCode = zipCodeEntry.ZIPCODE;
      } else {
        // Try to find by district if subdistrict match fails
        const districtZipCode = zipCodes.find(z => district && z.DISTRICT_ID === district.DISTRICT_ID.toString());
        currentZipCode = districtZipCode?.ZIPCODE || '';
      }
      
      // Update form data immediately with the selected address
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          subdistrict: subDistrict.SUB_DISTRICT_NAME,
          district: district?.DISTRICT_NAME || '',
          province: province?.PROVINCE_NAME || '',
          zipCode: currentZipCode
        }
      }));
      
      // Also update the hook state (for consistency)
      setAddressBySubDistrict(subDistrict.SUB_DISTRICT_ID);
      
      // Mark these fields as touched for validation
      setTouched(prev => ({
        ...prev,
        'address.subdistrict': true,
        'address.district': true,
        'address.province': true,
        'address.zipCode': true
      }));
    } catch (error) {
      console.error('Error selecting subdistrict:', error);
      toast.error('ไม่สามารถดึงข้อมูลที่อยู่ได้');
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const allTouched: Record<string, boolean> = {};
    ['name', 'phone', 'relationship'].forEach(field => {
      allTouched[field] = true;
    });
    
    Object.keys(formData.address).forEach(field => {
      allTouched[`address.${field}`] = true;
    });
    
    setTouched(allTouched);
    
    if (validateForm()) {
      // Update local state first
      updateData(formData);
      
      // Show loading toast
      const loadingToast = toast.loading('Saving family contact information...');
      
      try {
        // Import the saveFamilyContact function dynamically to avoid circular dependencies
        const { saveFamilyContact } = await import('../../../services/loanService');
        
        // Call the API to save family contact information to MongoDB
        const response = await saveFamilyContact(formData);
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.status === 'success') {
          toast.success('Family contact information saved successfully');
          
          // Proceed to the next step only after successful API call
          onNext();
        } else {
          toast.error(response.message || 'ไม่สามารถบันทึกข้อมูลผู้ติดต่อครอบครัวได้');
          console.error('Error saving family contact information:', response);
        }
      } catch (error) {
        // Dismiss loading toast in case of error
        toast.dismiss(loadingToast);
        
        console.error('Error in family contact form submission:', error);
        toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิดขณะบันทึกข้อมูลผู้ติดต่อในครอบครัว');
      }
    } else {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };



  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">ข้อมูลการติดต่อครอบครัว</h2>
        <p className="text-gray-600">
          กรุณาระบุข้อมูลการติดต่อของสมาชิกในครอบครัวหรือญาติสนิท บุคคลนี้อาจได้รับการติดต่อ
          ในกรณีที่เราไม่สามารถติดต่อคุณโดยตรงได้
        </p>
      </div>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 text-sm">เหตุผลที่เราต้องการข้อมูลนี้</h3>
            <p className="text-blue-700 text-sm mt-1">ข้อมูลการติดต่อนี้จะใช้เฉพาะในกรณีที่เราไม่สามารถติดต่อคุณโดยตรงได้ และต้องการยืนยันข้อมูลสำคัญเกี่ยวกับเงินกู้ของคุณ</p>
          </div>
        </div>
      </div>  
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">ผู้ติดต่อในครอบครัว</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* Family Member Name */}
            <div className="relative">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                placeholder="กรอกชื่อ-นามสกุลของสมาชิกในครอบครัว"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-500 error">{errors.name}</p>}
          </div>
          
          {/* Relationship */}
          <div className="relative">
            <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
              ความสัมพันธ์ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <select
                id="relationship"
                name="relationship"
                value={formData.relationship}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.relationship ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
              >
                <option value="">เลือกความสัมพันธ์</option>
                {relationshipOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            {errors.relationship && <p className="mt-1 text-sm text-red-500 error">{errors.relationship}</p>}
          </div>
          
          {/* Phone Number */}
          <div className="relative">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              หมายเลขโทรศัพท์ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                placeholder="กรอกหมายเลขโทรศัพท์ 10 หลัก"
                maxLength={10}
              />
            </div>
            {errors.phone && <p className="mt-1 text-sm text-red-500 error">{errors.phone}</p>}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">ที่อยู่ของผู้ติดต่อ</h3>
          
          {/* Same as Applicant Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sameAddress"
              checked={sameAsApplicant}
              onChange={handleSameAddressChange}
              className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
            />
            <label htmlFor="sameAddress" className="ml-2 text-sm text-gray-700 cursor-pointer flex items-center">
              <span>เหมือนกับผู้สมัคร</span>
              <span className="ml-1 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">กรอกอัตโนมัติ</span>
            </label>
          </div>
          </div>
        </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* House Number */}
            <div>
              <label htmlFor="address.homeNumber" className="block text-sm font-medium text-gray-700 mb-1">
                เลขที่บ้าน/อาคาร <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3.5 7a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm5 2a.5.5 0 01.5-.5h2a.5.5 0 010 1h-2a.5.5 0 01-.5-.5z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="address.homeNumber"
                  name="address.homeNumber"
                  value={formData.address.homeNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors['address.homeNumber'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                  placeholder="กรอกเลขที่บ้าน/อาคาร"
                />
              </div>
              {errors['address.homeNumber'] && <p className="mt-1 text-sm text-red-500 error">{errors['address.homeNumber']}</p>}
            </div>
          
          {/* Subdistrict - with autocomplete */}
          <div className="relative">
            <label htmlFor="searchSubdistrict" className="block text-sm font-medium text-gray-700 mb-1">
              ตำบล <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <input
                type="text"
                id="searchSubdistrict"
                value={searchQuery}
                onChange={handleSubdistrictSearch}
                onFocus={handleInputFocus}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors['address.subdistrict'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                placeholder="ค้นหาตำบล..."
                autoComplete="off"
              />
              {isLoading && <div className="absolute right-3 top-2"><div className="loading-spinner"></div></div>}
            </div>
            
            {/* Subdistrict dropdown */}
            {isDropdownOpen && searchQuery.trim().length > 1 && (
              <div 
                ref={dropdownRef}
                className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm"
              >
                {isLoading ? (
                  <div className="px-4 py-2 text-gray-500">Loading...</div>
                ) : filteredSubDistricts.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredSubDistricts.map((subDistrict) => {
                      // Get district and province for this subdistrict
                      const district = districts.find((d) => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
                      const province = provinces.find((p) => p.PROVINCE_ID === subDistrict.PROVINCE_ID);
                      // Get zipcode for this subdistrict
                      const subDistrictZipCode = zipCodes.find((z) => 
                        z.SUB_DISTRICT_ID === subDistrict.SUB_DISTRICT_ID.toString() || 
                        z.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE
                      );
                      
                      return (
                        <li 
                          key={subDistrict.SUB_DISTRICT_ID}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => handleSubdistrictSelect(subDistrict)}
                        >
                          <div className="w-full">
                            <div className="font-medium text-blue-600">
                              {subDistrict.SUB_DISTRICT_NAME}
                            </div>
                            <div className="text-sm text-gray-600">
                              {/* Format: บ้านดู่ » นาโพธิ์ » บุรีรัมย์ » 31230 */}
                              {subDistrict.SUB_DISTRICT_NAME} » {district?.DISTRICT_NAME || ''} » {province?.PROVINCE_NAME || ''} » {subDistrictZipCode?.ZIPCODE || ''}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-4 py-2 text-gray-500">No results found</div>
                )}
              </div>
            )}
            {errors['address.subdistrict'] && <p className="mt-1 text-sm text-red-500 error">{errors['address.subdistrict']}</p>}
          </div>
          
          {/* District */}
          <div>
            <label htmlFor="address.district" className="block text-sm font-medium text-gray-700 mb-1">
              อำเภอ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                id="address.district"
                name="address.district"
                value={formData.address.district}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={() => handleFocus('address.district')}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors['address.district'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                placeholder="กรอกอำเภอหรือใช้การกรอกอัตโนมัติ"
              />
            </div>
            {errors['address.district'] && <p className="mt-1 text-sm text-red-500 error">{errors['address.district']}</p>}
          </div>
          
          {/* Province */}
          <div className="relative">
            <label htmlFor="address.province" className="block text-sm font-medium text-gray-700 mb-1">
              จังหวัด <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <input
                type="text"
                id="address.province"
                name="address.province"
                value={formData.address.province}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={() => handleFocus('address.province')}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors['address.province'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                placeholder="กรอกจังหวัดหรือใช้การกรอกอัตโนมัติ"
              />
            </div>
            {errors['address.province'] && <p className="mt-1 text-sm text-red-500 error">{errors['address.province']}</p>}
          </div>
          
          {/* Zip Code */}
          <div className="relative">
            <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              รหัสไปรษณีย์ <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v10a1 1 0 01-1 1h-3.96L8.7 14.3a1 1 0 01-1.4 0L6.04 13H2a1 1 0 01-1-1V2a1 1 0 011-1h2zm3 3.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                id="address.zipCode"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={() => handleFocus('address.zipCode')}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors['address.zipCode'] ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-200'}`}
                placeholder="กรอกรหัสไปรษณีย์ 5 หลักหรือใช้การกรอกอัตโนมัติ"
                maxLength={5}
              />
            </div>
            {isLoading && <div className="loading-spinner mt-1"></div>}
            {errors['address.zipCode'] && <p className="mt-1 text-sm text-red-500 error">{errors['address.zipCode']}</p>}
          </div>
        </div>
        
        <div className="mt-10 flex justify-between items-center">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-3 flex items-center border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            ย้อนกลับ
          </button>
          
          <div className="flex items-center">
            <button
              type="submit"
              className="px-6 py-3 flex items-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-300 shadow-sm"
            >
              ดำเนินการต่อ
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default FamilyContactForm;
