import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Shield, Users } from 'lucide-react';
import { getAllAdmins, deleteAdmin, AdminUser } from '../services/superAdminService';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';

const AdminManagementPageSimple: React.FC = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const data = await getAllAdmins();
      
      if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        console.error('Invalid data format received:', data);
        setAdmins([]);
        toast.error('รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ดูแลระบบได้');
      setAdmins([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    const result = await Swal.fire({
      title: 'ลบผู้ดูแลระบบ?',
      text: `คุณแน่ใจหรือไม่ที่จะลบ ${adminName}? การดำเนินการนี้ไม่สามารถยกเลิกได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่ ลบเลย',
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

  const filteredAdmins = (admins || []).filter(admin =>
    admin.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.phone?.includes(searchTerm) ||
    (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ดูแลระบบ</h1>
          <p className="text-gray-600">จัดการบัญชีผู้ดูแลระบบและสิทธิ์การเข้าถึง</p>
        </div>
        <Link
          to="/super-admin/admins/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มผู้ดูแลระบบ
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาผู้ดูแลระบบ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            ผู้ดูแลระบบ ({filteredAdmins.length})
          </h3>
        </div>

        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No admins found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new admin.'}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Link
                  to="/super-admin/admins/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Admin
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ผู้ดูแลระบบ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ติดต่อ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    บทบาท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่สร้าง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
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
                      <div className="text-sm text-gray-900">{admin.phone}</div>
                      {admin.email && (
                        <div className="text-sm text-gray-500">{admin.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.role === 'superadmin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/super-admin/admins/${admin._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        ดู
                      </Link>
                      <Link
                        to={`/super-admin/admins/${admin._id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        แก้ไข
                      </Link>
                      <button
                        onClick={() => handleDeleteAdmin(admin._id, `${admin.firstName} ${admin.lastName}`)}
                        className="text-red-600 hover:text-red-900"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagementPageSimple;
