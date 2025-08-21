import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoanApplicationForm from '../components/Application/LoanApplicationForm';

const ApplicationPage: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Check if there are any query parameters or state to pre-fill the form
  }, [location]);

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">สมัครสินเชื่อ</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          กรอกแบบฟอร์มใบสมัครด้านล่างเพื่อสมัครสินเชื่อ กระบวนการใช้เวลาเพียงไม่กี่นาทีและคุณจะได้รับการตัดสินใจอย่างรวดเร็ว
        </p>
      </div>
      <LoanApplicationForm />
    </div>
  );
};

export default ApplicationPage;
