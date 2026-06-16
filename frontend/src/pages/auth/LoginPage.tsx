import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { RegisterPayload } from '../../types/auth';
import { 
  AlertCircle, 
  CheckCircle, 
  Smartphone, 
  User, 
  Mail, 
  Info, 
  ArrowRight,
  Sparkles,
  Lock
} from 'lucide-react';

interface GoogleCredentialResponse {
  credential: string;
}

export const LoginPage: React.FC = () => {
  const { loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [registerMethod, setRegisterMethod] = useState<'google' | 'phone'>('google');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT');
  const [classId, setClassId] = useState<number>(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Refs to avoid stale closures in Google GIS callback
  const activeTabRef = React.useRef(activeTab);
  const fullNameRef = React.useRef(fullName);
  const roleRef = React.useRef(role);
  const classIdRef = React.useRef(classId);

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { fullNameRef.current = fullName; }, [fullName]);
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { classIdRef.current = classId; }, [classId]);

  // States
  const [otpSent, setOtpSent] = useState(false);
  const [mockOtp, setMockOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleGoogleCredentialResponse = useCallback(async (response: GoogleCredentialResponse) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTabRef.current === 'login') {
        await loginWithGoogle(response.credential);
      } else {
        const currentRole = roleRef.current;
        const payload: RegisterPayload = {
          fullName: fullNameRef.current,
          role: currentRole,
          googleIdToken: response.credential,
          classId: currentRole === 'STUDENT' ? classIdRef.current : undefined,
        };
        const result = await authService.register(payload);
        setSuccessMsg(result.message);
        setActiveTab('login');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { message?: string; details?: string[] } | undefined;
        if (responseData?.details && responseData.details.length > 0) {
          setErrorMsg(`${responseData.message}: ${responseData.details.join(', ')}`);
        } else {
          setErrorMsg(responseData?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
        }
      } else {
        setErrorMsg('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle]);

  // Initialize Google Identity Services
  useEffect(() => {
    const initializeGoogle = () => {
      // @ts-expect-error - Google accounts API loaded dynamically via script
      if (window.google) {
        // @ts-expect-error - Google accounts API loaded dynamically via script
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
        });

        const btnElement = document.getElementById('google-login-btn');
        if (btnElement) {
          // @ts-expect-error - Google accounts API loaded dynamically via script
          window.google.accounts.id.renderButton(btnElement, {
            theme: 'outline',
            size: 'large',
            width: 320,
            text: activeTab === 'login' ? 'signin_with' : 'signup_with',
          });
        }
      }
    };

    const timer = setTimeout(initializeGoogle, 500);
    return () => clearTimeout(timer);
  }, [activeTab, registerMethod, handleGoogleCredentialResponse]);

  const handleSendOtp = async () => {
    if (!phoneNumber.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setMockOtp(null);
    try {
      const response = await authService.sendOtp(phoneNumber);
      setOtpSent(true);
      if (response.otp) {
        setMockOtp(response.otp);
      }
      setSuccessMsg('Mã OTP đã được gửi đến số điện thoại của bạn.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { message?: string } | undefined;
        setErrorMsg(responseData?.message || 'Gửi OTP thất bại.');
      } else {
        setErrorMsg('Gửi OTP thất bại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên');
      return;
    }
    if (!otpCode.trim()) {
      setErrorMsg('Vui lòng nhập mã OTP');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const payload: RegisterPayload = {
        fullName,
        role,
        phoneNumber,
        otpCode,
        email: email.trim() ? email : undefined,
        classId: role === 'STUDENT' ? classId : undefined,
      };

      const result = await authService.register(payload);
      setSuccessMsg(result.message);
      setActiveTab('login');
      setFullName('');
      setPhoneNumber('');
      setEmail('');
      setOtpCode('');
      setOtpSent(false);
      setMockOtp(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const responseData = err.response?.data as { message?: string; details?: string[] } | undefined;
        if (responseData?.details && responseData.details.length > 0) {
          setErrorMsg(`${responseData.message}: ${responseData.details.join(', ')}`);
        } else {
          setErrorMsg(responseData?.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
        }
      } else {
        setErrorMsg('Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-10 px-4 bg-[#FBFBFA] font-sans">
      <div className="w-full max-w-md animate-fade-lift">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-white border border-neutral-100 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.01)] mb-3">
            <Sparkles className="text-neutral-900" strokeWidth={1.5} size={20} />
          </div>
          <h1 className="text-3xl font-medium tracking-tight mb-1.5 text-neutral-900 font-serif">
            ClassManager
          </h1>
          <p className="text-[11px] text-neutral-500 font-normal tracking-wide">
            Hệ thống quản lý thi đua lớp chủ nhiệm trực tuyến
          </p>
        </div>

        {/* Paper-Cut Card Wrapper */}
        <div 
          className="bg-white border border-neutral-100 rounded-xl p-6"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
        >
          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-100 mb-4 text-xs">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 pb-3 font-medium text-center transition-all duration-350 relative ${
                activeTab === 'login'
                  ? 'text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Đăng nhập
              {activeTab === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900" />
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 pb-3 font-medium text-center transition-all duration-350 relative ${
                activeTab === 'register'
                  ? 'text-neutral-900'
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Đăng ký tài khoản
              {activeTab === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-900" />
              )}
            </button>
          </div>

          {/* Messages Alert */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-md text-xs bg-pale-red text-pale-red-text border border-pale-red-text/10 leading-normal animate-fade-lift">
              <AlertCircle className="shrink-0" strokeWidth={1.5} size={15} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 rounded-md text-xs bg-pale-green text-pale-green-text border border-pale-green-text/10 leading-normal animate-fade-lift">
              <CheckCircle className="shrink-0" strokeWidth={1.5} size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-6">
              <p className="text-xs text-neutral-500 text-center max-w-xs leading-relaxed">
                Đăng nhập nhanh bằng tài khoản Google trường học của bạn.
              </p>
              
              <div className="flex justify-center w-full min-h-[50px] focus-within:ring-1 focus-within:ring-neutral-900 rounded-md transition-all">
                <div id="google-login-btn"></div>
              </div>

              {loading && (
                <div className="w-full space-y-2.5 mt-4">
                  <div className="h-[2px] bg-neutral-100 rounded overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-neutral-900 animate-progress-slide rounded" />
                  </div>
                  <p className="text-center text-[11px] text-neutral-400 tracking-wide">
                    Đang xử lý đăng nhập...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* REGISTER TAB */}
          {activeTab === 'register' && (
            <div className="space-y-5">
              {/* Full Name field */}
              <div>
                <label className="block text-xs font-medium tracking-wider text-neutral-500 uppercase mb-1.5">
                  Họ và tên
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50/50 border border-neutral-200 rounded-md outline-none focus:bg-white focus:border-neutral-900 transition-all duration-300"
                  />
                  <User className="absolute left-3 top-2.5 text-neutral-400" strokeWidth={1.5} size={16} />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-medium tracking-wider text-neutral-500 uppercase mb-1.5">
                  Vai trò đăng ký
                </label>
                <select
                  value={role}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as 'TEACHER' | 'STUDENT')}
                  className="w-full px-3 py-2 text-sm bg-neutral-50/50 border border-neutral-200 rounded-md outline-none focus:bg-white focus:border-neutral-900 transition-all duration-300 appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`, backgroundPosition: 'right 12px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
                >
                  <option value="STUDENT">Học sinh (STUDENT)</option>
                  <option value="TEACHER">Giáo viên chủ nhiệm (TEACHER)</option>
                </select>
              </div>

              {/* Affiliation dropdowns */}
              {role === 'STUDENT' && (
                <div className="animate-fade-lift">
                  <label className="block text-xs font-medium tracking-wider text-neutral-500 uppercase mb-1.5">
                    Lớp học tham gia
                  </label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-neutral-50/50 border border-neutral-200 rounded-md outline-none focus:bg-white focus:border-neutral-900 transition-all duration-300 appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`, backgroundPosition: 'right 12px center', backgroundSize: '16px', backgroundRepeat: 'no-repeat' }}
                  >
                    <option value={1}>Lớp 10A1 (Khối 10)</option>
                    <option value={2}>Lớp 11A1 (Khối 11)</option>
                    <option value={3}>Lớp 12A1 (Khối 12)</option>
                  </select>
                </div>
              )}

              {/* Register Method Selection */}
              <div className="flex border border-neutral-100 rounded-md p-1 text-xs bg-neutral-50/50 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMethod('google');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 px-2 font-medium rounded transition-all duration-300 ${
                    registerMethod === 'google' ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  Xác thực Google
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegisterMethod('phone');
                    setErrorMsg(null);
                  }}
                  className={`flex-1 py-1.5 px-2 font-medium rounded transition-all duration-300 ${
                    registerMethod === 'phone' ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-neutral-400 hover:text-neutral-600'
                  }`}
                >
                  Xác thực SĐT (OTP)
                </button>
              </div>

              {/* Dynamic registration fields based on method */}
              {registerMethod === 'google' ? (
                <div className="flex flex-col items-center justify-center pt-4 space-y-4 animate-fade-lift">
                  <p className="text-xs text-neutral-400 text-center leading-relaxed max-w-xs">
                    Sau khi điền tên và chọn vai trò, nhấn vào nút bên dưới để chọn email Google liên kết.
                  </p>
                  <div className="flex justify-center w-full min-h-[50px]">
                    <div id="google-login-btn"></div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegisterPhone} className="space-y-4 pt-4 border-t border-neutral-100 animate-fade-lift">
                  {/* Phone input */}
                  <div>
                    <label className="block text-xs font-medium tracking-wider text-neutral-500 uppercase mb-1.5">
                      Số điện thoại
                    </label>
                    <div className="flex space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="tel"
                          placeholder="0987654321"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={otpSent}
                          className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50/50 border border-neutral-200 rounded-md outline-none focus:bg-white focus:border-neutral-900 transition-all duration-300 disabled:opacity-50"
                        />
                        <Smartphone className="absolute left-3 top-2.5 text-neutral-400" strokeWidth={1.5} size={16} />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading || otpSent}
                        className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-50 text-white disabled:text-neutral-400 text-xs font-medium rounded-md active:scale-[0.98] transition-all duration-200 border border-transparent disabled:border-neutral-200 cursor-pointer"
                      >
                        {otpSent ? 'Đã gửi' : 'Gửi mã'}
                      </button>
                    </div>
                  </div>

                  {/* Inline Alert display for Mock OTP */}
                  {mockOtp && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-md text-xs bg-pale-yellow text-pale-yellow-text border border-pale-yellow-text/10 leading-relaxed font-mono animate-fade-lift">
                      <Info className="shrink-0 mt-0.5 text-pale-yellow-text" strokeWidth={1.5} size={15} />
                      <div>
                        <span className="font-semibold block mb-1">Mã OTP thử nghiệm (MVP Mode):</span>
                        <span className="font-bold text-sm bg-white px-2.5 py-0.5 rounded border border-pale-yellow-text/20 text-neutral-900">{mockOtp}</span>
                      </div>
                    </div>
                  )}

                  {/* OTP code input */}
                  <div>
                    <label className="block text-xs font-medium tracking-wider text-neutral-500 uppercase mb-1.5">
                      Mã xác thực OTP
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Mã 6 chữ số"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        maxLength={6}
                        disabled={!otpSent}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50/50 border border-neutral-200 rounded-md outline-none focus:bg-white focus:border-neutral-900 transition-all duration-300 disabled:opacity-50"
                      />
                      <Lock className="absolute left-3 top-2.5 text-neutral-400" strokeWidth={1.5} size={16} />
                    </div>
                  </div>

                  {/* Email option */}
                  <div>
                    <label className="block text-xs font-medium tracking-wider text-neutral-500 uppercase mb-1.5">
                      Email liên kết (Không bắt buộc)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="teacher@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50/50 border border-neutral-200 rounded-md outline-none focus:bg-white focus:border-neutral-900 transition-all duration-300"
                      />
                      <Mail className="absolute left-3 top-2.5 text-neutral-400" strokeWidth={1.5} size={16} />
                    </div>
                    <p className="text-[10px] text-neutral-400 mt-1.5 leading-normal">
                      Nhập Google email để hệ thống có thể tự động liên kết khi đăng nhập bằng Google sau này.
                    </p>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading || !otpSent}
                    className="w-full mt-4 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-50 text-white disabled:text-neutral-400 border border-transparent disabled:border-neutral-200 font-medium py-2.5 rounded-md active:scale-[0.98] transition-all duration-200 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Đăng ký tài khoản</span>
                    <ArrowRight strokeWidth={1.5} size={16} />
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
