export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  inviteCode: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  otp?: string;
}

export interface TwoFactorChallengeResponse {
  twoFactorRequired: boolean;
  challengeToken: string;
}

export interface TwoFactorLoginRequest {
  otp: string;
  challengeToken?: string;
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
  username: string;
  email: string;
  password: string;
}
