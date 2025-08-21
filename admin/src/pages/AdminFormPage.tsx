import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Phone, 
  Mail, 
  User, 
  Shield,
  AlertCircle
} from 'lucide-react';
import { 
  createAdmin, 
  updateAdmin, 
  getAdminById, 
  CreateAdminData, 
  UpdateAdminData
} from '../services/superAdminService';
import toast from 'react-hot-toast';

const AdminFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminId } = useParams();
  const isEditing = Boolean(adminId);

  const [loading, setLoading] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(isEditing);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'admin' as 'admin' | 'superadmin',
    permissions: {
      manageUsers: true,
      manageLoans: true
    }
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditing && adminId) {
      fetchAdmin();
    }
  }, [isEditing, adminId]);

  const fetchAdmin = async () => {
    try {
      setLoadingAdmin(true);
      const admin = await getAdminById(adminId!);
      
      if (!admin) {
        console.error('Admin not found');
        toast.error('ไม่พบผู้ดูแลระบบ');
        navigate('/super-admin/admins');
        return;
      }
      
      setFormData({
        firstName: admin.firstName || '',
        lastName: admin.lastName || '',
        phone: admin.phone || '',
        email: admin.email || '',
        password: '',
        confirmPassword: '',
        role: admin.role || 'admin',
        permissions: admin.permissions || { manageUsers: true, manageLoans: true }
      });
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดผู้ดูแลระบบได้');
      navigate('/super-admin/admins');
    } finally {
      setLoadingAdmin(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX for Thai phones
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phone: formattedPhone }));
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'กรุณากรอกชื่อ';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'กรุณากรอกนามสกุล';
    }

    // Phone validation
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phone = 'กรุณากรอกหมายเลขโทรศัพท์';
    } else if (phoneDigits.length !== 10) {
      newErrors.phone = 'หมายเลขโทรศัพท์ต้องเป็น 10 หลัก';
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'กรุณากรอกอีเมลที่ถูกต้อง';
    }

    // Password validation
    if (!isEditing || formData.password) {
      if (!formData.password) {
        newErrors.password = 'กรุณากรอกรหัสผ่าน';
      } else if (formData.password.length < 6) {
        newErrors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'รหัสผ่านไม่ตรงกัน';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      
      if (isEditing && adminId) {
        // Update admin
        const updateData: UpdateAdminData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: phoneDigits,
          email: formData.email.trim() || undefined,
          role: formData.role,
          permissions: formData.permissions
        };

        // Only include password if it's provided
        if (formData.password) {
          updateData.password = formData.password;
        }

        await updateAdmin(adminId, updateData);
        toast.success('อัปเดตผู้ดูแลระบบเรียบร้อยแล้ว');
      } else {
        // Create admin
        const createData: CreateAdminData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: phoneDigits,
          email: formData.email.trim() || undefined,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions
        };

        await createAdmin(createData);
        toast.success(isEditing ? 'อัปเดตผู้ดูแลระบบเรียบร้อยแล้ว' : 'สร้างผู้ดูแลระบบเรียบร้อยแล้ว');
      }

      navigate('/super-admin/admins');
    } catch (error: any) {
      console.error('Error saving admin:', error);
      toast.error(isEditing ? 'ไม่สามารถอัปเดตผู้ดูแลระบบได้' : 'ไม่สามารถสร้างผู้ดูแลระบบได้');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  if (loadingAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/super-admin/admins')}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{isEditing ? 'แก้ไขผู้ดูแลระบบ' : 'สร้างผู้ดูแลระบบ'}</h1>
          <p className="text-gray-600">กรอกข้อมูลด้านล่างเพื่อ{isEditing ? 'อัปเดต' : 'สร้าง'}บัญชีผู้ดูแลระบบ</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">ข้อมูลพื้นฐาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อ *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกชื่อ"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  นามสกุล *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกนามสกุล"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">ข้อมูลติดต่อ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  หมายเลขโทรศัพท์ *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="080-123-4567"
                    maxLength={12}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  ที่อยู่อีเมล
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="example@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{isEditing ? 'เปลี่ยนรหัสผ่าน (ไม่บังคับ)' : 'รหัสผ่าน (บังคับ)'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditing ? 'รหัสผ่านใหม่' : 'รหัสผ่าน'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pr-10 pl-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="กรอกรหัสผ่าน"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditing ? 'ยืนยันรหัสผ่านใหม่' : 'ยืนยันรหัสผ่าน'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ยืนยันรหัสผ่าน"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Role and Permissions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">บทบาทและสิทธิ์</h3>
            
            {/* Role Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="role-admin"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="role-admin" className="ml-3 flex items-center">
                    <User className="h-4 w-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">ผู้ดูแลระบบ</span>
                    <span className="ml-2 text-xs text-gray-500">สิทธิ์ผู้ดูแลระบบทั่วไป</span>
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="role-superadmin"
                    name="role"
                    value="superadmin"
                    checked={formData.role === 'superadmin'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                  />
                  <label htmlFor="role-superadmin" className="ml-3 flex items-center">
                    <Shield className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">ผู้ดูแลระบบสูงสุด</span>
                    <span className="ml-2 text-xs text-gray-500">สิทธิ์เต็มรูปแบบรวมถึงการจัดการผู้ดูแลระบบ</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">สิทธิ์การเข้าถึง</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="perm-users"
                    checked={formData.permissions.manageUsers}
                    onChange={(e) => handlePermissionChange('manageUsers', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="perm-users" className="ml-3 text-sm text-gray-700">
                    จัดการผู้ใช้
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="perm-loans"
                    checked={formData.permissions.manageLoans}
                    onChange={(e) => handlePermissionChange('manageLoans', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="perm-loans" className="ml-3 text-sm text-gray-700">
                    จัดการสินเชื่อ
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/super-admin/admins')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'กำลังอัปเดต...' : 'กำลังสร้าง...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'อัปเดตผู้ดูแลระบบ' : 'สร้างผู้ดูแลระบบ'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminFormPage;
