import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { HomePage } from './pages/HomePage';

function DashboardHome() {
  const { user, logout } = useAuth();
  
  // Decide badge colors based on user role
  const getRoleBadgeClass = (role?: string) => {
    if (role === 'TEACHER' || role === 'ADMIN') {
      return 'bg-pale-blue text-pale-blue-text border border-pale-blue-text/10';
    }
    return 'bg-pale-green text-pale-green-text border border-pale-green-text/10';
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FBFBFA] p-4 font-sans">
      <div 
        className="max-w-md w-full bg-white border border-neutral-100 rounded-xl p-6 text-center animate-fade-lift"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
      >
        <h2 className="text-xl font-medium tracking-tight mb-2 text-neutral-900 font-serif">
          Chào mừng, {user?.fullName}!
        </h2>
        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
          Bạn đã đăng nhập thành công vào hệ thống với vai trò{' '}
          <span className={`inline-block font-mono px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getRoleBadgeClass(user?.role)}`}>
            {user?.role}
          </span>
        </p>
        <button
          onClick={logout}
          className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2 px-5 rounded-md transition-all duration-200 active:scale-[0.98] text-xs cursor-pointer"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FBFBFA] p-4 font-sans">
      <div 
        className="max-w-md w-full bg-white border border-neutral-100 rounded-xl p-6 text-center animate-fade-lift"
        style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
      >
        <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-pale-red text-pale-red-text border border-pale-red-text/10 mb-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-medium tracking-tight text-neutral-900 mb-1.5 font-serif">
          Không có quyền truy cập
        </h2>
        <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
          Tài khoản của bạn hiện tại không có quyền xem trang này.
        </p>
        <a 
          href="/login" 
          className="inline-block text-[11px] font-semibold tracking-wider text-neutral-500 hover:text-neutral-900 uppercase underline underline-offset-4 transition-colors"
        >
          Quay lại trang đăng nhập
        </a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardHome />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
