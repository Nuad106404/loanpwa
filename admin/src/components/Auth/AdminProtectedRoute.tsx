import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminAuthLayout from './AdminAuthLayout';
import AdminLoginForm from './AdminLoginForm';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Admin-specific protected route component that redirects to the admin login page
 * if the user is not authenticated
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, login } = useAuth();

  // If not authenticated, show login form directly instead of importing AdminAuthPage
  if (!isAuthenticated) {
    const handleAdminLogin = async (data: { phone: string; password: string }) => {
      await login(data.phone, data.password);
    };

    return (
      <AdminAuthLayout title="Admin Login">
        <AdminLoginForm onSubmit={handleAdminLogin} />
      </AdminAuthLayout>
    );
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;
