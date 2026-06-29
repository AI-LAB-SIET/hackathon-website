import type { 
  User, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, 
  VerifyEmailRequest, AuthTokens, SessionData, UserRole
} from '@/types/api/auth';
import { INITIAL_TEAMS } from '@/lib/mockData';
import type { Team as MockTeam, Participant } from '@/types';

const STORAGE_KEYS = {
  TEAMS: 'siet_teams_v2',
  SESSION: 'siet_session',
  ANNOUNCEMENTS: 'siet_announcements',
  NOTIFICATIONS: 'siet_notifications_v2',
  VOLUNTEERS: 'siet_volunteers',
  USER_PROFILES: 'siet_profiles',
  PROBLEM_STATEMENTS: 'siet_problems',
  TICKETS: 'siet_tickets',
  SUBMISSIONS: 'siet_submissions',
  USER_CREDENTIALS: 'siet_user_credentials',
} as const;

function getStoredTeams(): MockTeam[] {
  if (typeof window === 'undefined') return INITIAL_TEAMS;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return stored ? JSON.parse(stored) : INITIAL_TEAMS;
  } catch {
    return INITIAL_TEAMS;
  }
}

function getStoredSession(): { isLoggedIn: boolean; role: UserRole | null; email: string | null; name: string | null; teamId: string | null } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredSession(session: { isLoggedIn: boolean; role: UserRole | null; email: string | null; name: string | null; teamId: string | null }): void {
  if (typeof window === 'undefined') return;
  const sessionData = JSON.stringify(session);
  localStorage.setItem(STORAGE_KEYS.SESSION, sessionData);
  // Also set cookie for middleware
  const cookieValue = encodeURIComponent(sessionData);
  const maxAge = session.isLoggedIn ? 60 * 60 * 24 * 30 : 0; // 30 days or expire
  document.cookie = `siet_session=${cookieValue}; path=/; max-age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

function getStoredCredentials(): Record<string, { password: string; role: UserRole; name: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_CREDENTIALS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setStoredCredentials(creds: Record<string, { password: string; role: UserRole; name: string }>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_CREDENTIALS, JSON.stringify(creds));
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
      const team = teams.find(t => t.members.some((m: Participant) => m.email.toLowerCase() === request.email.toLowerCase()));
      if (team) {
        teamId = team.id;
        const member = team.members.find((m: Participant) => m.email.toLowerCase() === request.email.toLowerCase());
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

    // Security: Admin role cannot be self-registered under any circumstances.
    // Admin accounts are created exclusively via the Firebase Admin SDK seed script.
    if (request.role === 'admin') {
      throw new Error('Registration as Admin is not permitted. Contact the system administrator.');
    }

    const creds = getStoredCredentials();
    const email = request.email.toLowerCase();

    if (creds[email]) {
      throw new Error('Email already registered');
    }

    // Participants are the only self-registering role.
    // Organizer, Judge, Volunteer accounts are created server-side by Admin/Organizer.
    const allowedSelfRegisterRoles: (typeof request.role)[] = ['participant', undefined];
    if (!allowedSelfRegisterRoles.includes(request.role)) {
      throw new Error(`Self-registration as ${request.role} is not permitted.`);
    }

    creds[email] = { password: request.password, role: request.role || 'participant', name: request.name };
    setStoredCredentials(creds);

    
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