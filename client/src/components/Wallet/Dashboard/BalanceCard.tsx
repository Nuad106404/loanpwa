import React from 'react';
import { motion } from 'framer-motion';

interface BalanceCardProps {
  title: string;
  amount: number;
  formatCurrency: (amount: number) => string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  loading: boolean;
  isCount?: boolean;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  title,
  amount,
  formatCurrency,
  icon,
  color,
  loading,
  isCount = false
}) => {
  // Get color classes based on the color prop
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'amber':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  // Animation variants
  const cardVariants = {
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

  const numberVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        type: 'spring',
        stiffness: 100,
        delay: 0.2
      }
    }
  };

  return (
    <motion.div 
      className={`rounded-lg border p-4 ${getColorClasses()}`}
      variants={cardVariants}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-sm">{title}</h3>
        <div className="p-2 rounded-full bg-white">
          {icon}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse h-8 bg-gray-200 rounded mt-2"></div>
      ) : (
        <motion.div 
          className="mt-2"
          variants={numberVariants}
        >
          <p className="text-2xl font-bold">
            {formatCurrency(amount)}
          </p>
          {!isCount && (
            <p className="text-xs mt-1 opacity-70">บาท</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default BalanceCard;
