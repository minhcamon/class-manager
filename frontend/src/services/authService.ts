import { axiosInstance, setLocalAccessToken } from './axiosInstance';
import { AuthResponse, RegisterPayload, OtpSendResponse } from '../types/auth';

export const authService = {
  async register(payload: RegisterPayload): Promise<{ message: string; status: string }> {
    const response = await axiosInstance.post<{ message: string; status: string }>(
      '/api/v1/auth/register',
      payload
    );
    return response.data;
  },

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/api/v1/auth/google', {
      idToken,
    });
    setLocalAccessToken(response.data.accessToken);
    return response.data;
  },

  async refresh(): Promise<AuthResponse> {
    const response = await axiosInstance.post<AuthResponse>('/api/v1/auth/refresh');
    setLocalAccessToken(response.data.accessToken);
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<{ message: string }>('/api/v1/auth/logout');
      return response.data;
    } finally {
      setLocalAccessToken(null);
    }
  },

  async sendOtp(phoneNumber: string, purpose: string = 'REGISTER'): Promise<OtpSendResponse> {
    const response = await axiosInstance.post<OtpSendResponse>(
      `/api/v1/auth/otp/send?phoneNumber=${encodeURIComponent(phoneNumber)}&purpose=${encodeURIComponent(purpose)}`
    );
    return response.data;
  },

  async verifyOtp(phoneNumber: string, otp: string): Promise<string> {
    const response = await axiosInstance.post<string>(
      `/api/v1/auth/otp/verify?phoneNumber=${encodeURIComponent(phoneNumber)}&otp=${encodeURIComponent(otp)}`
    );
    return response.data;
  },
};
