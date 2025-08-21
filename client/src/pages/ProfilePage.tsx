import React, { useState, useEffect } from 'react';
import { User, MapPin, Building2, Wallet, FileText, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile } from '../services/userService';
import toast from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: user?.personalInformation?.firstName || '',
      lastName: user?.personalInformation?.lastName || '',
      nationalId: user?.personalInformation?.nationalId || '',
      phone: user?.phone || '',
      dateOfBirth: user?.personalInformation?.dateOfBirth ? new Date(user.personalInformation.dateOfBirth).toISOString().split('T')[0] : ''
    },
    address: {
      houseNumber: user?.address?.homeNumber || '',
      subdistrict: user?.address?.subdistrict || '',
      district: user?.address?.district || '',
      province: user?.address?.province || '',
      zipCode: user?.address?.zipCode || ''
    },
    financialInfo: {
      income: user?.financialInformation?.incomeMonthly || '',
      employmentStatus: user?.financialInformation?.employmentStatus || '',
      loanPurpose: user?.financialInformation?.loanPurpose || '',
      bankName: user?.bankAccount?.bankName || '',
      accountNumber: user?.bankAccount?.accountNumber || '',
      accountName: user?.bankAccount?.accountName || ''
    },
    familyContact: {
      name: user?.familyContact?.familyName || '',
      relationship: user?.familyContact?.relationship || '',
      phone: user?.familyContact?.familyPhone || '',
      address: {
        homeNumber: user?.familyContact?.address?.homeNumber || '',
        subdistrict: user?.familyContact?.address?.subdistrict || '',
        district: user?.familyContact?.address?.district || '',
        province: user?.familyContact?.address?.province || '',
        zipCode: user?.familyContact?.address?.zipCode || ''
      }
    },
    identityVerification: {
      idCardFront: user?.documents?.idCardFront?.url || null,
      idCardBack: user?.documents?.idCardBack?.url || null,
      selfieWithId: user?.documents?.selfieWithId?.url || null,
      signature: user?.signatureUrl || null
    },
    loanAgreement: {
      contractNumber: "2110",
      contractDate: "2025-04-30",
      loanAmount: 10000,
      startDate: "2025-04-30",
      endDate: "2025-10-30",
      signature: user?.signatureUrl || null
    }
  });
  
  // Function to fetch profile data from MongoDB
  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserProfile();
      if (response.status === 'success' && response.data) {
        // Update profile data with MongoDB data
        setProfileData(prevData => ({
          ...prevData,
          personalInfo: {
            firstName: response.data.personalInformation?.firstName || prevData.personalInfo.firstName,
            lastName: response.data.personalInformation?.lastName || prevData.personalInfo.lastName,
            nationalId: response.data.personalInformation?.nationalId || prevData.personalInfo.nationalId,
            phone: response.data.phone || prevData.personalInfo.phone,
            dateOfBirth: response.data.personalInformation?.dateOfBirth ? 
              new Date(response.data.personalInformation.dateOfBirth).toISOString().split('T')[0] : 
              prevData.personalInfo.dateOfBirth
          },
          address: {
            houseNumber: response.data.address?.homeNumber || prevData.address.houseNumber,
            subdistrict: response.data.address?.subdistrict || prevData.address.subdistrict,
            district: response.data.address?.district || prevData.address.district,
            province: response.data.address?.province || prevData.address.province,
            zipCode: response.data.address?.zipCode || prevData.address.zipCode
          },
          financialInfo: {
            ...prevData.financialInfo,
            income: response.data.financialInformation?.incomeMonthly || prevData.financialInfo.income,
            employmentStatus: response.data.financialInformation?.employmentStatus || prevData.financialInfo.employmentStatus,
            loanPurpose: response.data.financialInformation?.loanPurpose || prevData.financialInfo.loanPurpose,
            bankName: response.data.bankAccount?.bankName || prevData.financialInfo.bankName,
            accountNumber: response.data.bankAccount?.accountNumber || prevData.financialInfo.accountNumber,
            accountName: response.data.bankAccount?.accountName || prevData.financialInfo.accountName
          },
          familyContact: {
            name: response.data.familyContact?.familyName || prevData.familyContact.name,
            relationship: response.data.familyContact?.relationship || prevData.familyContact.relationship,
            phone: response.data.familyContact?.familyPhone || prevData.familyContact.phone,
            address: {
              homeNumber: response.data.familyContact?.address?.homeNumber || prevData.familyContact.address.homeNumber,
              subdistrict: response.data.familyContact?.address?.subdistrict || prevData.familyContact.address.subdistrict,
              district: response.data.familyContact?.address?.district || prevData.familyContact.address.district,
              province: response.data.familyContact?.address?.province || prevData.familyContact.address.province,
              zipCode: response.data.familyContact?.address?.zipCode || prevData.familyContact.address.zipCode
            }
          },
          identityVerification: {
            idCardFront: response.data.documents?.idCardFront?.url || prevData.identityVerification.idCardFront,
            idCardBack: response.data.documents?.idCardBack?.url || prevData.identityVerification.idCardBack,
            selfieWithId: response.data.documents?.selfieWithId?.url || prevData.identityVerification.selfieWithId,
            signature: response.data.signatureUrl || prevData.identityVerification.signature
          }
        }));
        toast.success('โหลดข้อมูลโปรไฟล์สำเร็จ');
      } else {
        setError(response.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        toast.error(response.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch profile data when component mounts
  // Function to ensure image URLs are properly formatted
  const formatImageUrl = (url: string | null): string | undefined => {
    if (!url) return undefined;
    
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
    
    // Fix duplicate signature path issue: remove extra 'signature/' if it exists
    cleanUrl = cleanUrl.replace(/signature\/signature\//g, 'signature/');
    cleanUrl = cleanUrl.replace(/signature\/_signature\//g, '_signature/');
    
    // If the path contains 'uploads', ensure it's properly formatted
    if (cleanUrl.includes('uploads')) {
      // Extract the part after 'uploads/'
      const parts = cleanUrl.split('uploads/');
      if (parts.length > 1) {
        return `${API_URL}/uploads/${parts[1]}`;
      }
    }
    
    // Otherwise, assume it's a relative path and prepend the uploads directory
    return `${API_URL}/uploads/${cleanUrl}`;
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Overview */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-4 mb-6">
                {profileData.identityVerification.selfieWithId ? (
                          <img 
                            src={formatImageUrl(profileData.identityVerification.selfieWithId)} 
                            alt="Selfie with ID" 
                            className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-10 h-10 text-blue-600" />
                        </div>
                        )}

                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
                    </h1>
                    <p className="text-gray-600">สมาชิกตั้งแต่ มกราคม 2024</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    ข้อมูลส่วนตัว
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">เลขบัตรประชาชน</p>
                      <p className="text-gray-900">{profileData.personalInfo.nationalId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">หมายเลขโทรศัพท์</p>
                      <p className="text-gray-900">{profileData.personalInfo.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">วันเกิด</p>
                      <p className="text-gray-900">{profileData.personalInfo.dateOfBirth}</p>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                    ข้อมูลที่อยู่
                  </h2>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">บ้านเลขที่</p>
                      <p className="text-gray-900">{profileData.address.houseNumber || 'ไม่ได้ระบุ'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ตำบล</p>
                      <p className="text-gray-900">{profileData.address.subdistrict}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">อำเภอ</p>
                      <p className="text-gray-900">{profileData.address.district}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">จังหวัด</p>
                      <p className="text-gray-900">{profileData.address.province}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">รหัสไปรษณีย์</p>
                      <p className="text-gray-900">{profileData.address.zipCode}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-blue-600" />
                    ข้อมูลทางการเงิน
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">รายได้ต่อเดือน</p>
                      <p className="text-gray-900">{profileData.financialInfo.income ? `฿${profileData.financialInfo.income.toLocaleString()}` : 'ไม่ได้ระบุ'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">สถานะการจ้างงาน</p>
                      <p className="text-gray-900">{profileData.financialInfo.employmentStatus ? profileData.financialInfo.employmentStatus.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'ไม่ได้ระบุ'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">วัตถุประสงค์การกู้</p>
                      <p className="text-gray-900">{profileData.financialInfo.loanPurpose || 'ไม่ได้ระบุ'}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                    ข้อมูลธนาคาร
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">ชื่อธนาคาร</p>
                      <p className="text-gray-900">{profileData.financialInfo.bankName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">เลขที่บัญชี</p>
                      <p className="text-gray-900">{profileData.financialInfo.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ชื่อเจ้าของบัญชี</p>
                      <p className="text-gray-900">{profileData.financialInfo.accountName}</p>
                    </div>
                  </div>
                </div>

                {/* Family Contact */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    ข้อมูลผู้ติดต่อในครอบครัว
                  </h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">ชื่อ</p>
                        <p className="text-gray-900">{profileData.familyContact.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">ความสัมพันธ์</p>
                        <p className="text-gray-900">{profileData.familyContact.relationship}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">หมายเลขโทรศัพท์</p>
                        <p className="text-gray-900">{profileData.familyContact.phone}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ที่อยู่</p>
                      <p className="text-gray-900">
                        {profileData.familyContact.address.homeNumber}, {profileData.familyContact.address.subdistrict}, {profileData.familyContact.address.district}<br />
                        {profileData.familyContact.address.province} {profileData.familyContact.address.zipCode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Identity Verification */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    การยืนยันตัวตน
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">บัตรประชาชนด้านหน้า</p>
                      {profileData.identityVerification.idCardFront ? (
                        <img 
                          src={formatImageUrl(profileData.identityVerification.idCardFront)} 
                          alt="ID Card Front" 
                          className="mt-2 rounded-lg border border-gray-200"
                        />
                      ) : (
                        <p className="text-gray-400 italic">ยังไม่ได้อัปโหลด</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">บัตรประชาชนด้านหลัง</p>
                      {profileData.identityVerification.idCardBack ? (
                        <img 
                          src={formatImageUrl(profileData.identityVerification.idCardBack)} 
                          alt="ID Card Back" 
                          className="mt-2 rounded-lg border border-gray-200"
                        />
                      ) : (
                        <p className="text-gray-400 italic">ยังไม่ได้อัปโหลด</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">รูปถ่ายคู่กับบัตรประชาชน</p>
                      {profileData.identityVerification.selfieWithId ? (
                        <img 
                          src={formatImageUrl(profileData.identityVerification.selfieWithId)} 
                          alt="Selfie with ID" 
                          className="mt-2 rounded-lg border border-gray-200"
                        />
                      ) : (
                        <p className="text-gray-400 italic">ยังไม่ได้อัปโหลด</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ลายเซ็นดิจิทัล</p>
                      {profileData.identityVerification.signature ? (
                        <img 
                          src={formatImageUrl(profileData.identityVerification.signature)} 
                          alt="Digital Signature" 
                          className="mt-2 rounded-lg border border-gray-200"
                        />
                      ) : (
                        <p className="text-gray-400 italic">ยังไม่ได้อัปโหลด</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Links Section */}
              <div className="space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">ลิงก์ด่วน</h2>
                  <div className="space-y-4">
                    <button 
                      onClick={() => navigate('/wallet')}
                      className="flex items-center text-blue-600 hover:text-blue-800 py-2 w-full text-left"
                    >
                      <Wallet className="w-5 h-5 mr-3" />
                      <span>ดูกระเป๋าเงิน</span>
                    </button>
                    <button 
                      onClick={() => navigate('/agreement')}
                      className="flex items-center text-blue-600 hover:text-blue-800 py-2 w-full text-left"
                    >
                      <FileText className="w-5 h-5 mr-3" />
                      <span>สัญญาเงินกู้</span>
                    </button>
                    <button 
                      onClick={() => navigate('/wallet')}
                      className="flex items-center text-blue-600 hover:text-blue-800 py-2 w-full text-left"
                    >
                      <Calendar className="w-5 h-5 mr-3" />
                      <span>ประวัติการชำระเงิน</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
