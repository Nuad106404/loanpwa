import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign } from 'lucide-react';
import { fetchInterestRateByTerm, fetchInterestRates, InterestRate } from '../services/interestRateService';

type LoanStatus = 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'เสร็จสิ้น';

interface Loan {
  _id: string;
  amount: number;
  term: number;
  monthlyPayment: number;
  totalPayment: number;
  status: LoanStatus;
  user: string;
  createdAt: string;
  updatedAt: string;
}

const LoanEditPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Store all user loans in case we need to switch between them in the future
  const [, setUserLoans] = useState<Loan[]>([]);
  const [interestRate, setInterestRate] = useState<InterestRate | null>(null);
  const [availableTerms, setAvailableTerms] = useState<InterestRate[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    amount: string;
    term: string;
    status: string;
  }>({
    amount: '',
    term: '',
    status: ''
  });

  // Fetch all available interest rates when component loads
  useEffect(() => {
    const loadInterestRates = async () => {
      try {
        const rates = await fetchInterestRates();
        // Sort rates by term in ascending order
        rates.sort((a, b) => a.term - b.term);
        setAvailableTerms(rates);
      } catch (err) {
        console.error('Failed to fetch interest rates:', err);
      }
    };
    
    loadInterestRates();
  }, []);

  // Fetch interest rate when term changes
  useEffect(() => {
    if (formData.term) {
      fetchInterestRateForTerm(parseInt(formData.term, 10));
    }
  }, [formData.term]);

  useEffect(() => {
    const fetchUserLoans = async () => {
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
          // Check if the user has any loans
          const userWithLoans = data.data;
          
          // Get the user's loans from the response
          const loans = userWithLoans.loans || [];
          
          if (loans.length === 0) {
            // Create a mock loan for demonstration
            const mockLoan: Loan = {
              _id: 'new-loan',
              amount: 1000,
              term: 6,
              monthlyPayment: 196.67,
              totalPayment: 1180,
              status: 'รอการอนุมัติ',
              user: userId || '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setUserLoans([mockLoan]);
            setSelectedLoan(mockLoan);
            
            // Initialize form data from mock loan
            setFormData({
              amount: mockLoan.amount.toString(),
              term: mockLoan.term.toString(),
              status: mockLoan.status
            });
            
            // Fetch the interest rate for the mock loan's term
            fetchInterestRateForTerm(mockLoan.term);
          } else {
            // Use the first loan from the user's loans
            setUserLoans(loans);
            setSelectedLoan(loans[0]);
            
            // Initialize form data from the first loan
            setFormData({
              amount: loans[0].amount.toString(),
              term: loans[0].term.toString(),
              status: loans[0].status
            });
            
            // Fetch the interest rate for the first loan's term
            fetchInterestRateForTerm(loans[0].term);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch user details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserLoans();
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Fetch updated interest rate when term changes
    if (name === 'term' && value) {
      fetchInterestRateForTerm(parseInt(value, 10));
    }
  };
  
  // Fetch interest rate for a specific term
  const fetchInterestRateForTerm = async (term: number) => {
    try {
      const rate = await fetchInterestRateByTerm(term);
      setInterestRate(rate);
    } catch (err) {
      console.error('Error fetching interest rate:', err);
      setError('Failed to fetch interest rate');
    }
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

      // Calculate the monthly and total payment values using current interest rate
      const { monthlyPayment, totalPayment } = calculateLoanDetails();
      
      // Prepare data for API
      const updateData = {
        amount: parseFloat(formData.amount),
        term: parseInt(formData.term, 10),
        status: formData.status as LoanStatus,
        monthlyPayment,
        totalPayment,
        appliedRate: interestRate?.rate || 0.03 // Include the actual applied interest rate
      };

      // Use 'new' as the loan ID for new loans
      const loanId = selectedLoan?._id === 'new-loan' ? 'new' : (selectedLoan?._id || 'new');
      const response = await fetch(`/api/admin/users/${userId}/loans/${loanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update loan');
      }

      // Navigate back to users list after successful save
      navigate('/users');
      // Show success message
      alert('Loan updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update loan');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setSaving(false);
    }
  };

  // Calculate monthly payment and total payment based on amount, term, and interest rate from MongoDB
  const calculateLoanDetails = () => {
    const amount = parseFloat(formData.amount) || 0;
    const term = parseInt(formData.term, 10) || 6;
    
    // Use the interest rate from MongoDB or fall back to 0.03 if not available
    const rate = interestRate?.rate || 0.03;
    
    const totalInterest = amount * rate;
    const totalPayment = amount + totalInterest;
    const monthlyPayment = totalPayment / term;
    
    return {
      monthlyPayment,
      totalPayment
    };
  };

  const { monthlyPayment, totalPayment } = calculateLoanDetails();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/users')} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">แก้ไขสินเชื่อ</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-md shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-blue-500" />
                รายละเอียดสินเชื่อ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    จำนวนเงินกู้
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">฿</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      id="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      step="1000"
                      min="1000"
                      max="1000000"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">THB</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="term" className="block text-sm font-medium text-gray-700">
                    ระยะเวลาการกู้ (เดือน)
                  </label>
                  <select
                    id="term"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">เลือกระยะเวลา</option>
                    {availableTerms.length > 0 ? (
                      availableTerms.map((rate) => (
                        <option key={rate._id} value={rate.term.toString()}>
                          {rate.term} เดือน{rate.isActive ? '' : ' (ไม่ใช้งาน)'} - {(rate.rate * 100).toFixed(2)}%
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="6">6 เดือน</option>
                        <option value="12">12 เดือน</option>
                        <option value="24">24 เดือน</option>
                        <option value="36">36 เดือน</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    สถานะสินเชื่อ
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">เลือกสถานะ</option>
                    <option value="รอการอนุมัติ">รอดำเนินการ</option>
                    <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                    <option value="ปฏิเสธ">ปฏิเสธ</option>
                    <option value="จ่ายเงินแล้ว">จ่ายเงินแล้ว</option>
                    <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                    <option value="ผิดนัด">ผิดนัด</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ยอดชำระรายเดือน (คำนวณแล้ว)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">฿</span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={monthlyPayment.toFixed(2)}
                      className="bg-gray-50 focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">THB</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ยอดชำระทั้งหมด (คำนวณแล้ว)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">฿</span>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={totalPayment.toFixed(2)}
                      className="bg-gray-50 focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">THB</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => navigate('/users')}
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
                    บันทึกการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanEditPage;
