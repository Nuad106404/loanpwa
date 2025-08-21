import React from 'react';

interface AdminAuthLayoutProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Simplified auth layout specifically for admin authentication
 */
const AdminAuthLayout: React.FC<AdminAuthLayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {title}
        </h2>
        <div className="mt-2 text-center text-sm text-gray-600">
          <p>Loan Management System</p>
          <p className="font-medium">Admin Portal</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminAuthLayout;
