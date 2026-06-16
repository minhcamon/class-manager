import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserInfo } from '../types/auth';
import { authService } from '../services/authService';
import {
  setLocalAccessToken,
  registerLogoutHandler,
  registerTokenRefreshedHandler,
} from '../services/axiosInstance';

interface AuthContextType {
  user: UserInfo | null;
  accessToken: string | null;
  loading: boolean;
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = async () => {
    try {
      const data = await authService.refresh();
      setUser(data.user);
      setAccessToken(data.accessToken);
      setLocalAccessToken(data.accessToken);
    } catch {
      // Refresh token might not exist or expired, which is normal on first load
      setUser(null);
      setAccessToken(null);
      setLocalAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Silent token refresh on app startup
    const init = async () => {
      await refreshSession();
    };
    init();

    // Register handlers to keep axios instance and context synchronized
    registerLogoutHandler(() => {
      setUser(null);
      setAccessToken(null);
      setLocalAccessToken(null);
    });

    registerTokenRefreshedHandler((token) => {
      setAccessToken(token);
      setLocalAccessToken(token);
    });
  }, []);

  const loginWithGoogle = async (idToken: string) => {
    setLoading(true);
    try {
      const data = await authService.loginWithGoogle(idToken);
      setUser(data.user);
      setAccessToken(data.accessToken);
      setLocalAccessToken(data.accessToken);
    } catch (error) {
      setUser(null);
      setAccessToken(null);
      setLocalAccessToken(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessToken(null);
      setLocalAccessToken(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        loginWithGoogle,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
