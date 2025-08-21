import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  ArrowLeft,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

interface UserDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  joinDate: string;
  status: 'active' | 'inactive' | 'รอการอนุมัติ';
  totalLoans: number;
  totalBorrowed: number;
  currentBalance: number;
}

interface LoanHistory {
  id: string;
  amount: number;
  status: 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'เสร็จสิ้น';
  date: string;
  purpose: string;
  term: number;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  date: string;
  status?: string;
}

const UserDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'profile' | 'loans' | 'activity'>('profile');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [confirmPasswordView, setConfirmPasswordView] = useState<boolean>(false);

  // Function to fetch user password
  const fetchUserPassword = async () => {
    if (!confirmPasswordView) {
      setConfirmPasswordView(true);
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }
      
      const response = await fetch(`/api/admin/users/${id}/password`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setPassword(data.data.password);
        setShowPassword(true);
      } else {
        setError(data.message || 'Failed to fetch password');
      }
    } catch (error) {
      setError('An error occurred while fetching the password');
      console.error('Password fetch error:', error);
    } finally {
      setIsLoading(false);
      setConfirmPasswordView(false);
    }
  };
  
  // Mock data - In a real app, this would come from an API
  const userDetails: UserDetails = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    joinDate: '2024-01-15',
    status: 'active',
    totalLoans: 3,
    totalBorrowed: 25000,
    currentBalance: 15000
  };

  const loanHistory: LoanHistory[] = [
    {
      id: 'L1',
      amount: 10000,
      status: 'รอการอนุมัติ',
      date: '2024-01-20',
      purpose: 'Business Expansion',
      term: 12
    },
    {
      id: 'L2',
      amount: 5000,
      status: 'รอการอนุมัติ',
      date: '2024-02-15',
      purpose: 'Personal Expense',
      term: 6
    },
    {
      id: 'L3',
      amount: 10000,
      status: 'รอการอนุมัติ',
      date: '2024-03-01',
      purpose: 'Debt Consolidation',
      term: 12
    }
  ];

  const activityLog: ActivityLog[] = [
    {
      id: 'A1',
      type: 'Login',
      description: 'User logged in from new device',
      date: '2024-03-01T10:30:00Z'
    },
    {
      id: 'A2',
      type: 'Loan Application',
      description: 'Submitted new loan application',
      date: '2024-03-01T09:15:00Z',
      status: 'รอการอนุมัติ'
    },
    {
      id: 'A3',
      type: 'Payment',
      description: 'Made monthly payment',
      date: '2024-02-28T14:20:00Z',
      status: 'รอการอนุมัติ'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'อนุมัติแล้ว':
      case 'เสร็จสิ้น':
      case 'อนุมัติแล้ว':
        return 'bg-green-100 text-green-800';
      case 'ปฏิเสธ':
        return 'bg-red-100 text-red-800';
      case 'รอการอนุมัติ':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'เสร็จสิ้น':
      case 'อนุมัติแล้ว':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'ปฏิเสธ':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'รอการอนุมัติ':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  // Confirmation dialog for password viewing
  const renderConfirmationDialog = () => {
    if (!confirmPasswordView) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Security Confirmation</h3>
          <p className="text-gray-600 mb-4">
            You are about to view a user's password information. This action will be logged for security purposes.
            Are you sure you want to proceed?
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmPasswordView(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={fetchUserPassword}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      {renderConfirmationDialog()}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/users" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        </div>
        <Link
          to={`/users/${id}/edit`}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Edit className="w-4 h-4 mr-2" />
          แก้ไขผู้ใช้
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {(['profile', 'loans', 'activity'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {userDetails.firstName} {userDetails.lastName}
                  </h2>
                  <p className="text-gray-500">Member since {format(new Date(userDetails.joinDate), 'MMMM yyyy')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Loans</div>
                  <div className="mt-1 text-2xl font-semibold">{userDetails.totalLoans}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Borrowed</div>
                  <div className="mt-1 text-2xl font-semibold">${userDetails.totalBorrowed.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Current Balance</div>
                  <div className="mt-1 text-2xl font-semibold">${userDetails.currentBalance.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="w-5 h-5 text-gray-400 mr-2" />
                      <span>{userDetails.email}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-5 h-5 text-gray-400 mr-2" />
                      <span>{userDetails.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                      <span>
                        {userDetails.address}, {userDetails.city}, {userDetails.state} {userDetails.zipCode}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <span>Joined {format(new Date(userDetails.joinDate), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(userDetails.status)}`}>
                        {userDetails.status.charAt(0).toUpperCase() + userDetails.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-gray-400 mr-2" />
                      <div className="flex items-center space-x-2">
                        {password ? (
                          <>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {showPassword ? password : '•••'}
                            </span>
                            <button 
                              onClick={() => setShowPassword(!showPassword)}
                              className="p-1 rounded-full hover:bg-gray-100"
                              title={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={fetchUserPassword}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Loading...' : 'View Password'}
                          </button>
                        )}
                      </div>
                    </div>
                    {error && (
                      <div className="text-red-500 text-sm mt-1">{error}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'loans' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Loan ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        จำนวนเงิน
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วัตถุประสงค์
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Term
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        วันที่
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loanHistory.map((loan) => (
                      <tr key={loan.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {loan.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${loan.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loan.purpose}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {loan.term} months
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(loan.date), 'MMM d, yyyy')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {activityLog.map((activity, index) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {index !== activityLog.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {activity.status ? getStatusIcon(activity.status) : <FileText className="w-5 h-5 text-gray-500" />}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.type}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {activity.description}
                            </div>
                            <div className="mt-1 text-sm text-gray-400">
                              {format(new Date(activity.date), 'MMM d, yyyy h:mm a')}
                            </div>
                          </div>
                          {activity.status && (
                            <div className="flex-shrink-0">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                                {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;