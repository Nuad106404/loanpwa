import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

import { getUserLoanDetails } from '../../../services/loanService';

interface SuccessMessageProps {
  applicationId: string;
  onGoToWallet: () => void;
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({ applicationId, onGoToWallet }) => {
  const [mongoDbId, setMongoDbId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch the MongoDB ID directly from the database when the component loads
  useEffect(() => {
    const fetchMongoDbId = async () => {
      try {
        setIsLoading(true);
        // Directly fetch the loan details from MongoDB
        const response = await getUserLoanDetails();
        
        if (response.status === 'success' && response.data && response.data.loan && response.data.loan._id) {
          const dbId = response.data.loan._id;
          setMongoDbId(dbId);
          // Also store it in localStorage for redundancy
          localStorage.setItem('mongoDbLoanId', dbId);
        } else {
          console.error('Failed to fetch MongoDB ID directly:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching MongoDB ID:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMongoDbId();
  }, []);
  
  // Determine the ID to display, prioritizing the directly fetched MongoDB ID
  const fullId = mongoDbId || applicationId || localStorage.getItem('mongoDbLoanId') || localStorage.getItem('currentApplicationId') || '';
  
  // Format to show only the last 5 digits
  const formatReferenceNumber = (id: string) => {
    if (!id) return '';
    // If the ID is at least 5 characters long, return the last 5 digits
    if (id.length >= 10) {
      return id.slice(-10);
    }
    // Otherwise return the full ID
    return id;
  };
  
  const effectiveId = formatReferenceNumber(fullId);
  
  // Log all possible sources for debugging
  // Clear localStorage related to loan application only when navigating away
  const handleGoToWallet = () => {
    // Now it's safe to clear the application step
    localStorage.removeItem('loanApplicationStep');
    onGoToWallet();
  };
  return (
    <div className="text-center py-8">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-500" />
      </div>
      <h2 className="mt-6 text-3xl font-bold text-gray-800">ส่งใบสมัครเรียบร้อยแล้ว!</h2>
      
      <div className="mt-4 max-w-xl mx-auto">
        <p className="text-lg text-gray-600 mb-6">
          ขอบคุณที่ส่งใบสมัครสินเชื่อ ใบสมัครของคุณกำลังได้รับการพิจารณา
          จากทีมงานของเรา คุณจะได้รับการแจ้งเตือนเมื่อมีการตัดสินใจ
        </p>
        
        <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-500 mb-2">หมายเลขอ้างอิงใบสมัครของคุณ:</p>
          {isLoading ? (
            <div className="flex items-center space-x-2 p-3">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">กำลังดึงหมายเลขใบสมัครของคุณ...</span>
            </div>
          ) : effectiveId ? (
            <p className="text-xl font-mono font-semibold text-blue-700 border-2 border-blue-100 bg-blue-50 p-3 rounded-md">
              {effectiveId}
            </p>
          ) : (
            <p className="text-xl font-semibold text-red-600">
              ข้อผิดพลาด: ไม่พบหมายเลขใบสมัคร กรุณาติดต่อฝ่ายสนับสนุน
            </p>
          )}
          <p className="mt-4 text-sm text-gray-500">
            กรุณาบันทึกหมายเลขนี้ไว้เป็นหลักฐาน คุณสามารถใช้ตรวจสอบสถานะใบสมัครได้
          </p>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">ขั้นตอนต่อไป?</h3>
          <ol className="text-left space-y-3 text-gray-600 list-decimal list-inside">
            <li>ทีมงานจะพิจารณาใบสมัครของคุณภายใน 1-2 วันทำการ</li>
            <li>คุณอาจได้รับโทรศัพท์หรืออีเมลเพื่อยืนยันข้อมูล</li>
            <li>เมื่อได้รับอนุมัติ จำนวนเงินกู้จะถูกโอนเข้ากระเป๋าเงินของคุณ</li>
            <li>คุณสามารถถอนเงินจากกระเป๋าเงินไปยังบัญชีธนาคารได้</li>
          </ol>
        </div>
        
        <button
          onClick={handleGoToWallet}
          className="mt-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300"
        >
          ไปยังกระเป๋าเงิน
        </button>
      </div>
    </div>
  );
};

export default SuccessMessage;
