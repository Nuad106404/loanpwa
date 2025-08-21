import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Menu, Transition, Dialog } from '@headlessui/react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import WithdrawalEditModal from '../components/WithdrawalEditModal';
import { TransactionStatus } from '../types/User';
import { 
  Search, 
  Download, 
  UserPlus, 
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CheckCircle2,
  ArrowUpDown,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Wallet,
  X,
  PencilIcon,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { User, UserStatus, LoanStatus } from '../types/User';
import { fetchInterestRates, InterestRate } from '../services/interestRateService';
import SocketService from '../services/socketService';

type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';
type SortField = 'personalInformation.name' | 'email' | 'phone' | 'address.province' | 'bankAccount.bankName' | 'financialInformation.incomeMonthly' | 'familyContact.familyName' | 'status' | 'loans' | 'createdAt';

// Transaction interface for user transaction data
interface Transaction {
  _id?: string;
  id?: string;
  reference?: string;
  type: 'deposit' | 'withdrawal';
  status: TransactionStatus;
  amount: number;
  date?: string;
  createdAt?: string;
  paymentMethod?: {
    bankName: string;
    accountNumber: string;
    accountName?: string;
  };
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  loan?: {
    amount: number;
    term: number;
    status: string;
  };
  userId?: string;
}

// Enhanced activity status indicator with multi-layer detection details
const ActivityStatus: React.FC<{ 
  isOnline?: boolean; 
  userId?: string;
  lastSeen?: string;
  socketId?: string;
  hasActiveSocket?: boolean;
  hasAnySocket?: boolean;
  socketCount?: number;
  dbIsOnline?: boolean;
  connectionDetails?: any;
}> = ({ 
  isOnline, 
  userId, 
  lastSeen, 
  socketId, 
  hasActiveSocket = false,
  hasAnySocket = false,
  socketCount = 0,
  dbIsOnline = false,
  connectionDetails 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getStatusColor = () => {
    if (isOnline) {
      if (hasActiveSocket) return 'bg-green-500'; // Active socket
      if (hasAnySocket) return 'bg-yellow-500'; // Any socket (multi-tab)
      return 'bg-blue-500'; // Database online only
    }
    return 'bg-gray-400'; // Offline
  };
  
  const getStatusText = () => {
    if (isOnline) {
      if (hasActiveSocket) return 'Active';
      if (hasAnySocket) return 'Multi-Tab';
      return 'Online';
    }
    return 'Offline';
  };
  
  const getDetectionMethod = () => {
    if (hasActiveSocket) return 'Active Socket';
    if (hasAnySocket) return 'Socket History';
    if (dbIsOnline) return 'Database';
    return 'None';
  };
  
  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative">
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
        onClick={() => setShowDetails(!showDetails)}
        title="Click for multi-layer connection details"
      >
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} ${isOnline ? 'animate-pulse' : ''}`}></div>
        <span className={`text-xs font-medium ${isOnline ? 'text-green-700' : 'text-gray-500'}`}>
          {getStatusText()}
        </span>
        {isOnline && (
          <div className="w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
        )}
        {socketCount > 1 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">
            {socketCount}
          </span>
        )}
      </div>
      
      {showDetails && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 min-w-80">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Multi-Layer Status:</span>
              <span className={`font-medium px-2 py-1 rounded text-xs ${
                isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {getStatusText()}
              </span>
            </div>
            
            <div className="border-t border-gray-100 pt-2">
              <div className="text-gray-600 font-medium mb-1">Detection Layers:</div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Active Socket:</span>
                <span className={`font-medium ${hasActiveSocket ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasActiveSocket ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Any Socket:</span>
                <span className={`font-medium ${hasAnySocket ? 'text-yellow-600' : 'text-gray-400'}`}>
                  {hasAnySocket ? `✅ Yes (${socketCount})` : '❌ No'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Database:</span>
                <span className={`font-medium ${dbIsOnline ? 'text-blue-600' : 'text-gray-400'}`}>
                  {dbIsOnline ? '✅ Online' : '❌ Offline'}
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Detection Method:</span>
                <span className="text-gray-700 font-medium">
                  {getDetectionMethod()}
                </span>
              </div>
              
              {userId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">User ID:</span>
                  <code className="text-blue-600 bg-blue-50 px-1 rounded text-xs">
                    {userId.substring(0, 8)}...
                  </code>
                </div>
              )}
              
              {socketId && hasActiveSocket && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Socket:</span>
                  <code className="text-green-600 bg-green-50 px-1 rounded text-xs">
                    {socketId.substring(0, 8)}...
                  </code>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-500">Last Seen:</span>
                <span className="text-gray-700 font-medium">
                  {isOnline ? 'Now' : formatLastSeen(lastSeen)}
                </span>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor()}`}></div>
                <span className="text-gray-500 text-xs">
                  {isOnline 
                    ? `Multi-layer detection: ${getDetectionMethod()}`
                    : 'All detection layers offline'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Password display component with show/hide functionality
const PasswordDisplay: React.FC<{ password?: string }> = ({ password }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="flex items-center space-x-1">
      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
        {showPassword ? (
          password || 'No password available'
        ) : '•••'}
      </span>
      <button 
        onClick={() => setShowPassword(!showPassword)}
        className="p-1 rounded-full hover:bg-gray-100"
        title={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('personalInformation.name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [notificationMessages, setNotificationMessages] = useState<{[key: string]: string}>({});
  const [sendingNotification, setSendingNotification] = useState<{[key: string]: boolean}>({});
  
  // Withdrawal management state
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [selectedUserWithdrawals, setSelectedUserWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [selectedUserForWithdrawals, setSelectedUserForWithdrawals] = useState<string>('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch interest rates when component mounts
  useEffect(() => {
    const loadInterestRates = async () => {
      try {
        const rates = await fetchInterestRates();
        if (rates && rates.length > 0) {
          setInterestRates(rates);
        }
      } catch (error) {
        console.error('Error loading interest rates:', error);
      }
    };
    
    loadInterestRates();
  }, []);

  // Function to translate employment status to Thai
  const translateEmploymentStatus = (status: string): string => {
    const translations: { [key: string]: string } = {
      'full-time': 'ทำงานเต็มเวลา',
      'part-time': 'ทำงานพาร์ทไทม์',
      'self-employed': 'ประกอบอาชีพอิสระ',
      'unemployed': 'ว่างงาน',
      'employed': 'มีงานทำ',
      'student': 'นักเรียน/นักศึกษา',
      'retired': 'เกษียณ'
    };
    return translations[status] || status;
  };

  // Function to translate relationship to Thai
  const translateRelationship = (relationship: string): string => {
    const translations: { [key: string]: string } = {
      'father': 'บิดา',
      'mother': 'มารดา',
      'spouse': 'คู่สมรส',
      'sibling': 'พี่น้อง',
      'child': 'บุตร',
      'friend': 'เพื่อน',
      'relative': 'ญาติ',
      'colleague': 'เพื่อนร่วมงาน',
      'other': 'อื่นๆ'
    };
    return translations[relationship.toLowerCase()] || relationship;
  };

  // Function to ensure image URLs are properly formatted
  const formatImageUrl = (url: string | null): string | undefined => {
    if (!url) return undefined;
    
    // If the URL is already absolute (starts with http:// or https://), return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Remove the backend directory path if it exists
    let cleanUrl = url;
    const backendPathPattern = /\/Users\/nuad\/Downloads\/loanwithoutadmin\/backend\//;
    if (backendPathPattern.test(cleanUrl)) {
      cleanUrl = cleanUrl.replace(backendPathPattern, '');
    }
    
    // If the path starts with 'uploads', ensure it's properly formatted
    if (cleanUrl.startsWith('uploads/')) {
      return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/${cleanUrl}`;
    }
    
    // Otherwise, assume it's a relative path and prepend the API URL with uploads directory
    return `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/uploads/${cleanUrl}`;
  };

  // Function to update transaction details
  const handleUpdateTransactionDetails = async (transactionId: string, transactionData: any) => {
    try {
      setTransactionLoading(true);
      // Get the token and log authentication state for debugging
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/admin/transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction details');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Update the transaction in the local state
        setSelectedUserTransactions(prevTransactions => {
          return prevTransactions.map(transaction => {
            const transId = transaction._id || transaction.id;
            if (transId === transactionId) {
              return { ...transaction, ...data.data.transaction };
            }
            return transaction;
          });
        });
        Swal.fire({ title: 'Success!', text: 'Transaction details updated successfully', icon: 'success', timer: 3000 });
        setIsEditTransactionModalOpen(false);
      } else {
        Swal.fire({ title: 'Error', text: data.message || 'Failed to update transaction details', icon: 'error' });
      }
    } catch (error: any) {
      console.error('Error updating transaction details:', error);
      Swal.fire({ title: 'Error', text: error.message || 'An error occurred while updating transaction details', icon: 'error' });
    } finally {
      setTransactionLoading(false);
    }
  };

  // Function to handle viewing user transactions
  const handleViewTransactions = async (userId: string) => {
    try {
      setTransactionLoading(true);
      setIsTransactionModalOpen(true);
      
      // Find the user to get their name
      const user = users.find(u => u._id === userId || u.id === userId);
      if (user) {
        const firstName = user.personalInformation?.firstName || '';
        const lastName = user.personalInformation?.lastName || '';
        setSelectedUserName(`${firstName} ${lastName}`.trim() || 'Unknown User');
      }
      
      // Fetch the user's transactions
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      const response = await fetch(`/api/admin/users/${userId}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }
      
      setSelectedUserTransactions(data.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      Swal.fire({ title: 'Error', text: error instanceof Error ? error.message : 'Failed to fetch transactions', icon: 'error' });
      setSelectedUserTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  // Function to fetch users data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      if (data.status === 'success') {
        setUsers(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch only user statuses (online/offline)
  const fetchUserStatuses = async () => {
    try {
      
      if (!socketRef.current || !socketRef.current.connected) {
        console.warn('⚠️ Socket not connected, cannot fetch user statuses');
        return;
      }
      
      // Use Socket.IO event to get multi-layer detection status
      socketRef.current.emit('get_online_users');
    } catch (error) {
      console.error('Error fetching user statuses:', error);
    }
  };
  
  // Socket.IO reference for real-time status updates
  const socketRef = useRef<Socket | null>(null);
  
  // Reference for status refresh timeout
  const statusRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize Socket.IO connection
  useEffect(() => {
    // Connect to the backend server with more reliable options
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001', {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });
    
    // Connection event handlers
    socketRef.current.on('connect', () => {
      
      // Join admin room for targeted broadcasts
      if (socketRef.current) {
        socketRef.current.emit('join_admin_room');
      }
    });
    
    socketRef.current.on('connect_error', (error: any) => {
      console.error('Socket.IO connection error:', error);
    });
    
    // Test connection event
    socketRef.current.on('connection_test', (data: any) => {
    });
    
    // Admin room joined confirmation
    socketRef.current.on('admin_room_joined', (data: any) => {
      
      // Request immediate status updates for all users
      fetchUserStatuses();
    });
    
    // Listen for online users update response with multi-layer detection
    socketRef.current.on('online_users_update', (enhancedUsers: any[]) => {
      
      // Update users state with enhanced multi-layer detection data
      setUsers(prevUsers => {
        // Merge the enhanced data with existing users
        const updatedUsers = prevUsers.map(existingUser => {
          const enhancedUser = enhancedUsers.find(u => u._id === existingUser._id);
          if (enhancedUser) {
            return {
              ...existingUser,
              ...enhancedUser, // Merge all enhanced detection data
              isOnline: enhancedUser.isReallyOnline // Use the final multi-layer determination
            };
          }
          return existingUser;
        });
        
        return updatedUsers;
      });
    });
    
    // Listen for all events (debug mode)
    socketRef.current.onAny((eventName: any, ...args: any[]) => {
    });
    
    // Listen for user status changes with immediate UI update using multi-layer detection
    socketRef.current.on('user_status_change', (data: any) => {
      
      // CRITICAL: Force immediate UI update for the specific user
      setUsers(prevUsers => {
        
        // Find the user that needs updating
        const userToUpdate = prevUsers.find(user => user._id === data.userId);
        
        if (userToUpdate) {
          // Access name from personalInformation if available
          const firstName = userToUpdate.personalInformation?.firstName || 'Unknown';
          const lastName = userToUpdate.personalInformation?.lastName || 'User';
          
          
          // Create new array with updated user - FORCE the multi-layer isOnline value from the event
          const updatedUsers = prevUsers.map(user => {
            if (user._id === data.userId) {
              // Create a completely new object to ensure React detects the change
              return {
                ...user,
                isOnline: data.isOnline, // Multi-layer detection result
                // Update connection details if provided
                hasActiveSocket: data.hasActiveSocket || false,
                hasAnySocket: data.hasAnySocket || false,
                socketCount: data.socketCount || 0,
                activeSocketId: data.activeSocketId || null,
                dbIsOnline: data.dbIsOnline || user.isOnline,
                lastSeen: data.timestamp || user.lastSeen,
                connectionDetails: data.connectionDetails || user.connectionDetails
              };
            }
            return user;
          });
          
          return updatedUsers;
        } else {
          console.warn(`❌ User with ID ${data.userId} not found in current users list`);
          return prevUsers;
        }
      });
      
      // Cancel any pending status refresh to avoid overriding our real-time update
      if (statusRefreshTimeoutRef.current) {
        clearTimeout(statusRefreshTimeoutRef.current);
      }
      
      // Schedule a delayed refresh to ensure consistency with other users
      statusRefreshTimeoutRef.current = setTimeout(() => {
        fetchUserStatuses();
      }, 3000); // Increased delay to ensure our real-time update isn't overridden
    });
    
    // Clean up on component unmount
    return () => {
      // Clear any pending status refresh timeout
      if (statusRefreshTimeoutRef.current) {
        clearTimeout(statusRefreshTimeoutRef.current);
      }
      
      // Disconnect Socket.IO
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);
  
  useEffect(() => {
    fetchUsers();
    fetchAllInterestRates();
    
    // Set up polling as a fallback mechanism (every 5 seconds)
    const statusRefreshInterval = setInterval(() => {
      fetchUserStatuses(); // Only update user online statuses without refreshing all data
    }, 5000); // 5 seconds for more responsive status updates

    return () => {
      clearInterval(statusRefreshInterval);
    };
  }, []);

  // Function to fetch all interest rates from MongoDB
  const fetchAllInterestRates = async () => {
    try {
      const rates = await fetchInterestRates();
      setInterestRates(rates);
    } catch (error) {
      console.error('Error fetching interest rates:', error);
    }
  };
  
  // Helper function to get interest rate for a specific term
  const getInterestRateForTerm = (term: number): number => {
    // Default interest rate if no matching rate found
    const defaultRate = 0.03;
    
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

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValue = (user: User, field: string) => {
    const fields = field.split('.');
    let value: any = user;
    for (const f of fields) {
      value = value ? value[f] : undefined;
    }
    return value;
  };

  const handleSort = (field: SortField | string) => {
    const sorted = [...users].sort((a, b) => {
      const aValue = getValue(a, field);
      const bValue = getValue(b, field);
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      }
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
      return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
    });

    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Cast field to SortField if it's one of the valid sort fields
      const validSortField = field as SortField;
      setSortField(validSortField);
      setSortDirection('asc');
    }
    setUsers(sorted);
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user status');
      }

      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update user status');
    }
  };

  const handleLoanStatus = async (userId: string, status: LoanStatus) => {
    if (!window.confirm(`Are you sure you want to ${status === 'อนุมัติแล้ว' ? 'approve' : 'reject'} this loan?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Assuming the first/most recent loan of the user
      const response = await fetch(`/api/admin/users/${userId}/loans/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to ${status} loan`);
      }

      // Update the user's loan status in the UI
      setUsers(users.map(user => 
        user.id === userId ? { ...user, loanStatus: status } : user
      ));
    } catch (error) {
      console.error('Error updating loan status:', error);
      alert(error instanceof Error ? error.message : 'Failed to update loan status');
    }
  };
  
  // Function to handle loan deletion
  const handleDeleteLoan = async (userId: string, loanId: string) => {
    if (!window.confirm('Are you sure you want to delete this loan? This action cannot be undone and will also delete all associated transactions.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`/api/admin/loans/${loanId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete loan');
      }
      
      // Get remaining loans count from the API response
      const { remainingLoans } = data.data;
      
      // Update the user's loan count in the UI
      setUsers(users.map(user => {
        if (user.id === userId) {
          const updatedUser = { ...user };
          // Set the exact loan count from the API
          updatedUser.loans = remainingLoans;
          
          // Reset loan status if this was the only loan
          if (remainingLoans === 0) {
            updatedUser.loanStatus = undefined;
            updatedUser.mostRecentLoanId = undefined;
          }
          return updatedUser;
        }
        return user;
      }));
      
      Swal.fire({ title: 'Success!', text: 'Loan deleted successfully', icon: 'success', timer: 3000 });
    } catch (error) {
      console.error('Error deleting loan:', error);
      Swal.fire({ title: 'Error', text: error instanceof Error ? error.message : 'Server error', icon: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }

      // Remove the user from the state
      setUsers(users.filter(user => user.id !== userId));
      
      // Show success message
      alert('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete user');
    }
  };

  const filteredUsers = users
    .filter((user) => {
      if (statusFilter !== 'all' && user.status !== statusFilter) return false;
      const firstName = user.personalInformation?.firstName || '';
      const lastName = user.personalInformation?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      const phone = user.phone || '';
      const searchStr = `${fullName} ${phone}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .sort((a: User, b: User) => {
      if (sortField === 'status') {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
      
      if (sortField === 'personalInformation.name') {
        const aFirstName = a.personalInformation?.firstName || '';
        const aLastName = a.personalInformation?.lastName || '';
        const bFirstName = b.personalInformation?.firstName || '';
        const bLastName = b.personalInformation?.lastName || '';
        
        const aFullName = `${aFirstName} ${aLastName}`.trim();
        const bFullName = `${bFirstName} ${bLastName}`.trim();
        
        return sortDirection === 'asc'
          ? aFullName.toLowerCase().localeCompare(bFullName.toLowerCase())
          : bFullName.toLowerCase().localeCompare(aFullName.toLowerCase());
      }

      if (sortField === 'phone') {
        const aPhone = a.phone || '';
        const bPhone = b.phone || '';
        return sortDirection === 'asc'
          ? aPhone.toLowerCase().localeCompare(bPhone.toLowerCase())
          : bPhone.toLowerCase().localeCompare(aPhone.toLowerCase());
      }
      
      if (sortField === 'loans') {
        const aLoans = a.loans || 0;
        const bLoans = b.loans || 0;
        return sortDirection === 'asc'
          ? aLoans - bLoans
          : bLoans - aLoans;
      }

      
      if (sortField === 'createdAt') {
        // Ensure we have valid date strings before creating Date objects
        const aDate = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const bDate = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      
      return 0;
    });

  // Pagination calculations
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSendNotification = async (userId: string) => {
    const message = notificationMessages[userId];
    if (!message || message.trim() === '') {
      Swal.fire({ title: 'Warning', text: 'Please enter a message to send', icon: 'warning' });
      return;
    }

    try {
      // Set sending state
      setSendingNotification(prev => ({ ...prev, [userId]: true }));
      
      // Get user info for better notification
      const targetUser = users.find(user => (user._id || user.id) === userId);
      const userName = targetUser?.personalInformation?.firstName || 'User';
      
      // Prepare notification data
      const notificationData = {
        userId: userId,
        title: 'Message from Admin',
        message: message,
        type: 'info' as 'info' | 'success' | 'warning' | 'error',
        timestamp: new Date().toISOString()
      };

      // Check socket service instance
      const socketService = SocketService.getInstance();
      
      // Send via socket
      socketService.sendNotificationToUser(userId, notificationData);
      
      // Clear the input and reset sending state
      setNotificationMessages(prev => ({ ...prev, [userId]: '' }));
      Swal.fire({ title: 'Success!', text: `Notification sent to ${userName}`, icon: 'success', timer: 3000 });
    } catch (error) {
      console.error('Error sending notification:', error);
      Swal.fire({ title: 'Error', text: 'Failed to send notification', icon: 'error' });
    } finally {
      setSendingNotification(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleManageWithdrawals = async (userId: string) => {
    try {
      setWithdrawalLoading(true);
      setSelectedUserForWithdrawals(userId);
      
      const user = users.find(u => u._id === userId);
      const userName = user ? `${user.personalInformation?.firstName || ''} ${user.personalInformation?.lastName || ''}`.trim() || user.id || 'Unknown User' : 'Unknown User';
      
      const apiUrl = `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/admin/users/${userId}/withdrawals`;
      const token = localStorage.getItem('token');
      
      // Fetch user's withdrawals
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      
      if (response.ok) {
        const withdrawals = await response.json();
        setSelectedUserWithdrawals(withdrawals);
        setSelectedUserName(userName);
        setIsWithdrawalModalOpen(true);
      } else {
        throw new Error('Failed to fetch withdrawals');
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to fetch user withdrawals',
        icon: 'error'
      });
    } finally {
      setWithdrawalLoading(false);
    }
  };

  const handleEditWithdrawal = (withdrawal: any) => {
    setSelectedWithdrawal(withdrawal);
  };

  const handleUpdateWithdrawal = async (withdrawalId: string, updates: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001'}/api/admin/withdrawals/${withdrawalId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedWithdrawal = await response.json();
        
        // Update the withdrawals list
        setSelectedUserWithdrawals(prev => 
          prev.map(w => w._id === withdrawalId ? updatedWithdrawal : w)
        );
        
        setSelectedWithdrawal(null);
        
        Swal.fire({
          title: 'Success',
          text: 'Withdrawal updated successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        throw new Error('Failed to update withdrawal');
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to update withdrawal',
        icon: 'error'
      });
    }
  };

  const exportUsers = () => {
    // TODO: Implement CSV export
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsTransactionModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        รายการธุรกรรมสำหรับ {selectedUserName}
                      </h3>
                      <button 
                        type="button" 
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setIsTransactionModalOpen(false)}
                      >
                        <span className="sr-only">ปิด</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    
                    {transactionLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : selectedUserTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Wallet className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">ไม่พบข้อมูล</p>
                      </div>
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MongoDB ID</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedUserTransactions.map((transaction) => (
                              <tr key={transaction._id || transaction.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{transaction.reference}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 capitalize">{transaction.type}</div>
                                  {transaction.loan && (
                                    <div className="text-xs text-gray-500">
                                      ระยะเวลา: {transaction.loan.term} เดือน | สถานะ: {transaction.loan.status}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">฿{transaction.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${transaction.status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-800' :
                                      transaction.status === 'รอการอนุมัติ' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'}`}>
                                    {transaction.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {transaction.date || transaction.createdAt ? 
                                      new Date(transaction.date || transaction.createdAt || '').toLocaleString('th-TH', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      }) : 'Unknown date'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {transaction.paymentMethod ? (
                                    <div className="text-sm text-gray-900">
                                      <div>{transaction.paymentMethod.bankName}</div>
                                      <div className="text-xs text-gray-500">
                                        {transaction.paymentMethod.accountNumber}
                                      </div>
                                    </div>
                                  ) : '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {transaction.status !== 'ล้มเหลว' ? (
                                    <button
                                      onClick={() => {
                                        setSelectedTransaction(transaction);
                                        setIsEditTransactionModalOpen(true);
                                      }}
                                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                    >
                                      <PencilIcon className="h-3 w-3 mr-1" />
                                      แก้ไข
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded bg-gray-100 text-gray-800">
                                      ล้มเหลว
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsTransactionModalOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Management Modal */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setIsWithdrawalModalOpen(false)}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        จัดการการถอนเงินสำหรับ {selectedUserName}
                      </h3>
                      <button 
                        type="button" 
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => setIsWithdrawalModalOpen(false)}
                      >
                        <span className="sr-only">ปิด</span>
                        <X className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    
                    {withdrawalLoading ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    ) : selectedUserWithdrawals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="h-16 w-16 text-gray-300 mb-4" />
                        <p className="text-gray-500 text-lg">ไม่พบการถอนเงินสำหรับผู้ใช้รายนี้</p>
                      </div>
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จำนวนเงิน</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บัญชีธนาคาร</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เหตุผลล้มเหลว/ถูกปฏิเสธ</th>
                               <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สร้าง</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedUserWithdrawals.map((withdrawal) => (
                              <tr key={withdrawal._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-mono text-gray-900">{withdrawal._id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900 font-semibold">฿{withdrawal.amount.toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                    ${withdrawal.status === 'เสร็จสิ้น' ? 'bg-green-100 text-green-800' :
                                      withdrawal.status === 'อนุมัติแล้ว' ? 'bg-blue-100 text-blue-800' :
                                      withdrawal.status === 'รอการอนุมัติ' ? 'bg-yellow-100 text-yellow-800' :
                                      withdrawal.status === 'ปฏิเสธ' ? 'bg-red-100 text-red-800' :
                                      withdrawal.status === 'ล้มเหลว' ? 'bg-orange-100 text-orange-800' :
                                      'bg-gray-100 text-gray-800'}`}>
                                    {withdrawal.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    <div className="font-medium">{withdrawal.bankAccount.bankName}</div>
                                    <div className="text-gray-500">{withdrawal.bankAccount.accountNumber}</div>
                                    <div className="text-gray-500">{withdrawal.bankAccount.accountName}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-gray-900">
                                    {withdrawal.status === 'ล้มเหลว' && withdrawal.failureReason && (
                                      <div className="bg-red-50 border border-red-200 rounded-md p-2">
                                        <div className="text-xs font-medium text-red-800 mb-1">Failure Reason:</div>
                                        <div className="text-red-700">{withdrawal.failureReason}</div>
                                      </div>
                                    )}
                                    {withdrawal.status === 'ปฏิเสธ' && withdrawal.rejectionReason && (
                                      <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
                                        <div className="text-xs font-medium text-orange-800 mb-1">Rejection Reason:</div>
                                        <div className="text-orange-700">{withdrawal.rejectionReason}</div>
                                      </div>
                                    )}
                                    {(!withdrawal.failureReason && !withdrawal.rejectionReason) && (
                                      <span className="text-gray-400 text-xs">-</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {new Date(withdrawal.createdAt).toLocaleString('th-TH', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => handleEditWithdrawal(withdrawal)}
                                    className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    แก้ไข
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setIsWithdrawalModalOpen(false)}
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Edit Modal */}
      {selectedWithdrawal && (
        <WithdrawalEditModal
          withdrawal={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
          onUpdate={handleUpdateWithdrawal}
        />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาผู้ใช้..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <select
                className="block pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="active">ใช้งานอยู่</option>
                <option value="inactive">ไม่ใช้งาน</option>
                <option value="pending">รอดำเนินการ</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">การดำเนินการ</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('personalInformation.name')}>
                    <div className="flex items-center">ชื่อ-นามสกุล<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('phone')}>
                    <div className="flex items-center">ติดต่อ<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">สถานะ<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('loans')}>
                    <div className="flex items-center">ข้อมูลเงินกู้<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">ข้อมูลกระเป๋าเงิน</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">รายการ</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">ส่งการแจ้งเตือน</div>
                  </th>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">ด้านหน้าบัตรประชาชน</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">ด้านหลังบัตรประชาชน</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">ภาพถ่ายตัวเองคู่กับบัตร</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">ลายเซ็นดิจิทัล</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('address.province')}>
                    <div className="flex items-center">ที่อยู่<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('bankAccount.bankName')}>
                    <div className="flex items-center">ข้อมูลธนาคาร<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('financialInformation.incomeMonthly')}>
                    <div className="flex items-center">ข้อมูลทางการเงิน<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('familyContact.familyName')}>
                    <div className="flex items-center">ผู้ติดต่อครอบครัว<ArrowUpDown className="ml-2 h-4 w-4" /></div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">กิจกรรม</div>
                  </th>

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user: User) => (
                  <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="relative inline-block text-left">
                        <Menu as="div" className="relative inline-block text-left">
                          {({ open }: { open: boolean }) => (
                            <>
                              <Menu.Button className="p-2 hover:bg-gray-100 rounded-full">
                                <MoreVertical className="h-5 w-5 text-gray-400" />
                              </Menu.Button>
                              <Transition
                                show={open}
                                as={React.Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <Menu.Items className="absolute left-0 top-full mt-1 w-48 origin-top-left bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999] divide-y divide-gray-100">
                                  <div className="py-1">
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <Link
                                          to={`/users/${user.id}/edit`}
                                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center px-4 py-2 text-sm`}
                                        >
                                          <Edit className="mr-3 h-5 w-5 text-gray-400" />
                                          แก้ไขผู้ใช้
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <Link
                                          to={`/users/${user.id}/loans/edit`}
                                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center px-4 py-2 text-sm`}
                                        >
                                          <DollarSign className="mr-3 h-5 w-5 text-gray-400" />
                                          แก้ไขสินเชื่อ
                                        </Link>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <button
                                          type="button"
                                          onClick={() => user.loans && user.loans > 0 && user.mostRecentLoanId && handleDeleteLoan(user.id, user.mostRecentLoanId)}
                                          className={`${active ? 'bg-gray-100 text-red-900' : 'text-red-700'} flex items-center w-full px-4 py-2 text-sm ${(!user.loans || user.loans <= 0 || !user.mostRecentLoanId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                          disabled={!user.loans || user.loans <= 0 || !user.mostRecentLoanId}
                                        >
                                          <Trash2 className="mr-3 h-5 w-5 text-red-500" />
                                          ลบสินเชื่อ
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                       {({ active }: { active: boolean }) => (
                                         <Link
                                           to={`/users/${user.id}/wallet/edit`}
                                           className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center px-4 py-2 text-sm`}
                                         >
                                           <Wallet className="mr-3 h-5 w-5 text-gray-400" />
                                           แก้ไขกระเป๋าเงิน
                                         </Link>
                                       )}
                                     </Menu.Item>
                                     <Menu.Item>
                                       {({ active }: { active: boolean }) => (
                                         <button
                                           type="button"
                                           onClick={() => handleManageWithdrawals(user._id || user.id)}
                                           className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center w-full px-4 py-2 text-sm`}
                                         >
                                           <DollarSign className="mr-3 h-5 w-5 text-gray-400" />
                                           จัดการการถอนเงิน
                                         </button>
                                       )}
                                     </Menu.Item>
                                    
                                      <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                          <button
                                            type="button"
                                            onClick={() => handleLoanStatus(user.id, 'อนุมัติแล้ว')}
                                            className={`${active ? 'bg-gray-100 text-green-900' : 'text-green-700'} flex items-center w-full px-4 py-2 text-sm`}
                                          >
                                            <ThumbsUp className="mr-3 h-5 w-5 text-green-500" />
                                            อนุมัติสินเชื่อ
                                          </button>
                                        )}
                                      </Menu.Item>
                                    
                                      <Menu.Item>
                                        {({ active }: { active: boolean }) => (
                                          <button
                                            type="button"
                                            onClick={() => handleLoanStatus(user.id, 'ปฏิเสธ')}
                                            className={`${active ? 'bg-gray-100 text-red-900' : 'text-red-700'} flex items-center w-full px-4 py-2 text-sm`}
                                          >
                                            <ThumbsDown className="mr-3 h-5 w-5 text-red-500" />
                                            ปฏิเสธสินเชื่อ
                                          </button>
                                        )}
                                      </Menu.Item>
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                                          className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} flex items-center w-full px-4 py-2 text-sm`}
                                        >
                                          {user.status === 'active' ? (
                                            <>
                                              <Ban className="mr-3 h-5 w-5 text-gray-400" />
                                              ปิดการใช้งาน
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle2 className="mr-3 h-5 w-5 text-gray-400" />
                                              เปิดการใช้งาน
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </Menu.Item>
                                    <Menu.Item>
                                      {({ active }: { active: boolean }) => (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUser(user.id)}
                                          className={`${active ? 'bg-gray-100 text-red-900' : 'text-red-700'} flex items-center w-full px-4 py-2 text-sm`}
                                        >
                                          <Trash2 className="mr-3 h-5 w-5 text-red-400" />
                                          ลบ
                                        </button>
                                      )}
                                    </Menu.Item>
                                  </div>
                                </Menu.Items>
                              </Transition>
                            </>
                          )}
                        </Menu>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.personalInformation?.firstName && user.personalInformation?.lastName ? `${user.personalInformation.firstName} ${user.personalInformation.lastName}` : 'N/A'}</div>
                      <div className="text-sm text-gray-500">ID: {user.personalInformation?.nationalId || 'N/A'}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        PW: {user.password ? (
                          <PasswordDisplay password={user.password} />
                        ) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ActivityStatus 
                        isOnline={user.isOnline} 
                        userId={user._id || user.id}
                        lastSeen={user.lastSeen}
                        socketId={user.activeSocketId || user.currentSocketId}
                        hasActiveSocket={user.hasActiveSocket}
                        hasAnySocket={user.hasAnySocket}
                        socketCount={user.socketCount}
                        dbIsOnline={user.dbIsOnline}
                        connectionDetails={user.connectionDetails}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">สินเชื่อ: {user.loans || 0}</div>
                      <div className="text-sm text-gray-500">จำนวนเงิน: {user.totalBorrowed ? `฿${user.totalBorrowed.toLocaleString()}` : 'ไม่มีข้อมูล'}</div>
                      <div className="text-sm text-gray-500">ระยะเวลา: {user.term || 'ไม่มีข้อมูล'} {user.term ? 'เดือน' : ''}</div>
                      <div className="text-sm text-gray-500">รายเดือน: {
                        // Calculate the monthly payment if we have amount and term
                        user.totalBorrowed && user.term 
                          ? (() => {
                              const amount = user.totalBorrowed;
                              const term = user.term;
                              
                              // Get interest rate from MongoDB using our helper function
                              const rate = getInterestRateForTerm(term);
                              
                              // Calculate payments using the MongoDB rate
                              const totalInterest = amount * rate;
                              const totalPayment = amount + totalInterest;
                              const monthlyPayment = totalPayment / term;
                              return `฿${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                            })()
                          : (user.monthlyPayment ? `฿${user.monthlyPayment.toLocaleString()}` : 'ไม่มีข้อมูล')
                      }</div>
                      <div className="text-sm text-gray-500">รวมทั้งหมด: {
                        user.totalBorrowed 
                          ? (() => {
                              const amount = user.totalBorrowed;
                              
                              // Get interest rate from MongoDB data if available
                              let rate = 0.03; // Default fallback rate
                              if (interestRates.length > 0) {
                                // Find the matching interest rate for the user's term
                                const matchingRate = interestRates.find(r => r.term === user.term);
                                if (matchingRate) {
                                  rate = matchingRate.rate;
                                }
                              }
                              
                              const totalInterest = amount * rate;
                              const totalPayment = amount + totalInterest;
                              return `฿${totalPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
                            })()
                          : (user.totalPayment ? `฿${user.totalPayment.toLocaleString()}` : 'ไม่มีข้อมูล')
                      }</div>
                      <div className="text-sm text-gray-500">สถานะ: {user.loanStatus || 'ไม่มีข้อมูล'}</div>
                      

                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">ยอดคงเหลือ: {user.availableBalance ? `฿${user.availableBalance.toLocaleString()}` : '฿0'}</div>
                      <div className="text-sm text-gray-500">วงเงินอนุมัติ: {user.approvedLoanAmount ? `฿${user.approvedLoanAmount.toLocaleString()}` : '฿0'}</div>
                      <div className="text-sm text-gray-500">รอถอน: {user.pendingWithdrawals ? `฿${user.pendingWithdrawals.toLocaleString()}` : '฿0'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewTransactions(user._id || user.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span className="mr-1">ดูรายการ</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <input 
                        type="text" 
                        className="w-24 h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mr-2"
                        placeholder="ข้อความ..."
                        value={notificationMessages[user._id || user.id] || ''}
                        onChange={(e) => {
                          setNotificationMessages({
                            ...notificationMessages,
                            [user._id || user.id]: e.target.value
                          });
                        }}
                      />
                      <button
                        onClick={() => handleSendNotification(user._id || user.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={sendingNotification[user._id || user.id] || !notificationMessages[user._id || user.id]}
                      >
                        {sendingNotification[user._id || user.id] ? (
                          <span className="mr-1">กำลังส่ง...</span>
                        ) : (
                          <>
                            <span className="mr-1">ส่ง</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.documents?.idCardFront?.url ? (
                        <img src={formatImageUrl(user.documents.idCardFront.url)} alt="ID Front" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.documents?.idCardBack?.url ? (
                        <img src={formatImageUrl(user.documents.idCardBack.url)} alt="ID Back" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.documents?.selfieWithId?.url ? (
                        <img src={formatImageUrl(user.documents.selfieWithId.url)} alt="Selfie" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.signatureUrl ? (
                        <img src={formatImageUrl(user.signatureUrl)} alt="Signature" className="h-12 w-12 object-contain rounded-lg border border-gray-200" />
                      ) : (
                        <span className="text-gray-400 text-sm">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{user.address?.homeNumber || 'N/A'}</div>
                        <div>{user.address?.subdistrict || 'N/A'}, {user.address?.district || 'N/A'}</div>
                        <div>{user.address?.province || 'N/A'}, {user.address?.zipCode || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.bankAccount?.bankName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.bankAccount?.accountNumber || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.bankAccount?.accountName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">รายได้: ฿{user.financialInformation?.incomeMonthly?.toLocaleString() || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.financialInformation?.employmentStatus ? translateEmploymentStatus(user.financialInformation.employmentStatus) : 'N/A'}</div>
                      <div className="text-sm text-gray-500">วัตถุประสงค์: {user.financialInformation?.loanPurpose || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.familyContact?.familyName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.familyContact?.familyPhone || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{user.familyContact?.relationship || 'N/A'}</div>
                      {user.familyContact?.address && (
                        <div className="mt-1 text-sm text-gray-500">
                          <div>{user.familyContact.address.homeNumber || ''}</div>
                          <div>{[user.familyContact.address.subdistrict, user.familyContact.address.district].filter(Boolean).join(', ')}</div>
                          <div>{[user.familyContact.address.province, user.familyContact.address.zipCode].filter(Boolean).join(' ')}</div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user.status || 'รอการอนุมัติ')}`}>
                        {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'รอดำเนินการ'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  แสดง {startIndex + 1} ถึง {Math.min(endIndex, totalUsers)} จาก {totalUsers} รายการ
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="ml-4 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5 รายการ</option>
                  <option value={10}>10 รายการ</option>
                  <option value={20}>20 รายการ</option>
                  <option value={50}>50 รายการ</option>
                  <option value={100}>100 รายการ</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="หน้าแรก"
                >
                  <ChevronsLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="หน้าถัดไป"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="หน้าสุดท้าย"
                >
                  <ChevronsRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      <Dialog
        open={isEditTransactionModalOpen}
        onClose={() => setIsEditTransactionModalOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="mx-auto max-w-xl rounded bg-white p-6 w-full">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-medium">Edit Transaction</Dialog.Title>
              <button
                onClick={() => setIsEditTransactionModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedTransaction && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const transactionId = selectedTransaction._id || selectedTransaction.id;
                  
                  if (transactionId) {
                    const amount = parseFloat(formData.get('amount') as string);
                    const status = formData.get('status') as TransactionStatus;
                    const dateStr = formData.get('date') as string;
                    const bankName = formData.get('bankName') as string;
                    const accountNumber = formData.get('accountNumber') as string;
                    const accountName = formData.get('accountName') as string;
                    
                    const updateData: any = {};
                    
                    // Only include fields that have values and are different from current values
                    if (!isNaN(amount) && amount !== selectedTransaction.amount) {
                      updateData.amount = amount;
                    }
                    
                    if (status && status !== selectedTransaction.status) {
                      updateData.status = status;
                    }
                    
                    // Process date if it's changed
                    if (dateStr) {
                      const newDate = new Date(dateStr).toISOString();
                      const currentDate = selectedTransaction.date || selectedTransaction.createdAt || '';
                      if (newDate !== new Date(currentDate).toISOString()) {
                        updateData.date = newDate;
                      }
                    }
                    
                    // Only include bank account if all fields are provided and different from current values
                    const currentBankAccount = selectedTransaction.bankAccount || selectedTransaction.paymentMethod || { bankName: '', accountNumber: '', accountName: '' };
                    if (bankName && accountNumber && accountName && (
                      bankName !== currentBankAccount.bankName ||
                      accountNumber !== currentBankAccount.accountNumber ||
                      accountName !== currentBankAccount.accountName
                    )) {
                      updateData.bankAccount = {
                        bankName,
                        accountNumber,
                        accountName
                      };
                    }
                    
                    // Only send update if there are changes
                    if (Object.keys(updateData).length > 0) {
                      handleUpdateTransactionDetails(transactionId, updateData);
                    } else {
                      setIsEditTransactionModalOpen(false);
                      Swal.fire({ title: 'Info', text: 'No changes detected', icon: 'info', timer: 3000 });
                    }
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                    <div className="mt-1 py-2 px-3 bg-gray-100 rounded text-sm capitalize">
                      {selectedTransaction.type}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (THB)</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">฿</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        defaultValue={selectedTransaction.amount}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      id="status"
                      name="status"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue={selectedTransaction.status}
                    >
                      <option value="รอการอนุมัติ">รอดำเนินการ</option>
                      <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                      <option value="ล้มเหลว">ล้มเหลว</option>
                      <option value="ปฏิเสธ">ปฏิเสธ</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700">Transaction Date</label>
                    <input
                      type="datetime-local"
                      name="date"
                      id="date"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      defaultValue={
                        selectedTransaction.date || selectedTransaction.createdAt 
                          ? new Date(selectedTransaction.date || selectedTransaction.createdAt || '').toISOString().slice(0, 16)
                          : ''
                      }
                    />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">รายละเอียดบัญชีธนาคาร</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">ชื่อธนาคาร</label>
                      <input
                        type="text"
                        name="bankName"
                        id="bankName"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue={
                          selectedTransaction.bankAccount?.bankName || 
                          selectedTransaction.paymentMethod?.bankName || ''
                        }
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
                      <input
                        type="text"
                        name="accountNumber"
                        id="accountNumber"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue={
                          selectedTransaction.bankAccount?.accountNumber || 
                          selectedTransaction.paymentMethod?.accountNumber || ''
                        }
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Account Name</label>
                      <input
                        type="text"
                        name="accountName"
                        id="accountName"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        defaultValue={
                          selectedTransaction.bankAccount?.accountName || 
                          selectedTransaction.paymentMethod?.accountName || ''
                        }
                      />
                    </div>
                  </div>
                </div>
                
                {selectedTransaction.loan && (
                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Loan Information</h3>
                    <div className="bg-gray-50 p-3 rounded-md text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500">Loan Amount:</span>{' '}
                          <span className="font-medium">฿{selectedTransaction.loan.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Term:</span>{' '}
                          <span className="font-medium">{selectedTransaction.loan.term} months</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500">Status:</span>{' '}
                          <span className="font-medium capitalize">{selectedTransaction.loan.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditTransactionModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
};

export default UsersPage;