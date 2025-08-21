import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Wallet } from 'lucide-react';

interface WalletData {
  availableBalance: number;
  approvedLoanAmount: number;
  pendingWithdrawals: number;
}

const WalletEditPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  
  // Form state
  const [formData, setFormData] = useState<WalletData>({
    availableBalance: 0,
    approvedLoanAmount: 0,
    pendingWithdrawals: 0
  });

  useEffect(() => {
    const fetchUserWallet = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          const user = data.data;
          
          // Set user name for display
          const firstName = user.personalInformation?.firstName || '';
          const lastName = user.personalInformation?.lastName || '';
          setUserName(`${firstName} ${lastName}`.trim() || user.phone || 'User');
          
          // Initialize form data from user
          setFormData({
            availableBalance: user.availableBalance || 0,
            approvedLoanAmount: user.approvedLoanAmount || 0,
            pendingWithdrawals: user.pendingWithdrawals || 0
          });
        } else {
          throw new Error(data.message || 'Failed to fetch user details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserWallet();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Validate input to ensure it's not negative
    const numValue = parseFloat(value);
    if (numValue < 0) return;
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue || 0
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare data for API
      const updateData = {
        ...formData
      };

      const response = await fetch(`/api/admin/users/${userId}/wallet`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update wallet');
      }

      // Show success message and navigate back to users list
      navigate('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update wallet');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button 
            disabled
            className="flex items-center text-gray-400 cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </button>
          
          <h1 className="text-2xl font-bold mt-4 flex items-center text-gray-400">
            <Wallet className="w-6 h-6 mr-2" />
            Loading...
          </h1>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับ
        </button>
        
        <h1 className="text-2xl font-bold mt-4 flex items-center">
          <Wallet className="w-6 h-6 mr-2 text-blue-600" />
          แก้ไขกระเป๋าเงิน: {userName}
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="availableBalance" className="block text-sm font-medium text-gray-700">
                  ยอดเงิน
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">฿</span>
                  </div>
                  <input
                    type="number"
                    name="availableBalance"
                    id="availableBalance"
                    value={formData.availableBalance}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">THB</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="approvedLoanAmount" className="block text-sm font-medium text-gray-700">
                  ยอดเงินกู้
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">฿</span>
                  </div>
                  <input
                    type="number"
                    name="approvedLoanAmount"
                    id="approvedLoanAmount"
                    value={formData.approvedLoanAmount}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">THB</span>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="pendingWithdrawals" className="block text-sm font-medium text-gray-700">
                  ยอดเงินถอน
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">฿</span>
                  </div>
                  <input
                    type="number"
                    name="pendingWithdrawals"
                    id="pendingWithdrawals"
                    value={formData.pendingWithdrawals}
                    onChange={handleChange}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">THB</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 px-4 py-4 sm:px-6 border-t border-gray-200">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึก
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalletEditPage;
