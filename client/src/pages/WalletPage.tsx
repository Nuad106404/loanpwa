import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getWallet, createWithdrawal } from '../services/walletService';
import toast from 'react-hot-toast';

// Import our new wallet components
import {
  WalletDashboard,
  ActiveLoans,
  TransactionHistory,
  WithdrawalPanel
} from '../components/Wallet';

// Local interface for transactions that maps to the API response
interface Transaction {
  _id: string;
  id: string; // Ensure we have both _id and id for compatibility
  type: 'loan' | 'withdrawal';
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'failed';
  amount: number;
  date: string;
  createdAt: string; // For compatibility with our new components
  bankAccount?: string;
  reference?: string;
  failureReason?: string;
  userId?: string;
  description?: string;
}

// Interface for loan data
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

const WalletPage: React.FC = () => {
  // State for wallet data
  const [availableBalance, setAvailableBalance] = useState(0);
  const [approvedLoanAmount, setApprovedLoanAmount] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
  } | undefined>();

  // Fetch wallet data when component mounts
  useEffect(() => {
    // Initial fetch
    fetchWalletData();
    // No auto-refresh - data will only be refreshed when explicitly requested
  }, []);

  // Function to fetch wallet data from the backend
  const fetchWalletData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getWallet();
      
      if (response.status === 'success' && response.data) {
        const walletData = response.data;
        
        // Update state with data from MongoDB
        setAvailableBalance(walletData.availableBalance);
        setApprovedLoanAmount(walletData.approvedLoanAmount);
        setPendingWithdrawals(walletData.pendingWithdrawals);
        
        // Set bank details if available
        if (walletData.bankDetails) {
          const bankDetailsData = {
            bankName: walletData.bankDetails.bankName || '',
            accountNumber: walletData.bankDetails.accountNumber || '',
            accountName: walletData.bankDetails.accountName || ''
          };
          setBankDetails(bankDetailsData);
        } else {
        }
        
        // Map the transactions to our local Transaction interface
        if (walletData.transactions && Array.isArray(walletData.transactions)) {
          // Log first transaction in detail if it exists
          if (walletData.transactions && walletData.transactions.length > 0) {
          }
          
          const mappedTransactions = walletData.transactions.map((t: any) => {
            // OVERRIDE: Always use MongoDB's ObjectId as the reference, NOT the generated reference field
            // We want the MongoDB ObjectId (e.g., 6835db8f87e245cf67654d13)
            let reference = '';
            
            // First try to use _id field (direct MongoDB ObjectId)
            if (t._id) {
              reference = String(t._id);
            }
            // If _id is not available, try to use id field (which may contain the MongoDB ObjectId)
            else if (t.id) {
              reference = String(t.id);
            }
            
            return {
              _id: t._id,
              id: t._id, // Add id for compatibility with our components
              type: t.type,
              status: t.status,
              amount: t.amount,
              date: t.date,
              createdAt: t.date || t.createdAt, // Add createdAt for compatibility
              bankAccount: t.bankAccount || '',
              // Explicitly use the MongoDB _id as reference, NOT t.reference
              reference: reference,
              failureReason: t.failureReason || '',
              rejectionReason: t.rejectionReason || '',
              userId: t.userId || '',
              description: t.description || (t.type === 'withdrawal' ? 'การถอนเงินจากกระเป๋าเงิน' : 'การเบิกจ่ายเงินกู้')
            };
          });
          
          setTransactions(mappedTransactions);
        }
        
        // Set loan data if available
        if (walletData.loans && Array.isArray(walletData.loans)) {
          setLoans(walletData.loans);
        }
      } else {
        setError(response.message || 'ไม่สามารถดึงข้อมูลกระเป๋าเงินได้');
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลกระเป๋าเงิน');
    } finally {
      setLoading(false);
    }
  };

  // Handle withdrawal request
  const handleWithdrawal = async (data: { amount: number; bankAccount: string; bankName: string; accountName: string }) => {
    try {
      setWithdrawalLoading(true);
      
      // Validate amount
      if (data.amount <= 0) {
        toast.error('จำนวนเงินที่ถอนต้องมากกว่า 0');
        return Promise.reject(new Error('จำนวนเงินที่ถอนต้องมากกว่า 0'));
      }

      if (data.amount > availableBalance) {
        toast.error('จำนวนเงินที่ถอนเกินยอดเงินคงเหลือ');
        return Promise.reject(new Error('จำนวนเงินที่ถอนเกินยอดเงินคงเหลือ'));
      }

      // Call API to create withdrawal
      const response = await createWithdrawal(data.amount, data.bankAccount);
      
      // Log the complete response structure to inspect it
      
      if (response.status === 'success') {
        toast.success('ส่งคำขอถอนเงินเรียบร้อยแล้ว');
        // Refresh wallet data to show updated balance and new transaction
        await fetchWalletData();
        // Return the full response object with transaction data
        // The screenshot shows the transaction ID is in response.data._id
        return response;
      } else {
        const errorMessage = response.message || 'ไม่สามารถดำเนินการถอนเงินได้';
        toast.error(errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดำเนินการถอนเงินของคุณ';
      toast.error(errorMessage);
      return Promise.reject(error);
    } finally {
      setWithdrawalLoading(false);
    }
  };

  // Animation variants for staggered loading
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="py-16 md:py-24 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">กระเป๋าเงินของฉัน</h1>
        <p className="mt-2 text-gray-600">
          จัดการกระเป๋าเงิน ดูรายการทำธุรกรรม และขอถอนเงิน
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8 mb-6 md:mb-8">
        <div className="lg:col-span-2 order-1">
          <WalletDashboard
            availableBalance={availableBalance}
            approvedLoanAmount={approvedLoanAmount}
            pendingWithdrawals={pendingWithdrawals}
            totalTransactions={transactions.length}
            loading={loading}
          />
        </div>
        <div className="lg:col-span-2 order-2">
          {/* Log bank details right before passing to WithdrawalPanel */}
          <div style={{ display: 'none' }}>{JSON.stringify(bankDetails)}</div>
          <WithdrawalPanel
            availableBalance={availableBalance}
            onSubmitWithdrawal={handleWithdrawal}
            loading={withdrawalLoading}
            bankDetails={bankDetails}
          />
        </div>
      </div>

      {/* Loans Section - Below wallet balance */}
      <div className="mb-6">
        <ActiveLoans
          loans={loans}
          loading={loading}
        />
      </div>

      {/* Transaction History Section */}
      <div className="mb-6">
        <TransactionHistory
          transactions={transactions}
          loading={loading}
        />
      </div>
    </motion.div>
  );
};

export default WalletPage;
