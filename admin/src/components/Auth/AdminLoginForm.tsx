import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Phone, Lock, Loader2 } from 'lucide-react';

interface AdminLoginFormProps {
  onSubmit: (data: { phone: string; password: string }) => Promise<void>;
  errorMessage?: string;
}

/**
 * Admin-specific login form component that focuses just on admin authentication
 * Simplified from the UnifiedAuthForm to focus only on admin login
 */
const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onSubmit, errorMessage }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(errorMessage || null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle phone number formatting
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX for Thai phones
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    setPhone(formattedPhone);
    setError(null); // Clear error when user makes changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      setError('กรุณาระบุหมายเลขโทรศัพท์ 10 หลักที่ถูกต้อง');
      return;
    }
    
    if (password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading(true);

    try {
      // Submit clean phone number (digits only)
      await onSubmit({ phone: phoneDigits, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4 animate-shake">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            หมายเลขโทรศัพท์ผู้ดูแลระบบ
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              value={phone}
              onChange={handlePhoneChange}
              className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="XXX-XXX-XXXX"
              maxLength={12} // 10 digits plus 2 hyphens
              disabled={isLoading}
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            รหัสผ่าน
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="appearance-none block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium 
            text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 transition-colors duration-200 relative
            ${isLoading ? 'bg-blue-400 cursor-not-allowed' : ''}
          `}
        >
          <span className={`flex items-center justify-center ${isLoading ? 'invisible' : ''}`}>
            เข้าสู่ระบบผู้ดูแลระบบ
          </span>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        การเข้าสู่ระบบนี้สำหรับผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น
      </div>
    </form>
  );
};

export default AdminLoginForm;
