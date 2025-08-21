import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { getAdminById, deleteAdmin, AdminUser } from '../services/superAdminService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

const AdminDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { adminId } = useParams();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminId) {
      fetchAdmin();
    }
  }, [adminId]);

  const fetchAdmin = async () => {
    try {
      setLoading(true);
      const data = await getAdminById(adminId!);
      setAdmin(data);
    } catch (error) {
      console.error('Error fetching admin:', error);
      toast.error('ไม่สามารถโหลดรายละเอียดผู้ดูแลระบบได้');
      navigate('/super-admin/admins');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!admin) return;

    const result = await Swal.fire({
      title: 'ลบผู้ดูแลระบบ?',
      text: `คุณแน่ใจหรือไม่ที่จะลบ ${admin.firstName} ${admin.lastName}? การดำเนินการนี้ไม่สามารถยกเลิกได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ใช่ ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteAdmin(admin._id);
        toast.success('ลบผู้ดูแลระบบเรียบร้อยแล้ว');
        navigate('/super-admin/admins');
      } catch (error) {
        console.error('Error deleting admin:', error);
        toast.error('ไม่สามารถลบผู้ดูแลระบบได้');
      }
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบผู้ดูแลระบบ</h2>
        <p className="text-gray-600 mb-4">ไม่พบผู้ดูแลระบบที่ร้องขอ</p>
        <Link
          to="/super-admin/admins"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          กลับไปยังผู้ดูแลระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/super-admin/admins')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">รายละเอียดผู้ดูแลระบบ</h1>
            <p className="text-gray-600">ดูและจัดการข้อมูลผู้ดูแลระบบ</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/super-admin/admins/${admin._id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Edit className="h-4 w-4 mr-2" />
            แก้ไขผู้ดูแลระบบ
          </Link>
          <button
            onClick={handleDeleteAdmin}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบผู้ดูแลระบบ
          </button>
        </div>
      </div>

      {/* Admin Profile Card */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center ${
              admin.role === 'superadmin' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              {admin.role === 'superadmin' ? (
                <Shield className="h-8 w-8 text-red-600" />
              ) : (
                <Users className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div className="ml-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {admin.firstName} {admin.lastName}
              </h2>
              <div className="flex items-center mt-1">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  admin.role === 'superadmin' 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {admin.role === 'superadmin' ? 'ผู้ดูแลระบบสูงสุด' : 'ผู้ดูแลระบบ'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            {/* Admin ID */}
            <div>
              <p className="text-sm font-medium text-gray-500">รหัสผู้ดูแลระบบ</p>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{admin._id}</dd>
            </div>

            {/* Phone */}
            <div>
              <p className="text-sm font-medium text-gray-500">หมายเลขโทรศัพท์</p>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                {formatPhoneNumber(admin.phone)}
              </dd>
            </div>

            {/* Email */}
            <div>
              <p className="text-sm font-medium text-gray-500">ที่อยู่อีเมล</p>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                {admin.email || 'Not provided'}
              </dd>
            </div>

            {/* Role */}
            <div>
              <p className="text-sm font-medium text-gray-500">บทบาท</p>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                {admin.role === 'superadmin' ? (
                  <Shield className="h-4 w-4 text-red-600 mr-2" />
                ) : (
                  <Users className="h-4 w-4 text-blue-600 mr-2" />
                )}
                {admin.role === 'superadmin' ? 'Super Administrator' : 'Administrator'}
              </dd>
            </div>

            {/* Last Login */}
            <div>
              <p className="text-sm font-medium text-gray-500">เข้าสู่ระบบครั้งล่าสุด</p>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                {admin.lastLogin ? format(new Date(admin.lastLogin), 'MMMM do, yyyy') : 'ไม่เคยเข้าสู่ระบบ'}
              </dd>
            </div>

            {/* Created Date */}
            <div>
              <p className="text-sm font-medium text-gray-500">สร้างบัญชีเมื่อ</p>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                {format(new Date(admin.createdAt), 'PPP')}
              </dd>
            </div>

            {/* Last Updated */}
            <div>
              <p className="text-sm font-medium text-gray-500">อัปเดตล่าสุด</p>
              <dd className="mt-1 text-sm text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                {format(new Date(admin.updatedAt), 'PPP')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Permissions Card */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">ข้อมูลพื้นฐาน</h3>
          <p className="text-sm text-gray-600">สิทธิ์การเข้าถึงปัจจุบันสำหรับผู้ดูแลระบบนี้</p>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center">
              {admin.permissions.manageUsers ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">จัดการผู้ใช้</p>
                <p className="text-xs text-gray-500">
                  {admin.permissions.manageUsers ? 'สามารถจัดการบัญชีผู้ใช้ได้' : 'ไม่สามารถจัดการบัญชีผู้ใช้ได้'}
                </p>
              </div>
            </div>

            <div className="flex items-center">
              {admin.permissions.manageLoans ? (
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mr-3" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">จัดการสินเชื่อ</p>
                <p className="text-xs text-gray-500">
                  {admin.permissions.manageLoans ? 'สามารถจัดการคำขอสินเชื่อได้' : 'ไม่สามารถจัดการคำขอสินเชื่อได้'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status Card */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">สถานะบัญชี</h3>
          <p className="text-sm text-gray-600">ข้อมูลสถานะและกิจกรรมปัจจุบัน</p>
        </div>
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">สถานะบัญชี</p>
              <p className="text-xs text-green-600">ใช้งานอยู่</p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className={`p-3 rounded-full ${
                  admin.lastLogin ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Clock className={`h-6 w-6 ${
                    admin.lastLogin ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">สถานะการเข้าสู่ระบบ</p>
              <p className={`text-xs ${
                admin.lastLogin ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {admin.lastLogin ? 'เคยเข้าสู่ระบบแล้ว' : 'ไม่เคยเข้าสู่ระบบ'}
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-2">
                <div className={`p-3 rounded-full ${
                  admin.role === 'superadmin' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {admin.role === 'superadmin' ? (
                    <Shield className="h-6 w-6 text-red-600" />
                  ) : (
                    <Users className="h-6 w-6 text-blue-600" />
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">ระดับการเข้าถึง</p>
              <p className={`text-xs ${
                admin.role === 'superadmin' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {admin.role === 'superadmin' ? 'ผู้ดูแลระบบสูงสุด' : 'ผู้ดูแลระบบมาตรฐาน'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDetailsPage;
