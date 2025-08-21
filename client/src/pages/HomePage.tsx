import React from 'react';
import Hero from '../components/Home/Hero';
import FeatureSection from '../components/Home/FeatureSection';
import LoanCalculator from '../components/Calculator/LoanCalculator';

const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <div id="loan-calculator" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800">คำนวณสินเชื่อของคุณ</h2>
          <p className="mt-2 text-lg text-gray-600">ใช้เครื่องคำนวณแบบโต้ตอบของเราเพื่อหาสินเชื่อที่เหมาะกับงบประมาณของคุณ</p>
        </div>
        <LoanCalculator />
      </div>
      <FeatureSection />
    </div>
  );
};

export default HomePage;