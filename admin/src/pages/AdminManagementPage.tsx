import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Phone, 
  Mail, 
  MoreVertical,
  Eye
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { getAllAdmins, deleteAdmin, AdminUser } from '../services/superAdminService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

const AdminManagementPage: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'superadmin'>('all');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await getAllAdmins();
      setAdmins(data);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    const result = await Swal.fire({
      title: 'ลบผู้ดูแลระบบ?',
      text: `คุณแน่ใจหรือไม่ที่จะลบ ${adminName}? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'ใช่, ลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      try {
        await deleteAdmin(adminId);
        toast.success('ลบผู้ดูแลระบบเรียบร้อยแล้ว');
        fetchAdmins(); // Refresh the list
      } catch (error) {
        console.error('Error deleting admin:', error);
        toast.error('ไม่สามารถลบผู้ดูแลระบบได้');
      }
    }
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.phone.includes(searchTerm) ||
      (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">จัดการผู้ดูแลระบบ</h1>
          <p className="text-gray-600">จัดการบัญชีผู้ดูแลระบบและสิทธิ์การเข้าถึง</p>
        </div>
        <Link
          to="/super-admin/admins/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มผู้ดูแลระบบ
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="ค้นหาผู้ดูแลระบบ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'superadmin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">บทบาททั้งหมด</option>
              <option value="admin">ผู้ดูแลระบบ</option>
              <option value="superadmin">ผู้ดูแลระบบสูงสุด</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ชื่อ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ติดต่อ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  บทบาท
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สร้างเมื่อ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">การดำเนินการ</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          admin.role === 'superadmin' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          {admin.role === 'superadmin' ? (
                            <Shield className="h-5 w-5 text-red-600" />
                          ) : (
                            <Users className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {admin.firstName} {admin.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {admin._id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          {formatPhoneNumber(admin.phone)}
                        </div>
                        {admin.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 text-gray-400 mr-2" />
                            {admin.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admin.role === 'superadmin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {admin.role === 'superadmin' ? 'ผู้ดูแลระบบสูงสุด' : 'ผู้ดูแลระบบ'}
                    </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.lastLogin ? format(new Date(admin.lastLogin), 'MMM dd, yyyy') : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(admin.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                          <MoreVertical className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                        <Transition
                          as={React.Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <Link
                                    to={`/super-admin/admins/${admin._id}`}
                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}
                                  >
                                    <Eye className="mr-3 h-4 w-4" aria-hidden="true" />
                                    ดูรายละเอียด
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <Link
                                    to={`/super-admin/admins/${admin._id}/edit`}
                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex items-center px-4 py-2 text-sm`}
                                  >
                                    <Edit className="mr-3 h-4 w-4" aria-hidden="true" />
                                    แก้ไข
                                  </Link>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }: { active: boolean }) => (
                                  <button
                                    onClick={() => handleDeleteAdmin(admin._id, `${admin.firstName} ${admin.lastName}`)}
                                    className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} group flex w-full items-center px-4 py-2 text-sm`}
                                  >
                                    <Trash2 className="mr-3 h-4 w-4" aria-hidden="true" />
                                    ลบ
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">ไม่พบผู้ดูแลระบบ</h3>
                      <p className="text-sm">
                        {searchTerm || roleFilter !== 'all' 
                          ? 'ลองปรับเกณฑ์การค้นหาหรือตัวกรองของคุณ'
                          : 'เริ่มต้นด้วยการสร้างผู้ดูแลระบบคนแรกของคุณ'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            แสดง {filteredAdmins.length} จาก {admins.length} ผู้ดูแลระบบ
          </span>
          <span>
            {admins.filter(a => a.role === 'superadmin').length} ผู้ดูแลระบบสูงสุด, {' '}
            {admins.filter(a => a.role === 'admin').length} ผู้ดูแลระบบทั่วไป
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;
