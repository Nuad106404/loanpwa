import React, { useState, useEffect } from 'react';
import { LoanApplicationData } from '../LoanApplicationForm';
import { getUserProfile } from '../../../services/userService';
import { getUserLoanDetails } from '../../../services/loanService';
import { API_URL } from '../../../utils/config';

interface ReviewFormProps {
  data: LoanApplicationData;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  onLoanIdUpdate?: (id: string) => void;
}

interface UserDocuments {
  idCardFront: string | null;
  idCardBack: string | null;
  selfieWithId: string | null;
  signature: string | null;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ data, onSubmit, onPrev, isSubmitting, onLoanIdUpdate }) => {
  const [documents, setDocuments] = useState<UserDocuments>({
    idCardFront: null,
    idCardBack: null,
    selfieWithId: null,
    signature: null
  });
  const [loanId, setLoanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loanLoading, setLoanLoading] = useState(false);
  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format image URL
  const formatImageUrl = (url: string | null): string | undefined => {
    if (!url) return undefined;
    
    // If the URL is a data URL (signature from canvas), return it as is
    if (url.startsWith('data:image/')) {
      return url;
    }
    
    // If the URL already includes the API_URL or is an absolute URL, return it as is
    if (url.startsWith('http')) {
      return url;
    }
    
    // Remove any leading slash from the url to avoid double slashes
    let cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // Fix duplicate signature path issue: remove extra 'signature/' if it exists
    cleanUrl = cleanUrl.replace(/signature\/signature\//g, 'signature/');
    cleanUrl = cleanUrl.replace(/signature\/_signature\//g, '_signature/');
    
    // Combine the API_URL with the cleaned URL path
    return `${API_URL}/uploads/${cleanUrl}`; 
  };
  
  // Extract the correct path from an absolute file path
  const extractRelativePath = (absolutePath: string | null): string | null => {
    if (!absolutePath) return null;
    
    // Check if this is an absolute file path that needs correction
    if (absolutePath.includes('/uploads/_signature/')) {
      // Extract just the /uploads/_signature/filename.jpg part
      const match = absolutePath.match(/(\/uploads\/_signature\/[\w.-]+)$/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return absolutePath;
  };
  
  // Fetch loan details including ObjectID from MongoDB
  const fetchLoanDetails = async () => {
    setLoanLoading(true);
    try {
      const response = await getUserLoanDetails();
      
      if (response.status === 'success' && response.data && response.data.loan) {
        
        // Extract the MongoDB ObjectID, ensuring it's a string
        const loanObjectId = response.data.loan._id || '';
        
        // Set the loan ID from MongoDB ObjectID
        setLoanId(loanObjectId);
        
        // Store the ID in localStorage as a backup
        if (loanObjectId) {
          localStorage.setItem('mongoDbLoanId', loanObjectId);
        }
        
        // Pass the MongoDB ObjectID back to the parent component if callback exists
        if (onLoanIdUpdate && loanObjectId) {
          onLoanIdUpdate(loanObjectId);
        }
      } else {
        console.error('Failed to fetch loan details:', response.message);
      }
    } catch (error) {
      console.error('Error fetching loan details:', error);
    } finally {
      setLoanLoading(false);
    }
  };
  
  // Fetch user documents from MongoDB
  const fetchUserDocuments = async () => {
    setLoading(true);
    try {
      const response = await getUserProfile();
      if (response.status === 'success' && response.data) {
        
        // Fix the signature path if it's an absolute file path
        const signaturePath = extractRelativePath(response.data.signatureUrl);
        
        // Update documents state with fetched data
        setDocuments({
          idCardFront: response.data.documents?.idCardFront?.url || null,
          idCardBack: response.data.documents?.idCardBack?.url || null,
          selfieWithId: response.data.documents?.selfieWithId?.url || null,
          signature: signaturePath
        });
      } else {
        console.error('Failed to fetch user documents:', response.message);
      }
    } catch (error) {
      console.error('Error fetching user documents:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch documents and loan details when component mounts
  useEffect(() => {
    fetchUserDocuments();
    fetchLoanDetails();
    
    // Check if there's a signature stored in localStorage from the ID verification step
    const storedSignature = localStorage.getItem('userSignature');
    if (storedSignature) {
      setDocuments(prev => ({
        ...prev,
        signature: storedSignature
      }));
    }
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">ตรวจสอบใบสมัครของคุณ</h2>
      
      {/* Application Reference Number */}
      {loanLoading ? (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="animate-pulse flex items-center">
            <div className="h-4 bg-blue-200 rounded w-64"></div>
            <div className="ml-2 h-4 bg-blue-300 rounded w-32"></div>
          </div>
        </div>
      ) : loanId ? (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-gray-700">
            <span className="font-medium">หมายเลขอ้างอิงใบสมัคร: </span>
            <span className="font-mono text-blue-700">{loanId}</span>
          </p>
        </div>
      ) : null}
      
      <p className="text-gray-600 mb-8">
        กรุณาตรวจสอบข้อมูลของคุณด้านล่างก่อนส่งใบสมัครสินเชื่อ
      </p>

      <div className="space-y-8">
        {/* Personal Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
            ข้อมูลส่วนตัว
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
              <p className="font-medium">{data.personalInfo.firstName} {data.personalInfo.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">เลขประจำตัวประชาชน</p>
              <p className="font-medium">{data.personalInfo.nationalId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">หมายเลขโทรศัพท์</p>
              <p className="font-medium">{data.personalInfo.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">วันเดือนปีเกิด</p>
              <p className="font-medium">{formatDate(data.personalInfo.dateOfBirth)}</p>
            </div>
          </div>
        </div>

        {/* ID Verification */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
            การยืนยันตัวตน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ด้านหน้าบัตรประชาชน</p>
              {loading ? (
                <div className="animate-pulse h-32 bg-gray-200 rounded-lg mt-2"></div>
              ) : documents.idCardFront ? (
                <img 
                  src={formatImageUrl(documents.idCardFront)} 
                  alt="ID Card Front" 
                  className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                />
              ) : data.idVerification.idCardFront ? (
                <img 
                  src={typeof data.idVerification.idCardFront === 'string' 
                    ? data.idVerification.idCardFront 
                    : URL.createObjectURL(data.idVerification.idCardFront)} 
                  alt="ID Card Front" 
                  className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                />
              ) : (
                <p className="text-gray-400 italic">ยังไม่ได้อัพโหลด</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">ด้านหลังบัตรประชาชน</p>
              {loading ? (
                <div className="animate-pulse h-32 bg-gray-200 rounded-lg mt-2"></div>
              ) : documents.idCardBack ? (
                <img 
                  src={formatImageUrl(documents.idCardBack)} 
                  alt="ID Card Back" 
                  className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                />
              ) : data.idVerification.idCardBack ? (
                <img 
                  src={typeof data.idVerification.idCardBack === 'string' 
                    ? data.idVerification.idCardBack 
                    : URL.createObjectURL(data.idVerification.idCardBack)} 
                  alt="ID Card Back" 
                  className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                />
              ) : (
                <p className="text-gray-400 italic">ยังไม่ได้อัพโหลด</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">ภาพถ่ายตัวเองคู่กับบัตรประชาชน</p>
              {loading ? (
                <div className="animate-pulse h-32 bg-gray-200 rounded-lg mt-2"></div>
              ) : documents.selfieWithId ? (
                <img 
                  src={formatImageUrl(documents.selfieWithId)} 
                  alt="Selfie with ID" 
                  className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                />
              ) : data.idVerification.selfieWithId ? (
                <img 
                  src={typeof data.idVerification.selfieWithId === 'string' 
                    ? data.idVerification.selfieWithId 
                    : URL.createObjectURL(data.idVerification.selfieWithId)} 
                  alt="Selfie with ID" 
                  className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                />
              ) : (
                <p className="text-gray-400 italic">ยังไม่ได้อัพโหลด</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">ลายเซ็นดิจิทัล</p>
              {loading ? (
                <div className="animate-pulse h-32 bg-gray-200 rounded-lg mt-2"></div>
              ) : (() => {
                // Check localStorage first for signature data
                const storedSignature = localStorage.getItem('userSignature');
                
                if (storedSignature) {
                  return (
                    <img 
                      src={formatImageUrl(storedSignature)} 
                      alt="Digital Signature" 
                      className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                    />
                  );
                } 
                
                if (documents.signature) {
                  return (
                    <img 
                      src={formatImageUrl(documents.signature)} 
                      alt="Digital Signature" 
                      className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                    />
                  );
                } 
                
                if (data.idVerification.signature) {
                  return (
                    <img 
                      src={formatImageUrl(data.idVerification.signature)} 
                      alt="Digital Signature" 
                      className="mt-2 rounded-lg border border-gray-200 max-h-32 object-contain"
                    />
                  );
                }
                
                return <p className="text-gray-400 italic">ไม่ได้ระบุ</p>;
              })()}

            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
            ข้อมูลที่อยู่
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <p className="font-medium">{data.address.homeNumber}</p>
            <p className="font-medium">
              {data.address.subdistrict}, {data.address.district}, {data.address.province}, {data.address.zipCode}
            </p>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
            ข้อมูลทางการเงิน
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ชื่อธนาคาร</p>
              <p className="font-medium">{data.financialInfo.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">เลขที่บัญชี</p>
              <p className="font-medium">{data.financialInfo.accountNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ชื่อเจ้าของบัญชี</p>
              <p className="font-medium">{data.financialInfo.accountHolderName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
              <p className="font-medium">{formatCurrency(data.financialInfo.monthlyIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">สถานะการทำงาน</p>
              <p className="font-medium capitalize">{data.financialInfo.employmentStatus.replace('-', ' ')}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">วัตถุประสงค์การกู้</p>
              <p className="font-medium">{data.financialInfo.loanPurpose}</p>
            </div>
          </div>
        </div>

        {/* Family Contact */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
            ผู้ติดต่อในครอบครัว
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">ชื่อ</p>
              <p className="font-medium">{data.familyContact.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">หมายเลขโทรศัพท์</p>
              <p className="font-medium">{data.familyContact.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ความสัมพันธ์</p>
              <p className="font-medium">{data.familyContact.relationship}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">ที่อยู่</p>
              <p className="font-medium">
                {data.familyContact.address.homeNumber}, {data.familyContact.address.subdistrict}, {data.familyContact.address.district}, {data.familyContact.address.province}, {data.familyContact.address.zipCode}
              </p>
            </div>
          </div>
        </div>

        {/* Loan Details */}
        {data.loanDetails && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">6</span>
              รายละเอียดเงินกู้
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">จำนวนเงินกู้</p>
                <p className="font-medium">{formatCurrency(data.loanDetails.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ระยะเวลากู้</p>
                <p className="font-medium">{data.loanDetails.term} เดือน</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ยอดชำระรายเดือน</p>
                <p className="font-medium">{formatCurrency(data.loanDetails.monthlyPayment)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">อัตราดอกเบี้ย</p>
                <p className="font-medium">{(data.loanDetails.interestRate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terms and Conditions */}
      <div className="mt-8 p-6 border border-gray-200 rounded-lg">
        <div className="flex items-start mb-4">
          <input
            id="terms"
            type="checkbox"
            className="h-4 w-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            defaultChecked
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-600">
            ข้าพเจ้ายืนยันว่าข้อมูลทั้งหมดที่ให้ไว้นั้นถูกต้องและครบถ้วน ข้าพเจ้ายอมรับ{' '}
            <a href="#" className="text-blue-600 hover:underline">ข้อตกลงและเงื่อนไข</a> และ{' '}
            <a href="#" className="text-blue-600 hover:underline">นโยบายความเป็นส่วนตัว</a>.
          </label>
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          กลับ
        </button>
        <button
          type="button"
          onClick={async () => {
            // Always fetch the latest loan ID directly from MongoDB before submission
            try {
              setLoanLoading(true);
              const response = await getUserLoanDetails();
              
              if (response.status === 'success' && response.data && response.data.loan) {
                const mongoDbId = response.data.loan._id || '';
                
                if (mongoDbId) {
                  // Update local state
                  setLoanId(mongoDbId);
                  
                  // Store in localStorage for redundancy
                  localStorage.setItem('mongoDbLoanId', mongoDbId);
                  
                  // Pass to parent component
                  if (onLoanIdUpdate) {
                    onLoanIdUpdate(mongoDbId);
                  }
                }
              }
            } catch (error) {
              console.error('Error retrieving MongoDB ID before submission:', error);
            } finally {
              setLoanLoading(false);
              // Proceed with form submission regardless
              onSubmit();
            }
          }}
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังส่ง...
            </>
          ) : (
            'ส่งใบสมัคร'
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewForm;
