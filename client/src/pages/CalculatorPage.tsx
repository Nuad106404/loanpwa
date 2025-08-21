import React from 'react';
import LoanCalculator from '../components/Calculator/LoanCalculator';

const CalculatorPage: React.FC = () => {
  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">เครื่องคำนวณเงินกู้</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          ใช้เครื่องคำนวณแบบโต้ตอบของเราเพื่อประเมินการชำระเงินรายเดือน ต้นทุนดอกเบิ้ยทั้งหมด และอื่นๆ ปรับจำนวนเงินกู้ ระยะเวลา และอัตราดอกเบิ้ยเพื่อดูว่าส่งผลต่อการชำระเงินของคุณอย่างไร
        </p>
      </div>
      <LoanCalculator />
    </div>
  );
};

export default CalculatorPage;