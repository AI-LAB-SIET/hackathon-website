import type { 
  User, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, 
  VerifyEmailRequest, AuthTokens, SessionData, UserRole
} from '@/types/api/auth';
import { INITIAL_TEAMS } from '@/lib/mockData';
import type { Team as MockTeam } from '@/types';

function getStoredTeams(): MockTeam[] {
  if (typeof window === 'undefined') return INITIAL_TEAMS;
  try {
    const stored = localStorage.getItem('siet_teams_v2');
    return stored ? JSON.parse(stored) : INITIAL_TEAMS;
  } catch {
    return INITIAL_TEAMS;
  }
}

function getStoredSession(): { isLoggedIn: boolean; role: UserRole | null; email: string | null; name: string | null; teamId: string | null } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('siet_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: { isLoggedIn: boolean; role: UserRole | null; email: string | null; name: string | null; teamId: string | null }): void {
  if (typeof window === 'undefined') return;
  const sessionData = JSON.stringify(session);
  localStorage.setItem('siet_session', sessionData);
  // Also set cookie for middleware
  const cookieValue = encodeURIComponent(sessionData);
  const maxAge = session.isLoggedIn ? 60 * 60 * 24 * 30 : 0; // 30 days or expire
  document.cookie = `siet_session=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

function getStoredCredentials(): Record<string, { password: string; role: UserRole; name: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem('siet_user_credentials');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function mockDelay(): Promise<void> {
  const delay = 300 + Math.random() * 500;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export const authService = {
  async login(request: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    await mockDelay();
    
    const creds = getStoredCredentials();
    const stored = creds[request.email.toLowerCase()];
    
    if (!stored || stored.password !== request.password) {
      throw new Error('Invalid credentials');
    }
    
    if (request.role && stored.role !== request.role) {
      throw new Error('Invalid role for this account');
    }
    
    let teamId: string | null = null;
    let name = stored.name;
    
    if (stored.role === 'participant') {
      const teams = getStoredTeams();
      const team = teams.find(t => t.members.some(m => m.email.toLowerCase() === request.email.toLowerCase()));
      if (team) {
        teamId = team.id;
        const member = team.members.find(m => m.email.toLowerCase() === request.email.toLowerCase());
        if (member) name = member.name;
      }
    }
    
    const user: User = {
      id: generateId('user'),
      email: request.email,
      name,
      role: stored.role,
      teamId: teamId || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: true,
      lastLoginAt: new Date().toISOString(),
    };
    
    const tokens: AuthTokens = {
      accessToken: `mock_access_${generateId('token')}`,
      refreshToken: `mock_refresh_${generateId('token')}`,
      expiresIn: request.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      tokenType: 'Bearer',
};
    
    setStoredSession({ isLoggedIn: true, role: stored.role, email: request.email, name, teamId });
    
    return { user, tokens };
  },

  async register(request: RegisterRequest): Promise<{ user: User; tokens: AuthTokens }> {
    await mockDelay();
    
    const creds = getStoredCredentials();
    const email = request.email.toLowerCase();
    
    if (creds[email]) {
      throw new Error('Email already registered');
    }
    
    creds[email] = { password: request.password, role: request.role || 'participant', name: request.name };
    localStorage.setItem('siet_user_credentials', JSON.stringify(creds));
    
    const tokens: AuthTokens = {
      accessToken: `mock_access_${generateId('token')}`,
      refreshToken: `mock_refresh_${generateId('token')}`,
      expiresIn: 24 * 60 * 60,
      tokenType: 'Bearer',
    };
    
    const user: User = {
      id: generateId('user'),
      email: request.email,
      name: request.name,
      role: request.role || 'participant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      emailVerified: false,
    };
    
    return { user, tokens };
  },

  async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await mockDelay();
    console.log('Password reset email sent to:', request.email);
  },

  async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await mockDelay();
    console.log('Password reset for token:', request.token);
  },

  async verifyEmail(request: VerifyEmailRequest): Promise<void> {
    await mockDelay();
    console.log('Email verified for token:', request.token);
  },

  async logout(): Promise<void> {
    await mockDelay();
    setStoredSession({ isLoggedIn: false, role: null, email: null, name: null, teamId: null });
  },

  async getSession(): Promise<SessionData | null> {
    await mockDelay();
    const session = getStoredSession();
    if (!session || !session.isLoggedIn) return null;
    
    return {
      user: {
        id: generateId('user'),
        email: session.email!,
        name: session.name!,
        role: session.role!,
        teamId: session.teamId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: true,
        lastLoginAt: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresIn: 24 * 60 * 60,
        tokenType: 'Bearer',
      },
      permissions: [],
    };
  },

  async refreshToken(): Promise<AuthTokens> {
    await mockDelay();
    return {
      accessToken: `mock_access_${generateId('token')}`,
      refreshToken: `mock_refresh_${generateId('token')}`,
      expiresIn: 24 * 60 * 60,
      tokenType: 'Bearer',
    };
  },
};