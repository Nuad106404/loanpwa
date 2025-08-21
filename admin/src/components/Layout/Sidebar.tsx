import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, Users, Percent, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  // Dynamic navigation based on user role
  const getNavigation = () => {
    const baseNavigation = [
      { name: 'แดชบอร์ด', href: '/dashboard', icon: LayoutDashboard },
      { name: 'ผู้ใช้งาน', href: '/users', icon: Users },
      { name: 'อัตราดอกเบี้ย', href: '/interest-rates', icon: Percent },
    ];

    // Add super admin navigation if user is super admin
    if (user?.role === 'superadmin') {
      baseNavigation.push({
        name: 'จัดการผู้ดูแลระบบ',
        href: '/super-admin/admins',
        icon: Shield
      });
    }

    return baseNavigation;
  };

  const navigation = getNavigation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <div className="flex items-center">
            <span className="text-xl font-bold text-white">แผงควบคุมผู้ดูแลระบบ</span>
          </div>
          <button
            type="button"
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-4 h-6 w-6 ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;