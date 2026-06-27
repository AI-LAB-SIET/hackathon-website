export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  bio?: string;
  skills: string[];
  socialLinks: SocialLink[];
  phone?: string;
  department?: string;
  year?: string;
  registerNumber?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface SocialLink {
  platform: 'github' | 'linkedin' | 'twitter' | 'website' | 'other';
  url: string;
}

export type UserRole = 'participant' | 'admin' | 'judge' | 'organizer' | 'volunteer' | 'mentor';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  role?: UserRole;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'microsoft';
  redirectUrl: string;
}

export interface SessionData {
  user: User;
  tokens: AuthTokens;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: { code: string; message: string; details?: Record<string, unknown>; field?: string } | null;
}