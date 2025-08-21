import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Shield, 
  Activity,
  Clock,
  Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAdminStats, AdminStats } from '../services/superAdminService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const SuperAdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      toast.error('ไม่สามารถโหลดสถิติผู้ดูแลระบบได้');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'เมื่อสักครู่';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} นาทีที่แล้ว`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ชั่วโมงที่แล้ว`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const pieData = stats ? [
    { name: 'ผู้ดูแลระบบ', value: stats.adminsByRole.admin || 0, color: '#3B82F6' },
    { name: 'ผู้ดูแลระบบสูงสุด', value: stats.adminsByRole.superadmin || 0, color: '#EF4444' }
  ] : [];

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
          <h1 className="text-2xl font-semibold text-gray-900">แดชบอร์ดผู้ดูแลระบบสูงสุด</h1>
          <p className="text-gray-600">จัดการผู้ดูแลระบบและการเข้าถึงระบบ</p>
        </div>
        <Link
          to="/super-admin/admins/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มผู้ดูแลระบบ
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-gray-900">{stats?.totalAdmins || 0}</h3>
          <p className="text-gray-600">ผู้ดูแลระบบทั้งหมด</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-green-50 rounded-lg">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-gray-900">{stats?.activeAdmins || 0}</h3>
          <p className="text-gray-600">ผู้ดูแลระบบที่ใช้งาน (30 วัน)</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-gray-900">{stats?.adminsByRole.superadmin || 0}</h3>
          <p className="text-gray-600">ผู้ดูแลระบบสูงสุด</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-orange-50 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-gray-900">{stats?.adminsByRole.admin || 0}</h3>
          <p className="text-gray-600">เข้าสู่ระบบล่าสุด (7 วัน)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Admin Role Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">การกระจายผู้ดูแลระบบ</h2>
          <div className="h-80">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-center space-x-6">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm text-gray-600">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">การดำเนินการด่วน</h2>
          <div className="space-y-3">
            <Link
              to="/super-admin/admins"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium">จัดการผู้ดูแลระบบ</h3>
                  <p className="text-sm text-gray-500">ดู แก้ไข และลบบัญชีผู้ดูแลระบบ</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/super-admin/admins/new"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Plus className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium">เพิ่มผู้ดูแลระบบใหม่</h3>
                  <p className="text-sm text-gray-500">สร้างบัญชีผู้ดูแลระบบใหม่</p>
                </div>
              </div>
            </Link>

            <Link
              to="/dashboard"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium">แดชบอร์ดระบบ</h3>
                  <p className="text-sm text-gray-500">ดูสถิติรวมของระบบ</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Admin Activity */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h2 className="text-lg font-semibold">กิจกรรมล่าสุดของผู้ดูแลระบบ</h2>
          <div className="mt-4 divide-y divide-gray-200">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((admin) => (
                <div key={admin._id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-full ${
                        admin.role === 'superadmin' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        {admin.role === 'superadmin' ? (
                          <Shield className="h-4 w-4 text-red-600" />
                        ) : (
                          <Users className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {admin.firstName} {admin.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {admin.phone} • {admin.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {admin.lastLogin ? (
                        <>
                          <Clock className="h-4 w-4 inline mr-1" />
                          {formatRelativeTime(admin.lastLogin.toString())}
                        </>
                      ) : (
                        'ไม่เคยเข้าสู่ระบบ'
                      )}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-500">ไม่มีกิจกรรมล่าสุดของผู้ดูแลระบบ</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
