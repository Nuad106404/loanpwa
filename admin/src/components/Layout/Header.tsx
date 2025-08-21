import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 bg-white shadow">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden -ml-2 p-2 rounded-md text-gray-500 hover:text-gray-900"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              className="p-2 rounded-full text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <span className="sr-only">ดูการแจ้งเตือน</span>
              <Bell className="h-6 w-6" />
            </button>

            <div className="ml-4 relative flex-shrink-0">
              <div className="flex items-center">
                <div className="hidden md:block">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{user ? `${user.firstName} ${user.lastName}` : ''}</div>
                    <div className="text-xs text-gray-500">{user?.role}</div>
                  </div>
                </div>
                <div className="ml-3 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user?.firstName?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;