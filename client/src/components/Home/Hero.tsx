import React from 'react';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  const handleApplyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const loanDetailsSection = document.querySelector('#loan-calculator');
    if (loanDetailsSection) {
      loanDetailsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] md:min-h-[600px] flex items-center mt-16">
      {/* Video Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-sm z-10"></div>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
          poster="https://images.pexels.com/videos/7735495/pictures/preview-0.jpg"
        >
          <source
            src="https://videos.pexels.com/video-files/7735495/7735495-hd_1920_1080_25fps.mp4"
            type="video/mp4"
          />
        </video>
      </div>



      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-0">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-white">
            โซลูชันสินเชื่อที่เรียบง่ายและโปร่งใส
          </h1>
          <p className="text-xl mb-12 text-blue-50">
            รับเงินทุนที่คุณต้องการด้วยอัตราดอกเบียที่แข่งขันได้และเงื่อนไขการชำระคืนที่ยืดหยุ่น
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={handleApplyClick}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-full shadow-lg text-lg font-medium text-blue-900 bg-white hover:bg-blue-50 transform hover:scale-105 transition-all duration-300"
            >
              สมัครเลย
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold mb-2 text-white">อนุมัติเร็ว</div>
              <p className="text-blue-100">รับการอนุมัติภายในไม่กี่นาทีด้วยกระบวนการที่คล่องตัว</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold mb-2 text-white">เงื่อนไขยืดหยุ่น</div>
              <p className="text-blue-100">เลือกจากระยะเวลาสินเชื่อที่หลากหลายที่เหมาะกับความต้องการของคุณ</p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 transform hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold mb-2 text-white">อัตราดอกเบียต่ำ</div>
              <p className="text-blue-100">อัตราดอกเบียที่แข่งขันได้เริ่มต้นที่ 2.90% ต่อปี</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
