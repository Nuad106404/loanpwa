import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AdminLayout from './components/Layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import UserEditPage from './pages/UserEditPage';
import LoanEditPage from './pages/LoanEditPage';
import WalletEditPage from './pages/WalletEditPage';
import LoansPage from './pages/LoansPage';
import LoanDetailsPage from './pages/LoanDetailsPage';
import InterestRatesPage from './pages/InterestRatesPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AdminManagementPage from './pages/AdminManagementPageSimple';
import AdminFormPage from './pages/AdminFormPage';
import AdminDetailsPage from './pages/AdminDetailsPage';
import NotFoundPage from './pages/NotFoundPage';
import { AuthProvider } from './context/AuthContext';
import AdminProtectedRoute from './components/Auth/AdminProtectedRoute';
import SuperAdminProtectedRoute from './components/Auth/SuperAdminProtectedRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<Navigate to={`edit`} replace />} />
            <Route path="users/:id/edit" element={<UserEditPage />} />
            <Route path="users/:userId/loans/edit" element={<LoanEditPage />} />
            <Route path="users/:userId/wallet/edit" element={<WalletEditPage />} />
            <Route path="loans" element={<LoansPage />} />
            <Route path="loans/:id" element={<LoanDetailsPage />} />
            <Route path="interest-rates" element={<InterestRatesPage />} />
            
            {/* Super Admin Routes */}
            <Route path="super-admin" element={
              <SuperAdminProtectedRoute>
                <SuperAdminDashboard />
              </SuperAdminProtectedRoute>
            } />
            <Route path="super-admin/admins" element={
              <SuperAdminProtectedRoute>
                <AdminManagementPage />
              </SuperAdminProtectedRoute>
            } />
            <Route path="super-admin/admins/new" element={
              <SuperAdminProtectedRoute>
                <AdminFormPage />
              </SuperAdminProtectedRoute>
            } />
            <Route path="super-admin/admins/:adminId" element={
              <SuperAdminProtectedRoute>
                <AdminDetailsPage />
              </SuperAdminProtectedRoute>
            } />
            <Route path="super-admin/admins/:adminId/edit" element={
              <SuperAdminProtectedRoute>
                <AdminFormPage />
              </SuperAdminProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;