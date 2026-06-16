export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserInfo {
  id: number;
  fullName: string;
  role: UserRole;
  approvalStatus: UserApprovalStatus;
  teacherProfileId?: number | null;
  studentProfileId?: number | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: UserInfo;
}

export interface RegisterPayload {
  fullName: string;
  googleIdToken?: string;
  email?: string;
  phoneNumber?: string;
  otpCode?: string;
  role: 'TEACHER' | 'STUDENT';
  classId?: number;
}

export interface OtpSendResponse {
  message: string;
  otp?: string; // Chỉ trả về ở chế độ MVP/Dev
}
