import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon, Home, CreditCard, Users, DollarSign } from 'lucide-react';
import ThaiAddressForm from '../components/Application/ThaiAddressForm';
import { User, UserStatus } from '../types/User';

const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employmentStatuses, setEmploymentStatuses] = useState<string[]>([]);
  // Store the user data but we don't need to use it directly as we extract values to formData
  const [, setUser] = useState<User | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    status: UserStatus;
    // Address
    homeNumber: string;
    subdistrict: string;
    district: string;
    province: string;
    zipCode: string;
    // Bank account
    bankName: string;
    accountNumber: string;
    accountName: string;
    // Financial information
    incomeMonthly: string;
    employmentStatus: string;
    loanPurpose: string;
    // Family contact
    familyName: string;
    familyPhone: string;
    relationship: string;
    familyHomeNumber: string;
    familySubdistrict: string;
    familyDistrict: string;
    familyProvince: string;
    familyZipCode: string;
  }>({
    firstName: '',
    lastName: '',
    phone: '',
    status: '' as UserStatus,
    // Address
    homeNumber: '',
    subdistrict: '',
    district: '',
    province: '',
    zipCode: '',
    // Bank account
    bankName: '',
    accountNumber: '',
    accountName: '',
    // Financial information
    incomeMonthly: '',
    employmentStatus: '',
    loanPurpose: '',
    // Family contact
    familyName: '',
    familyPhone: '',
    relationship: '',
    familyHomeNumber: '',
    familySubdistrict: '',
    familyDistrict: '',
    familyProvince: '',
    familyZipCode: ''
  });

  // Fetch employment statuses
  useEffect(() => {
    const fetchEmploymentStatuses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch('/api/admin/employment-statuses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch employment statuses');
        }

        const data = await response.json();
        if (data.status === 'success') {
          setEmploymentStatuses(data.data);
        }
      } catch (error) {
        console.error('Error fetching employment statuses:', error);
        setError('Failed to fetch employment statuses');
      }
    };

    fetchEmploymentStatuses();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user details');
        }

        const data = await response.json();
        
        if (data.status === 'success') {
          setUser(data.data);
          // Initialize form data from user data - we get user object directly
          const userData = data.data;
          setFormData({
            firstName: userData.personalInformation?.firstName || '',
            lastName: userData.personalInformation?.lastName || '',
            phone: userData.phone || '',
            status: userData.status || 'active',
            // Address
            homeNumber: userData.address?.homeNumber || '',
            subdistrict: userData.address?.subdistrict || '',
            district: userData.address?.district || '',
            province: userData.address?.province || '',
            zipCode: userData.address?.zipCode || '',
            // Bank account
            bankName: userData.bankAccount?.bankName || '',
            accountNumber: userData.bankAccount?.accountNumber || '',
            accountName: userData.bankAccount?.accountName || '',
            // Financial information
            incomeMonthly: userData.financialInformation?.incomeMonthly?.toString() || '',
            employmentStatus: userData.financialInformation?.employmentStatus || '',
            loanPurpose: userData.financialInformation?.loanPurpose || '',
            // Family contact
            familyName: userData.familyContact?.familyName || '',
            familyPhone: userData.familyContact?.familyPhone || '',
            relationship: userData.familyContact?.relationship || '',
            familyHomeNumber: userData.familyContact?.address?.homeNumber || '',
            familySubdistrict: userData.familyContact?.address?.subdistrict || '',
            familyDistrict: userData.familyContact?.address?.district || '',
            familyProvince: userData.familyContact?.address?.province || '',
            familyZipCode: userData.familyContact?.address?.zipCode || ''
          });
        } else {
          throw new Error(data.message || 'Failed to fetch user details');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare data for API
      const updateData = {
        // Personal info as root level fields for API compatibility
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        status: formData.status,
        // Address structured as needed by the backend
        address: {
          homeNumber: formData.homeNumber,
          subdistrict: formData.subdistrict,
          district: formData.district,
          province: formData.province,
          zipCode: formData.zipCode
        },
        // Bank account structured as needed by the backend
        bankAccount: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountName: formData.accountName
        },
        // Financial information
        financialInformation: {
          incomeMonthly: formData.incomeMonthly,
          employmentStatus: formData.employmentStatus,
          loanPurpose: formData.loanPurpose
        },
        // Family contact structured as needed by the backend
        familyContact: {
          familyName: formData.familyName,
          familyPhone: formData.familyPhone,
          relationship: formData.relationship,
          address: {
            houseNumber: formData.familyHomeNumber,
            subdistrict: formData.familySubdistrict,
            district: formData.familyDistrict,
            province: formData.familyProvince,
            zipCode: formData.familyZipCode
          }
        }
      };

      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update user');
      }

      // Navigate back to users list after successful save
      navigate('/users');
      // Show success message
      alert('User updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">
        <p>{error}</p>
        <button onClick={() => navigate('/users')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md">
          กลับไปหน้าผู้ใช้
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/users')} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">แก้ไขผู้ใช้</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <UserIcon className="mr-2 h-5 w-5" /> ข้อมูลส่วนบุคคล
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  ชื่อ
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  นามสกุล
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  หมายเลขโทรศัพท์
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  title="Phone number must be 10 digits"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  สถานะ
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="active">ใช้งานอยู่</option>
                  <option value="inactive">ไม่ใช้งาน</option>
                  <option value="suspended">ระงับการใช้งาน</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Home className="mr-2 h-5 w-5" /> ที่อยู่
            </h2>
            
            {/* Thai Address Form with Auto-fill */}
            <ThaiAddressForm
              onAddressChange={(address) => {
                setFormData(prev => ({
                  ...prev,
                  homeNumber: address.homeNumber,
                  subdistrict: address.subdistrict,
                  district: address.district,
                  province: address.province,
                  zipCode: address.zipCode
                }));
              }}
              homeNumber={formData.homeNumber}
              subdistrict={formData.subdistrict}
              district={formData.district}
              province={formData.province}
              zipCode={formData.zipCode}
            />
          </div>

          {/* Bank Account Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CreditCard className="mr-2 h-5 w-5" /> บัญชีธนาคาร
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                  ชื่อธนาคาร
                </label>
                <input
                  type="text"
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                  หมายเลขบัญชี
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10,15}"
                  title="หมายเลขบัญชีต้องมี 10-15 หลัก"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                  ชื่อบัญชี
                </label>
                <input
                  type="text"
                  id="accountName"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Family Contact Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5" /> ผู้ติดต่อในครอบครัว
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                  ชื่อ
                </label>
                <input
                  type="text"
                  id="familyName"
                  name="familyName"
                  value={formData.familyName}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="familyPhone" className="block text-sm font-medium text-gray-700">
                  หมายเลขโทรศัพท์
                </label>
                <input
                  type="text"
                  id="familyPhone"
                  name="familyPhone"
                  value={formData.familyPhone}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}"
                  title="Phone number must be 10 digits"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700">
                  ความสัมพันธ์
                </label>
                <input
                  type="text"
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">ที่อยู่ครอบครัว</h3>
              <ThaiAddressForm
                onAddressChange={(address) => {
                  setFormData(prev => ({
                    ...prev,
                    familyHomeNumber: address.homeNumber,
                    familySubdistrict: address.subdistrict,
                    familyDistrict: address.district,
                    familyProvince: address.province,
                    familyZipCode: address.zipCode
                  }));
                }}
                homeNumber={formData.familyHomeNumber}
                subdistrict={formData.familySubdistrict}
                district={formData.familyDistrict}
                province={formData.familyProvince}
                zipCode={formData.familyZipCode}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <DollarSign className="w-5 h-5 mr-2" />
                ข้อมูลทางการเงิน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="incomeMonthly" className="block text-sm font-medium text-gray-700">
                    รายได้ต่อเดือน
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">฿</span>
                    </div>
                    <input
                      type="number"
                      name="incomeMonthly"
                      id="incomeMonthly"
                      value={formData.incomeMonthly}
                      onChange={handleChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                      step="1000"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">THB</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="employmentStatus" className="block text-sm font-medium text-gray-700">
                    สถานะการทำงาน
                  </label>
                  <select
                    id="employmentStatus"
                    name="employmentStatus"
                    value={formData.employmentStatus}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="">เลือกสถานะ</option>
                    {employmentStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="loanPurpose" className="block text-sm font-medium text-gray-700">
                    วัตถุประสงค์การกู้
                  </label>
                  <textarea
                    id="loanPurpose"
                    name="loanPurpose"
                    value={formData.loanPurpose}
                    onChange={handleChange}
                    rows={3}
                    className="mt-1 block w-full shadow-sm sm:text-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md"
                    placeholder="โปรดอธิบายวัตถุประสงค์ของการกู้..."
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button 
              type="button" 
              onClick={() => navigate('/users')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              ยกเลิก
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกการเปลี่ยนแปลง
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditPage;
