import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, Phone, Lock, Loader2, CheckCircle } from 'lucide-react';

interface UnifiedAuthFormProps {
  onSubmit: (data: {
    phone: string;
    password: string;
  }, isLogin: boolean) => Promise<{ status: string; message?: string }>;
  error?: string;
}

const UnifiedAuthForm: React.FC<UnifiedAuthFormProps> = ({ onSubmit, error: externalError }) => {

  // Use refs to store input elements for focus management
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [validPhone, setValidPhone] = useState(false);
  const [validPassword, setValidPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Focus the phone input field on component mount
  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.focus();
    }
  }, []);

  // Format phone as a Thai mobile number (e.g., 08-1234-5678)
  const formatThaiPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format for Thai phone number
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Validate phone number as it's typed
  const validatePhone = (phoneValue: string) => {
    const digits = phoneValue.replace(/\D/g, '');
    const isValid = digits.length === 10 && digits.startsWith('0');
    setValidPhone(isValid);
    return isValid;
  };

  // Validate password as it's typed
  const validatePassword = (pass: string) => {
    const isValid = pass.length >= 6;
    setValidPassword(isValid);
    return isValid;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedPhone = formatThaiPhoneNumber(value);
    setPhone(formattedPhone);
    validatePhone(formattedPhone);
    setPhoneTouched(true);
    setError(null); // Clear errors when user is correcting input
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    setPasswordTouched(true);
    setError(null); // Clear errors when user is correcting input
  };

  // Auto-advance to password field when phone is valid
  useEffect(() => {
    if (validPhone && phoneInputRef.current === document.activeElement && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [validPhone]);

  const handleSubmit = async (e: React.FormEvent, loginMode?: boolean) => {
    e.preventDefault();
    // If loginMode is explicitly passed, use it, otherwise use the current isLogin state
    const submissionMode = loginMode !== undefined ? loginMode : isLogin;
    setIsLogin(submissionMode);
    setError(null);

    // Final validation before submission
    const phoneDigits = phone.replace(/\D/g, '');
    const isPhoneValid = phoneDigits.length === 10 && phoneDigits.startsWith('0');
    const isPasswordValid = password.length >= 6;

    // Show appropriate validation errors
    if (!isPhoneValid) {
      setError('กรุณากรอกหมายเลขโทรศัพท์ไทยที่ถูกต้องเริ่มต้นด้วย 0');
      phoneInputRef.current?.focus();
      return;
    }

    if (!isPasswordValid) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);

    try {
      const cleanedPhone = phoneDigits;
      const response = await onSubmit(
        { phone: cleanedPhone, password },
        submissionMode
      );
      
      if (response.status !== 'success') {
        throw new Error(response.message || 'Authentication failed');
      }
      // Success is handled by the parent component redirecting the user
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {(error || externalError) && (
        <div className="rounded-md bg-red-50 p-4 animate-shake">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || externalError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">


        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          หมายเลขโทรศัพท์
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
              ref={phoneInputRef}
              value={phone}
              onChange={handlePhoneChange}
              className={`appearance-none block w-full pl-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 text-lg ${validPhone && phoneTouched ? 'border-green-500 bg-green-50' : phoneTouched ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="08-1234-5678"
              maxLength={12}
              disabled={isLoading}
              autoComplete="tel"
            />
            {validPhone && phoneTouched && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            )}
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
              ref={passwordInputRef}
              value={password}
              onChange={handlePasswordChange}
              className={`appearance-none block w-full pl-10 px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 text-lg ${validPassword && passwordTouched ? 'border-green-500 bg-green-50' : passwordTouched ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
            {validPassword && passwordTouched && (
              <div className="absolute inset-y-0 right-8 pr-3 flex items-center pointer-events-none">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
            )}
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

      <div className="flex gap-4">
        <button
          type="submit"
          onClick={(e) => handleSubmit(e, true)}
          disabled={isLoading || (!validPhone && phoneTouched) || (!validPassword && passwordTouched)}
          className={`
            flex-1 justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium 
            text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-blue-500 transition-colors duration-200 relative
            ${isLoading ? 'bg-blue-400 cursor-not-allowed' : (!validPhone || !validPassword) && (phoneTouched || passwordTouched) ? 'bg-blue-300 cursor-not-allowed opacity-70' : ''}
          `}
        >
          <span className={`flex items-center justify-center ${isLoading ? 'invisible' : ''}`}>
            เข้าสู่ระบบ
          </span>
          {isLoading && isLogin && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </button>
        <button
          type="submit"
          onClick={(e) => handleSubmit(e, false)}
          disabled={isLoading || (!validPhone && phoneTouched) || (!validPassword && passwordTouched)}
          className={`
            flex-1 justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium 
            text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
            focus:ring-green-500 transition-colors duration-200 relative
            ${isLoading ? 'bg-green-400 cursor-not-allowed' : (!validPhone || !validPassword) && (phoneTouched || passwordTouched) ? 'bg-green-300 cursor-not-allowed opacity-70' : ''}
          `}
        >
          <span className={`flex items-center justify-center ${isLoading ? 'invisible' : ''}`}>
            สมัครสมาชิก
          </span>
          {isLoading && !isLogin && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-gray-600">
        การดำเนินการต่อถือว่าคุณยอมรับ{' '}
        <a href="/terms" className="text-blue-600 hover:text-blue-500">
          ข้อกำหนดการใช้บริการ
        </a>{' '}
        และ{' '}
        <a href="/privacy" className="text-blue-600 hover:text-blue-500">
          นโยบายความเป็นส่วนตัว
        </a>
      </div>
    </form>
  );
};

export default UnifiedAuthForm;