import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Calendar, DollarSign, Percent, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { getAllInterestRates, InterestRate } from '../../../services/interestRateService';

interface Loan {
  id: string;
  amount: number;
  term: number;
  interestRate: number;
  monthlyPayment: number;
  status: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  nextPaymentDue?: string;
  user?: string;
  disbursedAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  applicationDetails?: any;
  paymentSchedule?: any[];
  totalInterest?: number;
  totalRepayment?: number;
  // For progress calculation
  paidAmount?: number;
}

interface ActiveLoansProps {
  loans: Loan[];
  loading: boolean;
}

const ActiveLoans: React.FC<ActiveLoansProps> = ({ loans, loading }) => {
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [loadingRates, setLoadingRates] = useState<boolean>(false);
  
  // Fetch interest rates from MongoDB when component mounts
  useEffect(() => {
    const getInterestRates = async () => {
      setLoadingRates(true);
      try {
        const response = await getAllInterestRates();
        if (response.status === 'success' && response.data) {
          // Handle both array and single object responses
          const rates = Array.isArray(response.data) ? response.data : [response.data];
          setInterestRates(rates);
        } else {
          console.warn('No interest rates found:', response.message);
        }
      } catch (error) {
        console.error('Error fetching interest rates from MongoDB:', error);
      } finally {
        setLoadingRates(false);
      }
    };
    
    getInterestRates();
  }, []);

  // Format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || isNaN(amount)) {
      return '฿0.00';
    }
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })
      .format(amount);
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'ไม่มีข้อมูล';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Get interest rate for a specific term from MongoDB
  const getInterestRateForTerm = (term: number): number => {
    // Default interest rate if no matching rate found
    const defaultRate = 0.03; // 3%
    
    if (!interestRates || interestRates.length === 0) {
      return defaultRate;
    }
    
    // Find matching interest rate for the term
    const matchingRate = interestRates.find(r => r.term === term);
    if (matchingRate) {
      return matchingRate.rate;
    }
    
    return defaultRate;
  };
  
  // Calculate monthly payment using MongoDB interest rates
  const calculateMonthlyPayment = (principal: number, term: number): number => {
    if (!principal || !term) return 0;
    
    // Get interest rate from MongoDB
    const interestRate = getInterestRateForTerm(term);
    
    // Calculate total interest for the loan
    const totalInterest = principal * interestRate;
    
    // Calculate total payment (principal + interest)
    const totalPayment = principal + totalInterest;
    
    // Calculate monthly payment
    const monthlyPayment = totalPayment / term;
    
    // Round to 2 decimal places
    return Math.round(monthlyPayment * 100) / 100;
  };

  // Translate loan status to Thai
  const getStatusInThai = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'รอการอนุมัติ': 'รอการอนุมัติ',
      'อนุมัติแล้ว': 'อนุมัติแล้ว',
      'ปฏิเสธ': 'ปฏิเสธ',
      'จ่ายเงินแล้ว': 'จ่ายเงินแล้ว',
      'เสร็จสิ้น': 'เสร็จสิ้น',
      'ผิดนัด': 'ผิดนัด',
      // English fallbacks
      'pending': 'รอการอนุมัติ',
      'approved': 'อนุมัติแล้ว',
      'rejected': 'ปฏิเสธ',
      'disbursed': 'จ่ายเงินแล้ว',
      'completed': 'เสร็จสิ้น',
      'defaulted': 'ผิดนัด'
    };
    return statusMap[status] || status;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'disbursed':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
      case 'disbursed':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  // Status helper functions are used for the status indicator

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const loanItemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  const detailsVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
          <h2 className="text-xl font-semibold">สินเชื่อของคุณ</h2>
          <p className="text-indigo-100 mt-1">จัดการสินเชื่อที่ใช้งานอยู่ของคุณ</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg mb-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white">
        <h2 className="text-xl font-semibold">สินเชื่อของคุณ</h2>
        <p className="text-indigo-100 mt-1">จัดการสินเชื่อที่ใช้งานอยู่ของคุณ</p>
      </div>

      <div className="p-6">
        {loans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>คุณไม่มีสินเชื่อที่ใช้งานอยู่</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <motion.div 
                key={loan.id} 
                className="border border-gray-200 rounded-lg overflow-hidden"
                variants={loanItemVariants}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        loan.status === 'approved' || loan.status === 'disbursed' ? 'bg-green-100' : 
                        loan.status === 'pending' ? 'bg-blue-100' : 
                        loan.status === 'completed' ? 'bg-indigo-100' : 
                        loan.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                      }`}>
                        <DollarSign className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-medium">Loan #{loan.id.slice(-5)}</h3>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {getStatusIcon(loan.status)}
                            <span className="ml-1">{getStatusInThai(loan.status)}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(loan.amount)} • {loan.term} เดือน
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-right mr-4">
                        <p className="text-sm font-medium">{
                          loadingRates ? 
                            <span className="animate-pulse">Loading...</span> : 
                            formatCurrency(loan.term && loan.amount ? calculateMonthlyPayment(loan.amount, loan.term) : loan.monthlyPayment)
                        }</p>
                        <p className="text-xs text-gray-500">ชำระรายเดือน</p>
                      </div>
                      {expandedLoanId === loan.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Empty space where progress bar was */}
                  <div className="mt-4">
                    {/* Loan details will be shown in the expanded section */}
                  </div>
                </div>

                {/* Expandable details */}
                <AnimatePresence>
                  {expandedLoanId === loan.id && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={detailsVariants}
                    >
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex items-center mb-1">
                              <Calendar className="w-4 h-4 text-gray-500 mr-1" />
                              <p className="text-xs text-gray-500">ระยะเวลา</p>
                            </div>
                            <p className="font-medium text-gray-900">{loan.term} เดือน</p>
                            <p className="text-xs text-gray-500 mt-1">
                              อนุมัติแล้ว: {formatDate(loan.approvedAt)}
                            </p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex items-center mb-1">
                              <Percent className="w-4 h-4 text-gray-500 mr-1" />
                              <p className="text-xs text-gray-500">อัตราดอกเบี้ย</p>
                            </div>
                            <p className="font-medium text-gray-900">{
                              // If we're loading interest rates, show spinner
                              loadingRates ? (
                                <span className="inline-flex items-center">
                                  <span className="animate-pulse">Loading...</span>
                                </span>
                              ) : (
                                // Get rate from MongoDB by term, fallback to loan's stored rate if needed
                                `${(loan.term ? getInterestRateForTerm(loan.term) * 100 : loan.interestRate) || 0}%`
                              )
                            }</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ดอกเบี้ยรวม: {
                                // Calculate total interest using MongoDB rate if term exists
                                formatCurrency(
                                  loan.term && !loadingRates ? 
                                    // Use MongoDB rate to calculate total interest
                                    loan.amount * getInterestRateForTerm(loan.term) : 
                                    // Fallback to stored value
                                    (loan.totalInterest !== undefined && !isNaN(loan.totalInterest) ? loan.totalInterest : 0)
                                )
                              }
                            </p>
                          </div>
                          
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <div className="flex items-center mb-1">
                              <DollarSign className="w-4 h-4 text-gray-500 mr-1" />
                              <p className="text-xs text-gray-500">ชำระรายเดือน</p>
                            </div>
                            <p className="font-medium text-gray-900">{
                              loadingRates ? 
                                <span className="animate-pulse">Loading...</span> : 
                                formatCurrency(loan.term && loan.amount ? calculateMonthlyPayment(loan.amount, loan.term) : loan.monthlyPayment)
                            }</p>
                            <p className="text-xs text-gray-500 mt-1">
                              ชำระคืนรวม: {
                                // Calculate total repayment using MongoDB rate if term exists
                                formatCurrency(
                                  loan.term && loan.amount && !loadingRates ? 
                                    // Use MongoDB rate to calculate total repayment (principal + interest)
                                    loan.amount + (loan.amount * getInterestRateForTerm(loan.term)) : 
                                    // Fallback to stored value
                                    (loan.totalRepayment !== undefined && !isNaN(loan.totalRepayment) ? loan.totalRepayment : loan.amount)
                                )
                              }
                            </p>
                          </div>
                        </div>

                        {/* Additional loan information based on status */}
                        {loan.nextPaymentDue && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 text-blue-500 mr-2" />
                              <p className="text-blue-700 font-medium">
                                Next payment due: {formatDate(loan.nextPaymentDue)}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Status-specific information */}
                        {loan.status === 'rejected' && loan.rejectionReason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-md text-sm">
                            <div className="flex items-center">
                              <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                              <p className="text-red-700">
                                Rejected: {loan.rejectionReason}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Payment schedule preview - could be expanded further */}
                        {loan.paymentSchedule && loan.paymentSchedule.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-sm mb-2">Payment Schedule</h4>
                            <div className="bg-white rounded-md shadow-sm overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {loan.paymentSchedule.slice(0, 3).map((payment: any, index: number) => (
                                    <tr key={index}>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.dueDate)}</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(payment.amount)}</td>
                                      <td className="px-3 py-2 whitespace-nowrap text-right">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                          payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                                          payment.status === 'due' ? 'bg-amber-100 text-amber-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {loan.paymentSchedule.length > 3 && (
                                <div className="px-3 py-2 text-center text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
                                  + {loan.paymentSchedule.length - 3} more payments
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActiveLoans;
