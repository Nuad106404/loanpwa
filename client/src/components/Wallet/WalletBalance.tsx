import React from 'react';
import { Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface WalletBalanceProps {
  availableBalance: number;
  approvedLoanAmount: number;
  pendingWithdrawals: number;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({
  availableBalance,
  approvedLoanAmount,
  pendingWithdrawals
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">Wallet Balance</h2>
        <div className="p-2 bg-blue-100 rounded-full">
          <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-blue-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-sm md:text-base text-gray-600">ยอดคงเหลือ</span>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(availableBalance)}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-sm md:text-base text-gray-600">Approved Loan</span>
            <ArrowDownRight className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(approvedLoanAmount)}</p>
        </div>

        <div className="bg-yellow-50 rounded-lg p-3 md:p-4">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-sm md:text-base text-gray-600">การถอนที่รอการอนุมัติ</span>
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{formatCurrency(pendingWithdrawals)}</p>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;