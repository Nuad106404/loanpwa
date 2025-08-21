import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';
import BalanceCard from './BalanceCard';

interface WalletDashboardProps {
  availableBalance: number;
  approvedLoanAmount: number;
  pendingWithdrawals: number;
  loading: boolean;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({
  availableBalance,
  approvedLoanAmount,
  pendingWithdrawals,
  loading
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' })
      .format(amount);
  };

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

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-md overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <h2 className="text-xl font-semibold">ภาพรวมกระเป๋าเงิน</h2>
        <p className="text-blue-100 mt-1">สรุปการเงินของคุณ</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BalanceCard 
            title="ยอดคงเหลือ"
            amount={availableBalance}
            formatCurrency={formatCurrency}
            icon={<DollarSign className="w-5 h-5 text-blue-500" />}
            color="blue"
            loading={loading}
          />
          
          <BalanceCard 
            title="สินเชื่อที่อนุมัติ"
            amount={approvedLoanAmount}
            formatCurrency={formatCurrency}
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            color="green"
            loading={loading}
          />
          
          <BalanceCard 
            title="การถอนเงินที่รอดำเนินการ"
            amount={pendingWithdrawals}
            formatCurrency={formatCurrency}
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            color="amber"
            loading={loading}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default WalletDashboard;
