import React from 'react';
import { Shield, Clock, Award, DollarSign } from 'lucide-react';

const features = [
  {
    icon: <Shield className="h-8 w-8 text-blue-800" />,
    title: 'กระบวนการปลอดภัย',
    description: 'โปรโตคอลความปลอดภัยระดับธนาคารปกป้องข้อมูลส่วนบุคคลและการเงินของคุณตลอดกระบวนการสมัคร'
  },
  {
    icon: <Clock className="h-8 w-8 text-blue-800" />,
    title: 'ตัดสินใจเร็ว',
    description: 'รับการอนุมัติเบื้องต้นภายในไม่กี่นาทีและรับเงินในบัญชีของคุณภายใน 24-48 ชั่วโมงหลังการอนุมัติขั้นสุดท้าย'
  },
  {
    icon: <Award className="h-8 w-8 text-blue-800" />,
    title: 'อัตราแข่งขัน',
    description: 'ราคาที่โปร่งใสและอัตราดอกเบียที่แข่งขันได้ของเรารับประกันว่าคุณจะได้รับข้อเสนอที่ยุติธรรมสำหรับสินเชื่อของคุณ'
  },
  {
    icon: <DollarSign className="h-8 w-8 text-blue-800" />,
    title: 'เงื่อนไขยืดหยุ่น',
    description: 'เลือกจำนวนเงินกู้และตารางการชำระคืนที่เหมาะสมที่สุดสำหรับสถานการณ์ทางการเงินของคุณ'
  }
];

const FeatureSection: React.FC = () => {
  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">ทำไมต้องเลือก Lease It Thailand</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            เราทำให้การกู้เงินเป็นเรื่องง่าย โปร่งใส และปรับแต่งตามความต้องการของคุณ
          </p>
        </div>
        
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-6 transition-transform duration-300 hover:transform hover:scale-105"
            >
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureSection;