import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, RefreshCw } from 'lucide-react';
import TransactionItem from './TransactionItem';
import { getTransactions } from '../../../services/walletService';

interface Transaction {
  id: string;
  type: 'loan' | 'withdrawal';
  amount: number;
  status: 'pending' | 'approved' | 'denied' | 'completed' | 'failed';
  createdAt: string;
  reference?: string;
  bankAccount?: string;
  description?: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  loading: boolean;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, loading }) => {
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>(transactions);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [refreshing, setRefreshing] = useState(false);
  const [directTransactions, setDirectTransactions] = useState<Transaction[]>([]);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Function to fetch transactions directly from the API
  const fetchTransactionsDirect = async () => {
    setLoadingDirect(true);
    setError(null);
    setRefreshing(true);
    
    try {
      // Pass filters to the API if they're set
      const type = typeFilter !== 'all' ? typeFilter : undefined;
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const sort = 'date'; // Always sort by date
      const order = sortOrder;
      
      const response = await getTransactions(type, status, sort, order);
      
      if (response.status === 'success' && response.data) {
        // Map the API response to our Transaction interface
        // Log first transaction in detail if it exists
        if (response.data && response.data.length > 0) {
        }
        
        const mappedTransactions = response.data.map((t: any) => {
          
          // OVERRIDE: Always use MongoDB's ObjectId as the reference
          // We do NOT want to use the generated reference (e.g., WD-1748360079661-860)
          // We want to use the MongoDB ObjectId (e.g., 6835db8f87e245cf67654d13)
          let reference = '';
          
          // Priority 1: Use MongoDB _id field (direct MongoDB ObjectId)
          if (t._id) {
            reference = String(t._id);
          } 
          // Priority 2: Use the id field if it contains a MongoDB ObjectId format (24 hex chars)
          else if (t.id && /^[0-9a-f]{24}$/i.test(t.id)) {
            reference = String(t.id);
          }
          // Priority 3: Use legacy reference field if it contains a MongoDB ObjectId format
          else if (t.reference && /^[0-9a-f]{24}$/i.test(t.reference)) {
            reference = String(t.reference);
          }
          // Priority 4: Use any id field as fallback
          else if (t.id) {
            reference = String(t.id);
          }
          // If all else fails, generate a placeholder for debugging
          else {
            console.warn('Transaction missing proper identifier:', t);
            reference = 'Missing ID';
          }
          
          const mapped = {
            _id: t._id, // Store the original MongoDB ObjectId
            id: t._id, // Always use MongoDB ObjectId, never generate a random ID
            type: t.type,
            status: t.status,
            amount: t.amount,
            date: t.date,
            createdAt: t.date || t.createdAt,
            bankAccount: t.bankAccount || '',
            reference: reference, // Use our validated reference
            failureReason: t.failureReason || '',
            rejectionReason: t.rejectionReason || '',
            userId: t.userId || '',
            description: t.description || (t.type === 'withdrawal' ? 'Wallet withdrawal' : 'Loan disbursement')
          };
          
          return mapped;
        });
        
        setDirectTransactions(mappedTransactions);
        
        // Apply any active filters
        let filtered = [...mappedTransactions];
        
        // Apply status filter
        if (statusFilter !== 'all') {
          filtered = filtered.filter(transaction => transaction.status === statusFilter);
        }
        
        // Apply type filter
        if (typeFilter !== 'all') {
          filtered = filtered.filter(transaction => transaction.type === typeFilter);
        }
        
        // Sort transactions
        filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        
        setFilteredTransactions(filtered);
      } else {
        // If API request failed, show error but keep using props
        setError(response.message || 'ไม่สามารถดึงข้อมูลรายการธุรกรรมได้');
        console.error('Error fetching transactions:', response.message);
      }
    } catch (err) {
      setError('An error occurred while fetching transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingDirect(false);
      setRefreshing(false);
    }
  };
  
  // Update filtered transactions when props change or filters change
  useEffect(() => {
    let results = directTransactions.length > 0 ? directTransactions : transactions;
    
    // Apply filters
    if (statusFilter !== 'all') {
      results = results.filter(t => t.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      results = results.filter(t => t.type === typeFilter);
    }
    
    // Apply sorting
    results = [...results].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredTransactions(results);
    setLastUpdated(new Date().toLocaleTimeString());
  }, [transactions, directTransactions, statusFilter, typeFilter, sortOrder]);

  // Fetch transactions directly when component mounts
  useEffect(() => {
    // Fetch transactions directly to ensure we have the latest data
    fetchTransactionsDirect();
    // No auto-refresh interval - only manual refresh via button
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
      <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-900 text-white">
        <h2 className="text-xl font-semibold">ประวัติการทำรายการ</h2>
        <p className="text-gray-300 mt-1">ดูและกรองประวัติการทำรายการของคุณ</p>
      </div>

      {/* Search and filters */}
      {/* Error message if present */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <p className="font-medium">Error: {error}</p>
          <p className="mt-1">Using cached data. Try refreshing to get the latest transactions.</p>
        </div>
      )}
      
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-lg font-medium text-gray-700">ตัวกรองรายการ</h3>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[120px]">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">ทุกประเภท</option>
                <option value="loan">เงินกู้</option>
                <option value="withdrawal">ถอนเงิน</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="relative min-w-[120px]">
              <select
                className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">ทุกสถานะ</option>
                <option value="pending">รอดำเนินการ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="completed">เสร็จสิ้น</option>
                <option value="denied">ถูกปฏิเสธ</option>
                <option value="failed">ล้มเหลว</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <Filter className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              {sortOrder === 'asc' ? 'เก่าที่สุด' : 'ใหม่ที่สุด'}
            </button>
            
            {/* Refresh button */}
            <button
              className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={fetchTransactionsDirect}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div className="p-4">
        {loading || loadingDirect ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
            <p className="text-center text-gray-500 text-sm mt-4">
              {loading ? 'กำลังโหลดรายการ...' : 'กำลังรีเฟรชรายการ...'}
            </p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>ไม่พบรายการที่ตรงกับตัวกรองของคุณ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))}
          </div>
        )}
      </div>

      {/* Transaction summary */}
      {!loading && !loadingDirect && filteredTransactions.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          <div className="flex justify-between items-center">
            <p>Showing {filteredTransactions.length} of {directTransactions.length > 0 ? directTransactions.length : transactions.length} transactions</p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-400">
                {refreshing && <span className="ml-2 inline-block animate-pulse">กำลังรีเฟรช...</span>}
              </p>
              {/* Last updated timestamp */}
              <p className="text-xs text-gray-400">
                Last updated: {lastUpdated}
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TransactionHistory;
