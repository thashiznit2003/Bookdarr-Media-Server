export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

export interface AuthUser {
  id: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  inviteCode: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface SetupStatusResponse {
  required: boolean;
}

export interface SetupRequest {
  email?: string;
  username?: string;
  password: string;
}
