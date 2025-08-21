import React, { useState } from 'react';
import { Menu, X, Home, User, Wallet, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  
  // Check if user is on the apply page
  const isOnApplyPage = location.pathname === '/apply';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <>
      <nav className="bg-white shadow-md fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {isOnApplyPage ? (
                <div className="flex-shrink-0 flex items-center cursor-not-allowed">
                  <img src="https://i.postimg.cc/mDt6rdyR/logo.png" alt="Lease It Thailand Logo" className="h-8 w-10 opacity-50" />
                  <span className="ml-2 text-xl font-bold text-gray-400">Lease It Thailand</span>
                </div>
              ) : (
                <Link to="/" className="flex-shrink-0 flex items-center">
                  <img src="https://i.postimg.cc/mDt6rdyR/logo.png" alt="Lease It Thailand Logo" className="h-8 w-10" />
                  <span className="ml-2 text-xl font-bold text-blue-900">Lease It Thailand</span>
                </Link>
              )}
            </div>
            <div className="hidden md:flex items-center space-x-4">
              {isOnApplyPage ? (
                <span className="text-gray-400 px-3 py-2 rounded-md text-sm font-medium flex items-center cursor-not-allowed">
                  <Home className="h-4 w-4 mr-1" />
                  หน้าหลัก
                </span>
              ) : (
                <Link to="/" className="text-gray-700 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                  <Home className="h-4 w-4 mr-1" />
                  หน้าหลัก
                </Link>
              )}
              {isAuthenticated ? (
                <>
                  {isOnApplyPage ? (
                    <>
                      <span className="text-gray-400 px-3 py-2 rounded-md text-sm font-medium flex items-center cursor-not-allowed">
                        <Wallet className="h-4 w-4 mr-1" />
                        กระเป๋าเงิน
                      </span>
                      <span className="text-gray-400 px-3 py-2 rounded-md text-sm font-medium flex items-center cursor-not-allowed">
                        <User className="h-4 w-4 mr-1" />
                        โปรไฟล์
                      </span>
                      <span className="text-gray-400 px-3 py-2 rounded-md text-sm font-medium flex items-center cursor-not-allowed">
                        <LogOut className="h-4 w-4 mr-1" />
                        ออกจากระบบ
                      </span>
                    </>
                  ) : (
                    <>
                      <Link to="/wallet" className="text-gray-700 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        <Wallet className="h-4 w-4 mr-1" />
                        กระเป๋าเงิน
                      </Link>
                      <Link to="/profile" className="text-gray-700 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        โปรไฟล์
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="text-gray-700 hover:text-blue-800 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        ออกจากระบบ
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {isOnApplyPage ? (
                    <span className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-400 bg-gray-300 cursor-not-allowed">
                      เข้าสู่ระบบ
                    </span>
                  ) : (
                    <Link 
                      to="/auth" 
                      className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                    >
                      เข้าสู่ระบบ
                    </Link>
                  )}
                </>
              )}
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-blue-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white shadow-lg`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isOnApplyPage ? (
              <span className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium flex items-center cursor-not-allowed">
                <Home className="h-5 w-5 mr-2" />
                หน้าหลัก
              </span>
            ) : (
              <Link to="/" className="text-gray-700 hover:text-blue-800 block px-3 py-2 rounded-md text-base font-medium flex items-center">
                <Home className="h-5 w-5 mr-2" />
                หน้าหลัก
              </Link>
            )}
            {isAuthenticated ? (
              <>
                {isOnApplyPage ? (
                  <>
                    <span className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium flex items-center cursor-not-allowed">
                      <Wallet className="h-5 w-5 mr-2" />
                      กระเป๋าเงิน
                    </span>
                    <span className="text-gray-400 block px-3 py-2 rounded-md text-base font-medium flex items-center cursor-not-allowed">
                      <User className="h-5 w-5 mr-2" />
                      โปรไฟล์
                    </span>
                    <span className="text-gray-400 block w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center cursor-not-allowed">
                      <LogOut className="h-5 w-5 mr-2" />
                      ออกจากระบบ
                    </span>
                  </>
                ) : (
                  <>
                    <Link to="/wallet" className="text-gray-700 hover:text-blue-800 block px-3 py-2 rounded-md text-base font-medium flex items-center">
                      <Wallet className="h-5 w-5 mr-2" />
                      กระเป๋าเงิน
                    </Link>
                    <Link to="/profile" className="text-gray-700 hover:text-blue-800 block px-3 py-2 rounded-md text-base font-medium flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      โปรไฟล์
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-blue-800 block w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      ออกจากระบบ
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                {isOnApplyPage ? (
                  <span className="mt-4 block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-gray-400 bg-gray-300 cursor-not-allowed">
                    Sign In
                  </span>
                ) : (
                  <Link 
                    to="/auth" 
                    className="mt-4 block w-full text-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      {isAuthenticated && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="grid grid-cols-3 h-16">
            {isOnApplyPage ? (
              <span className="flex flex-col items-center justify-center text-gray-400 cursor-not-allowed">
                <Home className="h-6 w-6" />
                <span className="text-xs mt-1">หน้าหลัก</span>
              </span>
            ) : (
              <Link to="/" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-800">
                <Home className="h-6 w-6" />
                <span className="text-xs mt-1">หน้าหลัก</span>
              </Link>
            )}
            {isOnApplyPage ? (
              <span className="flex flex-col items-center justify-center text-gray-400 cursor-not-allowed">
                <Wallet className="h-6 w-6" />
                <span className="text-xs mt-1">กระเป๋าเงิน</span>
              </span>
            ) : (
              <Link to="/wallet" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-800">
                <Wallet className="h-6 w-6" />
                <span className="text-xs mt-1">กระเป๋าเงิน</span>
              </Link>
            )}
            {isOnApplyPage ? (
              <span className="flex flex-col items-center justify-center text-gray-400 cursor-not-allowed">
                <User className="h-6 w-6" />
                <span className="text-xs mt-1">โปรไฟล์</span>
              </span>
            ) : (
              <Link to="/profile" className="flex flex-col items-center justify-center text-gray-600 hover:text-blue-800">
                <User className="h-6 w-6" />
                <span className="text-xs mt-1">โปรไฟล์</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
};

export default Navbar;
