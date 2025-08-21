import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, SubmitHandler } from 'react-hook-form';
import { CreditCard, DollarSign, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { getFreshUserStatus } from '../../../services/authService';
import Swal from 'sweetalert2';

interface WithdrawalFormInputs {
  amount: number;
  bankAccount: string;
  bankName: string;
  accountName: string;
}

interface WithdrawalPanelProps {
  availableBalance: number;
  onSubmitWithdrawal: (data: WithdrawalFormInputs) => Promise<any>;
  loading: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const WithdrawalPanel: React.FC<WithdrawalPanelProps> = ({
  availableBalance,
  onSubmitWithdrawal,
  loading,
  bankDetails
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [withdrawalData, setWithdrawalData] = useState<WithdrawalFormInputs | null>(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm<WithdrawalFormInputs>();
  
  // Pre-fill form with bank details and amount if available
  React.useEffect(() => {
    // Set the withdrawal amount to available balance
    setValue('amount', availableBalance);
    
    if (bankDetails) {
      setValue('bankName', bankDetails.bankName || '');
      setValue('bankAccount', bankDetails.accountNumber || '');
      setValue('accountName', bankDetails.accountName || '');
    }
  }, [bankDetails, setValue, availableBalance]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })
      .format(amount);
  };

  // Mask account number for privacy
  const maskAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return '';
    if (accountNumber.length <= 4) return accountNumber;
    
    // Show only the last 4 digits, mask the rest
    const lastFour = accountNumber.slice(-4);
    const maskedPart = '*'.repeat(accountNumber.length - 4);
    return maskedPart + lastFour;
  };

  // Handle form submission for step 1
  const onSubmitStep1: SubmitHandler<WithdrawalFormInputs> = async (data) => {
    try {
      // Make fresh API call to get current user status (bypasses all caching for real-time validation)
      const userStatus = await getFreshUserStatus();
      
      if (!userStatus) {
        // User session expired or invalid
        await Swal.fire({
          title: 'รอดำเนินการ',
          text: 'เกิดข้อผิดพลาด กรุณาติดต่อแอดมิน',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3B82F6'
        });
        return;
      }

      // Check if user is inactive or suspended (real-time status directly from MongoDB)
      if (userStatus.status === 'inactive' || userStatus.status === 'suspended') {
        // Show SweetAlert2 popup with Thai error message
        await Swal.fire({
          title: 'รอดำเนินการ',
          text: 'เกิดข้อผิดพลาด กรุณาติดต่อแอดมิน',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#3B82F6'
        });
        return; // Stop the withdrawal process
      }

      // If user is active, proceed with withdrawal
      setWithdrawalData(data);
      setCurrentStep(2);
    } catch (error) {
      console.error('❌ Error checking user status:', error);
      // Show error popup if API call fails
      await Swal.fire({
        title: 'รอดำเนินการ',
        text: 'เกิดข้อผิดพลาด กรุณาติดต่อแอดมิน',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#3B82F6'
      });
    }
  };

  // Handle confirmation in step 2
  const handleConfirmWithdrawal = async () => {
    if (!withdrawalData) return;
    
    try {
      setCurrentStep(3);
      // Call the withdrawal function and get the response with transaction data
      const response = await onSubmitWithdrawal(withdrawalData);
      
      // Extract the MongoDB ObjectID from the response
      if (response && response.data) {
        if (response.data.transaction && response.data.transaction._id) {
          // MongoDB ObjectID in transaction field - this is the primary format we expect
          setTransactionId(response.data.transaction._id);
        } else if (response.data._id) {
          // Direct MongoDB ObjectID in response data
          setTransactionId(response.data._id);
        } else if (response.data.id) {
          // MongoDB ObjectID in id field
          setTransactionId(response.data.id);
        }
      }
      
      setWithdrawalSuccess(true);
    } catch (error) {
      setWithdrawalSuccess(false);
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  // Handle starting a new withdrawal
  const handleNewWithdrawal = () => {
    setCurrentStep(1);
    setWithdrawalData(null);
    setWithdrawalSuccess(null);
    setErrorMessage('');
    reset();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  // Watch the amount field
  const watchAmount = watch('amount', 0);
  const isAmountValid = watchAmount > 0 && watchAmount <= availableBalance;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <h2 className="text-xl font-semibold">ถอนเงิน</h2>
        <p className="text-blue-100 mt-1">โอนเงินไปยังบัญชีธนาคารของคุณ</p>
      </div>

      <div className="p-6">
        {/* Step indicator */}
        <div className="flex items-center mb-6">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            3
          </div>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-medium mb-4">กรอกรายละเอียดการถอนเงิน</h3>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-blue-700 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  ยอดคงเหลือ: {formatCurrency(availableBalance)}
                </p>
              </div>
              
              <form onSubmit={handleSubmit(onSubmitStep1)}>
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนเงินที่ถอน
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">฿</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      className={`block w-full pl-8 pr-12 py-2 border ${errors.amount ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none sm:text-sm bg-gray-100`}
                      placeholder="0.00"
                      step="0.01"
                      min="1"
                      max={availableBalance}
                      readOnly
                      {...register('amount', { 
                        required: 'Amount is required',
                        min: {
                          value: 1,
                          message: 'Minimum withdrawal amount is ฿1'
                        },
                        max: {
                          value: availableBalance,
                          message: `Maximum withdrawal amount is ${formatCurrency(availableBalance)}`
                        },
                        valueAsNumber: true
                      })}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">THB</span>
                    </div>
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                  {watchAmount > 0 && (
                    <p className={`mt-1 text-sm ${isAmountValid ? 'text-green-600' : 'text-red-600'}`}>
                      {isAmountValid 
                        ? `You will receive ${formatCurrency(watchAmount)}` 
                        : 'Amount exceeds available balance'}
                    </p>
                  )}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อธนาคาร
                  </label>
                  <div className="bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-gray-700">
                    {bankDetails && bankDetails.bankName ? bankDetails.bankName : 'No bank information available'}
                  </div>
                  <input
                    type="hidden"
                    {...register('bankName', { required: 'Bank name is required' })}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อเจ้าของบัญชี
                  </label>
                  <div className="bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-gray-700">
                    {bankDetails && bankDetails.accountName ? bankDetails.accountName : 'No account name available'}
                  </div>
                  <input
                    type="hidden"
                    {...register('accountName', { required: 'Account name is required' })}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมายเลขบัญชีธนาคาร
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="bg-gray-50 pl-10 px-3 py-2 border border-gray-200 rounded-md text-gray-700">
                      {bankDetails && bankDetails.accountNumber ? maskAccountNumber(bankDetails.accountNumber) : 'No account number available'}
                    </div>
                  </div>
                  <input
                    type="hidden"
                    {...register('bankAccount', { 
                      required: 'Bank account number is required'
                    })}
                  />
                </div>

                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    disabled={!isAmountValid || loading}
                  >
                    ดำเนินการต่อ <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {currentStep === 2 && withdrawalData && (
            <motion.div
              key="step2"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-lg font-medium mb-4">Confirm Withdrawal</h3>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-3">Withdrawal Summary</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">{formatCurrency(withdrawalData.amount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">ชื่อธนาคาร:</span>
                    <span className="font-medium">{withdrawalData.bankName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">ชื่อเจ้าของบัญชี:</span>
                    <span className="font-medium">{withdrawalData.accountName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Number:</span>
                    <span className="font-medium">{withdrawalData.bankAccount}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg mb-6">
                <p className="text-amber-700 text-sm">
                  กรุณาตรวจสอบข้อมูลด้านบน เมื่อยืนยันแล้ว กระบวนการถอนเงินจะเริ่มต้นและไม่สามารถยกเลิกได้
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setCurrentStep(1)}
                  disabled={loading}
                >
                    ย้อนกลับ
                </button>
                
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                  onClick={handleConfirmWithdrawal}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {withdrawalSuccess === true && (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Withdrawal Successful</h3>
                  <p className="text-gray-500 mb-6">
                    Your withdrawal request has been submitted successfully. The funds will be transferred to your bank account within 1-3 business days.
                  </p>
                  
                  {withdrawalData && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Amount:</span>
                          <span className="font-medium">{formatCurrency(withdrawalData.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bank Account:</span>
                          <span className="font-medium">{withdrawalData.bankAccount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Reference:</span>
                          <span className="font-medium">{transactionId || 'Processing...'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleNewWithdrawal}
                  >
                    Make Another Withdrawal
                  </button>
                </div>
              )}
              
              {withdrawalSuccess === false && (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">การถอนเงินล้มเหลว</h3>
                  <p className="text-red-500 mb-6">
                    {errorMessage || 'เกิดข้อผิดพลาดในการดำเนินการถอนเงินของคุณ กรุณาลองใหม่อีกครั้ง'}
                  </p>
                  
                  <button
                    type="button"
                    className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={handleNewWithdrawal}
                  >
                    Try Again
                  </button>
                </div>
              )}
              
              {withdrawalSuccess === null && (
                <div className="text-center py-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Withdrawal</h3>
                  <p className="text-gray-500 mb-6">
                    กรุณารอสักครู่ขณะที่เราดำเนินการคำขอถอนเงินของคุณ...
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WithdrawalPanel;
