import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Download, 
  FileText,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpDown,
  AlertCircle
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { format } from 'date-fns';

interface Loan {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  purpose: string;
  status: 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'เสร็จสิ้น';
  term: number;
  interestRate: number;
  applicationDate: string;
  lastUpdated: string;
}

const LoansPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Loan>('applicationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock data
  const loans: Loan[] = [
    {
      id: 'L1',
      userId: 'U1',
      userName: 'John Doe',
      amount: 10000,
      purpose: 'Business Expansion',
      status: 'รอการอนุมัติ',
      term: 12,
      interestRate: 2.90,
      applicationDate: '2024-03-01T10:30:00Z',
      lastUpdated: '2024-03-01T10:30:00Z'
    },
    {
      id: 'L2',
      userId: 'U2',
      userName: 'Jane Smith',
      amount: 5000,
      purpose: 'Personal Expense',
      status: 'อนุมัติแล้ว',
      term: 6,
      interestRate: 6.99,
      applicationDate: '2024-02-28T15:45:00Z',
      lastUpdated: '2024-02-28T16:30:00Z'
    },
    {
      id: 'L3',
      userId: 'U3',
      userName: 'Mike Johnson',
      amount: 15000,
      purpose: 'Debt Consolidation',
      status: 'เสร็จสิ้น',
      term: 24,
      interestRate: 7.99,
      applicationDate: '2024-02-25T09:15:00Z',
      lastUpdated: '2024-02-25T14:20:00Z'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'อนุมัติแล้ว':
        return 'bg-green-100 text-green-800';
      case 'ปฏิเสธ':
        return 'bg-red-100 text-red-800';
      case 'รอการอนุมัติ':
        return 'bg-yellow-100 text-yellow-800';
      case 'เสร็จสิ้น':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'อนุมัติแล้ว':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'ปฏิเสธ':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'รอการอนุมัติ':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'เสร็จสิ้น':
        return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleSort = (field: keyof Loan) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredLoans = loans
    .filter(loan => 
      (statusFilter === 'all' || loan.status === statusFilter) &&
      (loan.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
       loan.id.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
      
      return 0;
    });

  const exportLoans = () => {
    // Implementation for exporting loans data
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">คำขอสินเชื่อ</h1>
        <button
          onClick={exportLoans}
          className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4 mr-2" />
          ส่งออก
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="ค้นหาสินเชื่อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Menu>
                <Menu.Button className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Filter className="w-4 h-4 mr-2" />
                  สถานะ
                </Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1">
                    {[
                      { value: 'all', label: 'สถานะทั้งหมด' },
                      { value: 'รอการอนุมัติ', label: 'รอดำเนินการ' },
                      { value: 'อนุมัติแล้ว', label: 'อนุมัติแล้ว' },
                      { value: 'ปฏิเสธ', label: 'ปฏิเสธ' },
                      { value: 'เสร็จสิ้น', label: 'เสร็จสิ้น' }
                    ].map((status) => (
                      <Menu.Item key={status.value}>
                        {({ active }: { active: boolean }) => (
                          <button
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } block w-full text-left px-4 py-2 text-sm`}
                            onClick={() => setStatusFilter(status.value)}
                          >
                            {status.label}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </div>
                </Menu.Items>
              </Menu>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    Loan ID
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center">
                    Applicant
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    จำนวนเงิน
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วัตถุประสงค์
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ระยะเวลา
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('applicationDate')}
                >
                  <div className="flex items-center">
                    วันที่สมัคร
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">การดำเนินการ</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {loan.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/users/${loan.userId}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {loan.userName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${loan.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {loan.purpose}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {loan.term} months
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(loan.status)}
                      <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(loan.applicationDate), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative inline-block text-left">
                      <Menu>
                        <Menu.Button className="p-2 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-5 w-5 text-gray-400" />
                        </Menu.Button>
                        <Transition
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <Link
                                    to={`/loans/${loan.id}`}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } flex items-center px-4 py-2 text-sm`}
                                  >
                                    <FileText className="mr-3 h-5 w-5 text-gray-400" />
                                    ดูรายละเอียด
                                  </Link>
                                )}
                              </Menu.Item>
                              {loan.status === 'รอการอนุมัติ' && (
                                <>
                                  <Menu.Item>
                                    {({ active }: { active: boolean }) => (
                                      <button
                                        type="button"
                                        className={`${
                                          active ? 'bg-gray-100 text-green-900' : 'text-green-700'
                                        } flex items-center w-full px-4 py-2 text-sm`}
                                      >
                                        <CheckCircle2 className="mr-3 h-5 w-5 text-green-400" />
                                        อนุมัติ
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }: { active: boolean }) => (
                                      <button
                                        type="button"
                                        className={`${
                                          active ? 'bg-gray-100 text-red-900' : 'text-red-700'
                                        } flex items-center w-full px-4 py-2 text-sm`}
                                      >
                                        <XCircle className="mr-3 h-5 w-5 text-red-400" />
                                        ปฏิเสธ
                                      </button>
                                    )}
                                  </Menu.Item>
                                </>
                              )}
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoansPage;
