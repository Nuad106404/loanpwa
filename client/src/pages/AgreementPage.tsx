import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import LoanAgreement from '../components/Application/Forms/LoanAgreement';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userService';
import { getUserLoanDetails } from '../services/loanService';
import { companyInfo } from '../utils/companyInfo';

// Add formal fonts to the page
import './agreement-styles.css';

const AgreementPage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useAuth(); // Auth context still needed for protected route
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agreementData, setAgreementData] = useState({
    contractNumber: '',
    contractDate: new Date().toISOString().split('T')[0],
    borrowerName: '',
    loanAmount: 0,
    interestRate: 0.03,
    term: 6,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    signature: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user profile data
        const profileResponse = await getUserProfile();
        if (profileResponse.status !== 'success') {
          throw new Error('Failed to fetch user profile');
        }

        // Fetch loan details
        const loanResponse = await getUserLoanDetails();
        if (loanResponse.status !== 'success') {
          throw new Error('Failed to fetch loan details');
        }

        const profileData = profileResponse.data;
        const loanData = loanResponse.data?.loan;

        // Calculate end date (start date + term months)
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (loanData?.term || 6));

        // Format dates
        const formattedStartDate = startDate.toISOString().split('T')[0];
        const formattedEndDate = endDate.toISOString().split('T')[0];

        // MongoDB ID as contract number (last 5 digits)
        const contractNumber = loanData?._id ? 
          loanData._id.slice(-5) : 
          'N/A';

        setAgreementData({
          contractNumber,
          contractDate: formattedStartDate,
          borrowerName: `${profileData?.personalInformation?.firstName || ''} ${profileData?.personalInformation?.lastName || ''}`,
          loanAmount: loanData?.amount || 10000,
          interestRate: loanData?.interestRate || 0.03,
          term: loanData?.term || 6,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          signature: profileData?.signatureUrl || ''
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('ไม่สามารถโหลดข้อมูลสัญญาได้');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 py-10 agreement-page">
      <div className="container max-w-5xl mx-auto px-4 py-8 print:py-0">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        ) : (
          <div>
            <div className="p-6 md:p-10 print:p-0">
              <div className="relative">
                
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none -z-10 mobile-hidden">
                  <div className="text-9xl font-bold text-gray-400 transform rotate-45">{companyInfo.nameEnglish.toUpperCase()}</div>
                </div>
                
                <LoanAgreement
                  contractNumber={agreementData.contractNumber}
                  contractDate={agreementData.contractDate}
                  borrowerName={agreementData.borrowerName}
                  loanAmount={agreementData.loanAmount}
                  interestRate={agreementData.interestRate}
                  term={agreementData.term}
                  startDate={agreementData.startDate}
                  endDate={agreementData.endDate}
                  signature={agreementData.signature}
                  onClose={() => navigate('/profile')}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgreementPage;
