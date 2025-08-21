import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // If authenticated but not super admin, redirect to dashboard
  if (user.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If super admin, render children
  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
