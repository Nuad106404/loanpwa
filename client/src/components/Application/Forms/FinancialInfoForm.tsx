import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { saveFinancialInfo } from '../../../services/loanService';

interface FinancialInfoData {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  monthlyIncome: number;
  employmentStatus: 'full-time' | 'part-time' | 'self-employed' | 'unemployed';
  loanPurpose: string;
}

interface FinancialInfoFormProps {
  data: FinancialInfoData;
  updateData: (data: Partial<FinancialInfoData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const FinancialInfoForm: React.FC<FinancialInfoFormProps> = ({ data, updateData, onNext, onPrev }) => {
  const [formData, setFormData] = useState<FinancialInfoData>(data);
  const [errors, setErrors] = useState<Partial<Record<keyof FinancialInfoData, string>>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Thai banks list
  const thBanks = [
    'ธนาคารกรุงเทพ',
    'ธนาคารกสิกรไทย',
    'ธนาคารกรุงไทย',
    'ธนาคารไทยพาณิชย์',
    'ธนาคารกรุงศรีอยุธยา',
    'ธนาคารทีเอ็มบีธนชาต',
    'ธนาคารออมสิน',
    'ธนาคารเกียรตินาคินภัทร',
    'ธนาคารซีไอเอ็มบีไทย',
    'ธนาคารแลนด์ แอนด์ เฮ้าส์',
    'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร',
    'ธนาคารอิสลามแห่งประเทศไทย',
    'ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย',
    'ธนาคารไทยเครดิต เพื่อรายย่อย',
    'ธนาคารเมกะ สากลพาณิชย์'
  ].sort();

  // Employment status options
  const employmentStatusOptions = [
    { value: 'full-time', label: 'ทำงานเต็มเวลา' },
    { value: 'part-time', label: 'ทำงานพาร์ทไทม์' },
    { value: 'self-employed', label: 'ประกอบอาชีพอิสระ' },
    { value: 'unemployed', label: 'ว่างงาน' }
  ];

  // Update local form state when parent data changes
  useEffect(() => {
    setFormData(data);
  }, [data]);

  // Validate a single field
  const validateField = (name: string, value: string | number) => {
    let error = '';
    
    switch (name) {
      case 'bankName':
        if (!value) {
          error = 'Bank name is required';
        }
        break;
      case 'accountNumber':
        if (!value) {
          error = 'Account number is required';
        } else {
          const accountNumberStr = value.toString();
          if (accountNumberStr.length < 10 || accountNumberStr.length > 15) {
            error = 'Account number must be between 10-15 digits';
          } else if (!/^\d+$/.test(accountNumberStr)) {
            error = 'Account number must contain only digits';
          }
        }
        break;
      case 'accountHolderName':
        if (!value) {
          error = 'Account holder name is required';
        }
        break;
      case 'monthlyIncome':
        if (!value && value !== 0) {
          error = 'Monthly income is required';
        } else if (typeof value === 'number' && value < 0) {
          error = 'Monthly income cannot be negative';
        }
        break;
      case 'employmentStatus':
        if (!value) {
          error = 'Employment status is required';
        }
        break;
      case 'loanPurpose':
        if (!value) {
          error = 'Loan purpose is required';
        }
        break;
      default:
        break;
    }
    
    return error;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors: Partial<Record<keyof FinancialInfoData, string>> = {};
    let isValid = true;
    
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value as string | number);
      if (error) {
        newErrors[key as keyof FinancialInfoData] = error;
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to actual numbers
    if (type === 'number') {
      setFormData({ ...formData, [name]: value ? parseFloat(value) : '' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Validate on change if the field has been touched
    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, type === 'number' ? (value ? parseFloat(value) : '') : value)
      }));
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, type === 'number' ? (value ? parseFloat(value) : '') : value)
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        // Show loading toast
        toast.loading('Saving financial information...');
        
        // Format data for the API
        const financialData = {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountHolderName,  // Map to the correct field name
          incomeMonthly: formData.monthlyIncome,    // Map to the correct field name
          employmentStatus: formData.employmentStatus,
          loanPurpose: formData.loanPurpose
        };
        
        // Call the API to save financial information
        const response = await saveFinancialInfo(financialData);
        
        // Dismiss loading toast
        toast.dismiss();
        
        if (response.status === 'success') {
          // Show success message
          toast.success('Financial information saved successfully');
          
          // Update parent data
          updateData(formData);
          
          // Proceed to next step
          onNext();
        } else {
          // Show error message
          toast.error(response.message || 'ไม่สามารถบันทึกข้อมูลทางการเงินได้');
        }
      } catch (error) {
        // Dismiss loading toast
        toast.dismiss();
        
        // Show error message
        toast.error('An error occurred while saving financial information');
        console.error('Error saving financial information:', error);
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
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">ข้อมูลทางการเงิน</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bank Name */}
          <div>
            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อธนาคาร <span className="text-red-500">*</span>
            </label>
            <select
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.bankName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
            >
              <option value="">เลือกธนาคาร</option>
              {thBanks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
            {errors.bankName && <p className="mt-1 text-sm text-red-500 error">{errors.bankName}</p>}
          </div>
          
          {/* Account Number */}
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
              เลขที่บัญชี <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.accountNumber ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="กรอกหมายเลขบัญชีธนาคารของคุณ"
              maxLength={15}
            />
            {errors.accountNumber && <p className="mt-1 text-sm text-red-500 error">{errors.accountNumber}</p>}
          </div>
          
          {/* Account Holder Name */}
          <div>
            <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อเจ้าของบัญชี <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="accountHolderName"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.accountHolderName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="กรอกชื่อเจ้าของบัญชีธนาคาร"
            />
            {errors.accountHolderName && <p className="mt-1 text-sm text-red-500 error">{errors.accountHolderName}</p>}
          </div>
          
          {/* Monthly Income */}
          <div>
            <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700 mb-1">
              รายได้ต่อเดือน (บาท) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="monthlyIncome"
              name="monthlyIncome"
              value={formData.monthlyIncome || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              min="0"
              step="1000"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.monthlyIncome ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="กรอกรายได้รายเดือนของคุณ"
            />
            {errors.monthlyIncome && <p className="mt-1 text-sm text-red-500 error">{errors.monthlyIncome}</p>}
          </div>
          
          {/* Employment Status */}
          <div>
            <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700 mb-1">
              สถานะการทำงาน <span className="text-red-500">*</span>
            </label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.employmentStatus ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
            >
              <option value="">เลือกสถานะการทำงานของคุณ</option>
              {employmentStatusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {errors.employmentStatus && <p className="mt-1 text-sm text-red-500 error">{errors.employmentStatus}</p>}
          </div>
          
          {/* Loan Purpose */}
          <div className="md:col-span-2">
            <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700 mb-1">
              วัตถุประสงค์การกู้ <span className="text-red-500">*</span>
            </label>
            <textarea
              id="loanPurpose"
              name="loanPurpose"
              value={formData.loanPurpose}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.loanPurpose ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'}`}
              placeholder="โปรดอธิบายเหตุผลที่คุณต้องการสินเชื่อนี้"
            />
            {errors.loanPurpose && <p className="mt-1 text-sm text-red-500 error">{errors.loanPurpose}</p>}
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-300"
          >
            ย้อนกลับ
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300"
          >
            ดำเนินการต่อ
          </button>
        </div>
      </form>
    </div>
  );
};

export default FinancialInfoForm;
