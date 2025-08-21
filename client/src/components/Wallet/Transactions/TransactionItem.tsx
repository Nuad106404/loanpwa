import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertTriangle, CreditCard, Banknote, Trash2 } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'loan' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'rejected' | 'completed' | 'failed';
  createdAt: string;
  reference?: string;
  bankAccount?: string | { bankName?: string; accountNumber?: string; accountName?: string };
  description?: string;
  failureReason?: string;
  rejectionReason?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })
      .format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get transaction icon based on type and status
  const getTransactionIcon = () => {
    if (transaction.type === 'loan') {
      return <Banknote className="w-5 h-5 text-green-500" />;
    } else if (transaction.type === 'withdrawal') {
      return <CreditCard className="w-5 h-5 text-blue-500" />;
    }
    return null;
  };

  // Get status icon and color
  const getStatusDetails = () => {
    switch (transaction.status) {
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-500" />,
          color: 'bg-green-100 text-green-800'
        };
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4 text-amber-500" />,
          color: 'bg-amber-100 text-amber-800'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
          color: 'bg-blue-100 text-blue-800'
        };
      case 'denied':
        return {
          icon: <XCircle className="w-4 h-4 text-red-500" />,
          color: 'bg-red-100 text-red-800'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-4 h-4 text-orange-500" />,
          color: 'bg-orange-100 text-orange-800'
        };
      case 'failed':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-gray-500" />,
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  // Format bank account number with masking
  const formatBankAccount = (account?: string | { bankName?: string; accountNumber?: string; accountName?: string }) => {
    if (!account) return 'N/A';
    
    // Handle object format (new format)
    if (typeof account === 'object') {
      const accountNumber = account.accountNumber;
      if (!accountNumber) return 'N/A';
      
      // Mask middle digits if account number is long enough
      if (accountNumber.length > 6) {
        const firstPart = accountNumber.substring(0, 3);
        const lastPart = accountNumber.substring(accountNumber.length - 3);
        return `${firstPart}****${lastPart}`;
      }
      return accountNumber;
    }
    
    // Handle string format (legacy format)
    if (account.length > 6) {
      const firstPart = account.substring(0, 3);
      const lastPart = account.substring(account.length - 3);
      return `${firstPart}****${lastPart}`;
    }
    return account;
  };

  // Get transaction title
  const getTransactionTitle = () => {
    if (transaction.type === 'loan') {
      return 'Loan Disbursement';
    } else if (transaction.type === 'withdrawal') {
      return 'Wallet Withdrawal';
    }
    return 'Transaction';
  };

  const statusDetails = getStatusDetails();

  // Function to get only the last 4 digits of the MongoDB ObjectID for display
  const getMongoObjectId = (transaction: Transaction) => {
    // Get the full ID
    let fullId = '';
    
    // Use _id property which directly maps to MongoDB's ObjectId
    if ((transaction as any)._id) {
      fullId = (transaction as any)._id;
    }
    // If no _id is available, use id as fallback
    else if (transaction.id) {
      fullId = transaction.id;
    }
    else {
      return 'N/A';
    }
    
    // Return only the last 4 characters
    return fullId.length > 4 ? fullId.slice(-4) : fullId;
  };

  // Animation variants
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };

  return (
    <motion.div 
      className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-150 sm:rounded-lg sm:border sm:mb-2 relative overflow-hidden"
      variants={itemVariants}
    >
      {/* Status indicator bar on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${
        transaction.status === 'completed' ? 'bg-green-500' : 
        transaction.status === 'pending' ? 'bg-amber-500' : 
        transaction.status === 'approved' ? 'bg-blue-500' : 
        transaction.status === 'denied' || transaction.status === 'failed' ? 'bg-red-500' : 
        'bg-gray-300'
      }`}></div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pl-2">
        <div className="flex items-start space-x-3 mb-3 sm:mb-0">
          <div className="p-2 rounded-full bg-gray-100 shadow-sm">
            {getTransactionIcon()}
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <h3 className="font-medium text-gray-900">{getTransactionTitle()}</h3>
              <span className={`mt-1 sm:mt-0 sm:ml-2 px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center ${statusDetails.color} self-start`}>
                {statusDetails.icon}
                <span className="ml-1">{transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatDate(transaction.createdAt)}
            </p>
            {/* Reference number shown on mobile */}
            {transaction.type === 'withdrawal' && (
              <p className="text-xs text-gray-500 sm:hidden mt-1">
                Ref: #{getMongoObjectId(transaction)}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between">
          <p className={`font-medium text-lg ${transaction.type === 'loan' ? 'text-green-600' : 'text-blue-600'}`}>
            {transaction.type === 'loan' ? '+' : '-'} {formatCurrency(transaction.amount)}
          </p>
          {/* Display only last 4 digits of MongoDB ObjectID as reference - hidden on mobile */}
          {transaction.type === 'withdrawal' && (
            <span className="hidden sm:inline-block text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 shadow-sm">
              Ref: #{getMongoObjectId(transaction)}
            </span>
          )}
        </div>
      </div>

      {/* Additional details with better mobile styling */}
      {transaction.type === 'withdrawal' && transaction.bankAccount && (
        <div className="mt-3 pt-2 border-t border-gray-100 text-sm text-gray-600 flex flex-col sm:flex-row sm:justify-between">
          <div className="flex items-center">
            <CreditCard className="w-4 h-4 mr-1 text-gray-400" />
            <p>{formatBankAccount(transaction.bankAccount)}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1 sm:mt-0">{transaction.status === 'completed' ? 'Processed' : 'Processing'}: {new Date(transaction.createdAt).toLocaleDateString()}</p>
        </div>
      )}

      {/* Failure/Rejection Reason Display */}
      {(transaction.status === 'failed' && transaction.failureReason) && (
        <div className="mt-3 pt-2 border-t border-red-100">
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-red-800 mb-1">Failure Reason:</p>
                <p className="text-sm text-red-700">{transaction.failureReason}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {((transaction.status === 'denied' || transaction.status === 'rejected') && transaction.rejectionReason) && (
        <div className="mt-3 pt-2 border-t border-orange-100">
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex items-start">
              <XCircle className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-orange-800 mb-1">Rejection Reason:</p>
                <p className="text-sm text-orange-700">{transaction.rejectionReason}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {transaction.description && (
        <div className="mt-2 text-sm text-gray-500">
          <p>{transaction.description}</p>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionItem;
