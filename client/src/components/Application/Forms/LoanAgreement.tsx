import React from 'react';
import { companyInfo } from '../../../utils/companyInfo';
import { API_URL } from '../../../utils/config';
import { useNavigate } from 'react-router-dom';

interface LoanAgreementProps {
  contractNumber?: string;
  contractDate?: string;
  borrowerName?: string;
  loanAmount?: number;
  interestRate?: number;
  term?: number;
  startDate?: string;
  endDate?: string;
  signature?: string;
  onClose?: () => void;
}

/**
 * LoanAgreement component displays a formal loan contract in Thai language with terms and conditions.
 * Used for final loan review and signing.
 */
const LoanAgreement: React.FC<LoanAgreementProps> = ({
  contractNumber = '2272',
  contractDate = new Date().toISOString().split('T')[0],
  borrowerName = 'NU AD',
  loanAmount = 10000,
  interestRate = 3,
  term = 6,
  // startDate is used in the component body
  endDate = new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
  signature,
  onClose
}) => {
  // Use navigate for routing
  const navigate = useNavigate();
  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', { 
      style: 'currency', 
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(amount);
  };
  
  // Format image URL function with enhanced debugging and format handling
  const formatImageUrl = (url: string | null): string | undefined => {
    if (!url) {
      return undefined;
    }
    
    // If the URL is a data URL (signature from canvas), return it as is
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // If the URL is already absolute (starts with http:// or https://), return it as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Clean the URL path to ensure no double slashes or incorrect formatting
    let cleanUrl = url.replace(/^\/+/, '').replace(/\/+/g, '/');
    
    // Fix duplicate signature path issue
    cleanUrl = cleanUrl.replace(/signature\/signature\//g, 'signature/');
    cleanUrl = cleanUrl.replace(/signature\/_signature\//g, '_signature/');
    
    // If the path contains 'uploads', ensure it's properly formatted
    if (cleanUrl.includes('uploads')) {
      // Extract the part after 'uploads/'
      const parts = cleanUrl.split('uploads/');
      if (parts.length > 1) {
        const result = `${API_URL}/uploads/${parts[1]}`;
        return result;
      }
    }
    
    // Otherwise, assume it's a relative path and prepend the uploads directory
    const result = `${API_URL}/uploads/${cleanUrl}`;
    return result;
  };

  return (
    <div className="government-document p-6 md:p-8 rounded max-w-4xl mx-auto print:p-0 print:max-w-none" style={{ fontFamily: '"Times New Roman", Georgia, serif, "Noto Sans Thai", "Sarabun", sans-serif' }}>
      {/* Header with Logo and Contract Title - Government Style */}
      <div className="government-header flex justify-between items-center mb-8 pb-6 mobile-stack">
        <div className="flex items-center mobile-full-width">
          {/* Official company logo with stamp */}
          <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 mr-3 md:mr-4 relative government-emblem">
            <img 
              src={companyInfo.logoUrl} 
              alt="Official Stamp" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="mobile-text-center">
            <h1 className="text-xl font-bold text-gray-800">บริษัท {companyInfo.nameThai} จำกัด</h1>
            <p className="text-sm text-gray-500 english-text">{companyInfo.nameEnglish} Company Limited</p>
          </div>
        </div>
        <div className="text-right mobile-full-width mobile-text-center">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-800 font-medium text-sm">เลขที่สัญญา: <span className="formal-numbers">{contractNumber}</span></span>
          </div>
          <p className="text-xs text-gray-500 mt-1">เอกสารทางกฎหมาย</p>
        </div>
      </div>
      
      <h1 className="text-center text-2xl font-bold text-gray-800 relative document-title">
        <span className="bg-blue-50 px-4 py-1 rounded">สัญญากู้ยืมเงิน</span>
        <div className="absolute left-0 right-0 h-px bg-gray-200 top-1/2 -z-10"></div>
      </h1>

      {/* Document Date and Reference */}
      <div className="flex justify-between items-center mt-8 mb-10">
        <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-200">
          <p className="text-sm text-gray-500">วันที่ทำสัญญา</p>
          <p className="text-md font-medium formal-numbers">{contractDate}</p>
        </div>
        <div className="bg-gray-50 px-4 py-3 rounded-md border border-gray-200">
          <p className="text-sm text-gray-500">เลขที่อ้างอิง</p>
          <p className="text-md font-medium formal-numbers">TL-{contractNumber}</p>
        </div>
      </div>

      {/* Introduction */}
      <div className="mb-10 p-6 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start mb-4">
          <div className="w-10 h-10 flex-shrink-0 mr-3 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-1 section-heading">ข้อตกลงเบื้องต้น</h3>
            <p className="text-blue-700">
              สัญญาเงินกู้ฉบับนี้ทำขึ้นระหว่าง <strong>บริษัท {companyInfo.nameThai} จำกัด</strong> ("ผู้ให้กู้") กับ <strong>{borrowerName}</strong> ("ผู้กู้") เพื่อกำหนดข้อตกลงและเงื่อนไขในการกู้ยืมเงิน
            </p>
          </div>
        </div>
      </div>

      {/* Loan Details */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-6 text-gray-800 pb-2 border-b section-heading">รายละเอียดสัญญาเงินกู้</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-3">รายละเอียดผู้กู้</h3>
            <div className="space-y-2">
              <p className="text-gray-600"><span className="inline-block w-28 text-gray-500">ชื่อ-นามสกุล</span> {borrowerName}</p>
              <p className="text-gray-600"><span className="inline-block w-28 text-gray-500">สัญชาติ</span> ไทย</p>
              <p className="text-gray-600"><span className="inline-block w-28 text-gray-500">ที่อยู่</span> ประเทศไทย</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-3">รายละเอียดผู้ให้กู้</h3>
            <div className="space-y-2">
              <p className="text-gray-600"><span className="inline-block w-28 text-gray-500">ชื่อบริษัท</span> บริษัท {companyInfo.nameThai} จำกัด</p>
              <p className="text-gray-600"><span className="inline-block w-28 text-gray-500">ทะเบียนเลขที่</span> <span className="formal-numbers">0123456789012</span></p>
              <p className="text-gray-600"><span className="inline-block w-28 text-gray-500">ที่อยู่</span> {companyInfo.addressThai} ประเทศไทย</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-5 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-3">รายละเอียดเงินกู้</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600 mb-2"><span className="font-medium text-blue-700">จำนวนเงินกู้:</span></p>
              <p className="text-2xl font-bold text-blue-800 formal-numbers">{formatCurrency(loanAmount)}</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2"><span className="font-medium text-blue-700">อัตราดอกเบี้ย:</span></p>
              <p className="text-2xl font-bold text-blue-800"><span className="formal-numbers">{interestRate}%</span> ต่อปี</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2"><span className="font-medium text-blue-700">ระยะเวลาการกู้:</span></p>
              <p className="text-lg font-bold text-blue-800"><span className="formal-numbers">{term}</span> เดือน</p>
            </div>
            <div>
              <p className="text-gray-600 mb-2"><span className="font-medium text-blue-700">วันที่สิ้นสุดสัญญา:</span></p>
              <p className="text-lg font-bold text-blue-800 formal-numbers">{endDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4 text-blue-700 section-heading">ข้อตกลงสัญญา</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            <span className="font-semibold">1.</span> ซึ่งต่อไปในสัญญานี้จะเรียกว่า "ลูกค้า" หรือ "ผู้ให้ยืม - ผู้ยืม กับ {companyInfo.nameThai} จำกัด | {companyInfo.nameEnglish} Co., Ltd โดยบริษัทซึ่งเป็นผู้ที่ได้รับอนุมัติจากรัฐมนตรีว่าการกระทรวงการคลังให้ประกอบธุรกิจหลักทรัพย์ประเภท กิจการการยืมและให้ยืมหลักทรัพย์ มีความประสงค์ที่จะเข้าทำธุรกรรมการให้ยืมหลักทรัพย์ คู่สัญญาแต่ละฝ่ายอาจกระทำการในฐานะผู้ให้ยืมหรือผู้ยืม เพื่อวัตถุประสงค์ ดังต่อไปนี้
          </p>

          <p className="pl-4">
            <span className="font-semibold">1.1</span> ผลบังคับใช้สัญญา หากข้อกำหนดหรือเงื่อนไขในสัญญาได้รับการอนุมัติสินเชื่อแล้ว สัญญามีผลบังคับใช้ทันที ซึ่งทางบริษัทดำเนินการอยู่ภายใต้การดูแลควบคุมโดยกระทรวงการคลังจึงจำเป็นต้องทำตามนโยบายอย่างเคร่งครัดตามทุกขั้นตอน ลูกค้าจะต้องชำระเงินต้น ดอกเบี้ย ค่าธรรมเนียมในการใช้วงเงินและค่าใช้จ่ายต่างๆ ที่จำเป็นต้องจ่ายให้แก่บริษัทตามข้อกำหนดนี้ ตามกำหนดวันชำระรายเดือนที่บริษัทและลูกค้าตกลงร่วมกัน กรณีที่เงินได้รับการอนุมัติแล้ว ลูกค้าไม่ดำเนินการถอนออกหรือไม่ทำการยกเลิกอย่างถูกต้อง จะมีผลเสียตามมา คือ ดอกเบี้ยยังเกิดขึ้นการผ่อนชำระยังดำเนินการต่อไปถึงแม้ไม่ได้ถอนและตัวลูกค้าจะติดแบล็คลิสสินเชื่อ การเรียกร้องให้ชำระหนี้ตลอดจนค่าธรรมเนียม ค่าใช้จ่ายในการดำเนินคดี และ ค่าทนายความในการดำเนินคดีบังคับให้ชำระหนี้คืนให้แก่ผู้ให้กู้ยืม เพื่อเป็นหลักฐานคู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญา จึงได้ลงลายมือชื่อและประทับตราบริษัท (ถ้ามี) ไว้ต่อหน้าพยานเป็นสำคัญ (ผู้กู้ยินยอมรับเงื่อนไขของบริษัท)
          </p>

          <p className="pl-4">
            <span className="font-semibold">1.2</span> กรณีวงเงินได้รับการอนุมัติแล้ว แต่ต้องการจะยกเลิกสัญญาส่วนนี้สามารถทำได้ การยกเลิกมี 2 วิธี ดังนี้
          </p>

          <ol className="list-decimal pl-8">
            <li className="mb-2">การยกเลิกโดยฉับพลัน โดยไม่เคยมีประวัติการผ่อนชำระกับทางบริษัทเกิน 3 งวดขึ้นไป หรือ ยกเลิกผ่านทางออนไลน์ ต้องชำระ 15% ของวงเงินกู้ที่ได้รับการอนุมัติ ส่วนนี้บริษัทสามารถบังคับเรียกตร้องให้ชำระได้ตามสัญญา</li>
            <li>ยกเลิกที่สำนักงาน การยกเลิกที่สำนักงานไม่เสียค่าใช้จ่ายใดๆ สิ่งที่ต้องเตรียมมาคือ สมุดบัญชีที่ลงทะเบียน บัตรประชาชนตัวจริง และตัวผู้กู้ต้องเข้ามาด้วยตนเอง การยกเลิกที่สำนักงาน หลังจากมาทำเอกสาร สามารถยกเลิกพันธะได้ที่สำนักงานภายในระยะเวลาที่กำหนด</li>
          </ol>
        </div>
      </div>

      {/* Signature Section - Government Style */}
      <div className="government-section mb-8 pt-6 signature-block">
        <h3 className="government-section-title text-center mb-6">การลงนามและการยอมรับเงื่อนไข</h3>
        
        <p className="text-center font-semibold mb-6 text-gray-700">ฉันยอมรับข้อกำหนดและเงื่อนไขของสัญญาเงินกู้นี้ทุกประการ</p>
        
        <div className="flex flex-col items-center space-y-6">
          <div className="flex items-center justify-around w-full mobile-stack-signatures">
            <div>
              <p className="font-semibold mb-2">ลายเซ็นผู้กู้:</p>
              {signature ? (
                <div>
                  <img 
                    src={formatImageUrl(signature)} 
                    alt="Digital Signature" 
                    className="mt-2 max-h-24 mx-auto" 
                  />
                </div>
              ) : (
                <div className="text-gray-400 italic text-center">
                  ยังไม่ได้ลงนาม (Not signed)
                </div>
              )}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-2">วันที่ลงนาม:</p>
            <p className="text-lg font-medium formal-numbers">{contractDate}</p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center space-x-4 mt-8">
        <button 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center"
          onClick={() => {
            // First call the onClose function if provided (for any cleanup)
            if (onClose) {
              onClose();
            }
            // Then navigate to the wallet page
            navigate('/wallet');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"></path>
          </svg>
          เป๋าตัง
        </button>
      </div>
    </div>
  );
};

export default LoanAgreement;
