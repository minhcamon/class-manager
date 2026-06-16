import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { Clock, XCircle, RefreshCw, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading, logout } = useAuth();

  // Minimalist linear loading indicator
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] p-4 font-sans">
        <div className="w-64 space-y-3">
          <div className="h-[2px] bg-neutral-100 rounded overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-1/4 bg-neutral-900 animate-progress-slide rounded" />
          </div>
          <p className="text-center text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated but not approved
  if (user.approvalStatus === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] p-4 font-sans">
        <div 
          className="max-w-md w-full bg-white border border-neutral-100 rounded-xl p-6 text-center animate-fade-lift"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-pale-yellow text-pale-yellow-text border border-pale-yellow-text/10 rounded-full mx-auto mb-4 animate-fade-lift">
            <Clock strokeWidth={1.5} size={20} />
          </div>
          <h2 className="text-lg font-medium tracking-tight text-neutral-900 mb-2 font-serif">
            Hồ sơ đang chờ duyệt
          </h2>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Tài khoản của bạn đã được đăng ký thành công. Vui lòng chờ Giáo viên chủ nhiệm hoặc Quản trị viên duyệt hồ sơ để truy cập hệ thống.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw strokeWidth={1.5} size={14} />
              <span>Kiểm tra lại trạng thái</span>
            </button>
            <button
              onClick={logout}
              className="w-full bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 font-medium py-2 px-4 rounded-md transition-all duration-200 active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut strokeWidth={1.5} size={14} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user.approvalStatus === 'REJECTED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] p-4 font-sans">
        <div 
          className="max-w-md w-full bg-white border border-neutral-100 rounded-xl p-6 text-center animate-fade-lift"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.01)' }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 bg-pale-red text-pale-red-text border border-pale-red-text/10 rounded-full mx-auto mb-4 animate-fade-lift">
            <XCircle strokeWidth={1.5} size={20} />
          </div>
          <h2 className="text-lg font-medium tracking-tight text-neutral-900 mb-2 font-serif">
            Đăng ký bị từ chối
          </h2>
          <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
            Hồ sơ của bạn đã bị từ chối duyệt. Vui lòng liên hệ với Giáo viên hoặc Quản trị viên để biết thêm chi tiết hoặc đăng ký lại.
          </p>
          <button
            onClick={logout}
            className="w-full bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border border-neutral-200 font-medium py-2 px-4 rounded-md transition-all duration-200 active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut strokeWidth={1.5} size={14} />
            <span>Đăng xuất & Quay lại</span>
          </button>
        </div>
      </div>
    );
  }

  // Not approved role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
