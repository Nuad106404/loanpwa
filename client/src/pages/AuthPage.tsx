import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../components/Auth/AuthLayout';
import UnifiedAuthForm from '../components/Auth/UnifiedAuthForm';
import { useAuth } from '../contexts/AuthContext';

interface AuthFormData {
  phone: string;
  password: string;
}

interface LocationState {
  redirectAfterAuth?: string;
  message?: string;
}

const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Extract message from location state
  useEffect(() => {
    const state = location.state as LocationState;
    if (state?.message) {
      setMessage(state.message);
    }
  }, [location]);

  const handleAuth = async (data: AuthFormData, isLogin: boolean): Promise<{ status: string; message?: string }> => {
    try {
      setError('');
      const response = isLogin
        ? await login({
            phone: data.phone,
            password: data.password
          })
        : await register({
            phone: data.phone,
            password: data.password
          });

      if (response.status === 'success') {
        // Always navigate to home page (Loan details) after successful login
        navigate('/');
      }
      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(errorMessage);
      console.error('Authentication error:', error);
      return { status: 'error', message: errorMessage };
    }
  };

  return (
    <AuthLayout title="เข้าสู่ระบบ / สมัครสมาชิก">
      {message && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <p>{message}</p>
        </div>
      )}
      <UnifiedAuthForm onSubmit={handleAuth} error={error} />
    </AuthLayout>
  );
};

export default AuthPage;