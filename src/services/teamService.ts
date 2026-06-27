import { mockApi } from './mockApi';
import { mockDelay, generateId } from './mockApi';
import type { TeamRegistrationRequest, TeamUpdateRequest, TeamApprovalRequest, TeamFilters, TeamStatus } from '@/types/api/team';
import type { Team as MockTeam, Participant } from '@/types';
import { INITIAL_TEAMS } from '@/lib/mockData';
import { notificationService } from './notificationService';

const TEAMS_KEY = 'siet_teams_v2';

function getStoredTeams(): MockTeam[] {
  if (typeof window === 'undefined') return INITIAL_TEAMS;
  try {
    const stored = localStorage.getItem('siet_teams_v2');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredTeams(teams: MockTeam[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('siet_teams_v2', JSON.stringify(teams));
}

function getStoredSession(): { isLoggedIn: boolean; role: string | null; email: string | null; name: string | null; teamId: string | null } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('siet_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export const teamService = {
  async getTeams(filters?: TeamFilters): Promise<{ items: MockTeam[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    await mockDelay();
    let teams = getStoredTeams();

    if (filters?.status) {
      teams = teams.filter(t => t.status === filters.status);
    }
    if (filters?.trackId) {
      teams = teams.filter(t => t.trackId === filters.trackId);
    }
    if (filters?.department) {
      teams = teams.filter(t => t.members.some(m => m.department === filters.department));
    }
    if (filters?.size) {
      teams = teams.filter((t: MockTeam) => t.size === filters.size);
    }
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      teams = teams.filter(t => t.name.toLowerCase().includes(search));
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const total = teams.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = teams.slice(start, start + limit);

    return {
      items,
      meta: { page, limit, total, totalPages },
    };
  },

  async getTeamById(id: string): Promise<MockTeam | null> {
    await mockDelay();
    const teams = getStoredTeams();
    return teams.find(t => t.id === id) || null;
  },

  async getTeamByQrToken(qrToken: string): Promise<MockTeam | null> {
    await mockDelay();
    const teams = getStoredTeams();
    return teams.find(t => t.qrToken === qrToken) || null;
  },

  async getTeamByMemberEmail(email: string): Promise<MockTeam | null> {
    await mockDelay();
    const teams = getStoredTeams();
    return teams.find(t => t.members.some(m => m.email.toLowerCase() === email.toLowerCase())) || null;
  },

  async createTeam(data: TeamRegistrationRequest): Promise<MockTeam> {
    await mockDelay();
    const teams = getStoredTeams();
    const session = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('siet_session') || '{}') : { email: '', role: 'participant' };
    
    const teamId = `team_${generateId()}`;
    const prefix = data.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const teamNum = 100 + teams.length + 5;
    const newTeam: MockTeam = {
      id: teamId,
      name: data.name,
      size: data.members.length,
      members: data.members,
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectDescription: data.projectDescription,
      qrToken: `${prefix}-AI26-${teamNum}-SEC${generateId().substring(2, 7).toUpperCase()}`,
      paymentVerified: false,
      facultyApproved: false,
      ideaSubmitted: false,
      shortlisted: false,
      attendance: { teamId, checkedIn: false },
      milestonesProgress: [
        { id: 'ms-1', title: 'Ideation & Design Diagram', completed: false },
        { id: 'ms-2', title: 'Database & API Schema Setup', completed: false },
        { id: 'ms-3', title: 'Core ML/AI Model Integration', completed: false },
        { id: 'ms-4', title: 'Frontend Dashboard Integration', completed: false },
        { id: 'ms-5', title: 'Public Deployment & Pitch slides', completed: false },
      ],
      evaluations: [],
      supportTickets: [],
    };
    
    const updatedTeams = [...teams, newTeam];
    setStoredTeams(updatedTeams);
    
    // Auto-login the leader
    const leader = data.members.find(m => m.isLeader) || data.members[0];
    localStorage.setItem('siet_session', JSON.stringify({
      isLoggedIn: true,
      role: 'participant',
      email: leader.email,
      name: leader.name,
      teamId,
    }));
    
    return newTeam;
  },

  async updateTeam(id: string, data: TeamUpdateRequest): Promise<MockTeam> {
    await mockDelay();
    const teams = getStoredTeams();
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Team not found');
    
    const updated = { ...teams[idx], ...data, updatedAt: new Date().toISOString() };
    const updatedTeams = [...teams];
    updatedTeams[idx] = updated;
    setStoredTeams(updatedTeams);
    return updated;
  },

  async approveTeam(approval: TeamApprovalRequest): Promise<MockTeam> {
    await mockDelay();
    const teams = getStoredTeams();
    const idx = teams.findIndex(t => t.id === approval.teamId);
    if (idx === -1) throw new Error('Team not found');
    
    const updatedTeam = { ...teams[idx], status: approval.action === 'approve' ? 'APPROVED' as TeamStatus : 'REJECTED' as TeamStatus, updatedAt: new Date().toISOString() };
    const updatedTeams = [...teams];
    updatedTeams[idx] = updatedTeam;
    setStoredTeams(updatedTeams);
    
    // Add notification
    notificationService.addNotification({
      userId: updatedTeam.members[0]?.email || '',
      type: 'approval',
      title: approval.action === 'approve' ? 'Team Approved!' : 'Team Registration Rejected',
      body: `Team "${updatedTeam.name}" has been ${approval.action === 'approve' ? 'approved' : 'rejected'}. ${approval.reason || ''}`,
      priority: 'high',
      relatedEntityType: 'team',
      relatedEntityId: updatedTeam.id,
    });
    
    return updatedTeam;
  },

  async updateTeamMembers(teamId: string, members: import('@/types').Participant[]): Promise<MockTeam> {
    await mockDelay();
    return teamService.updateTeam(teamId, { members, size: members.length } as TeamUpdateRequest);
  },

  async checkInTeam(teamId: string, scannedBy: string): Promise<MockTeam> {
    await mockDelay();
    const teams = getStoredTeams();
    const idx = teams.findIndex(t => t.id === teamId);
    if (idx === -1) throw new Error('Team not found');
    
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedTeam = { 
      ...teams[idx], 
      attendance: { teamId, checkedIn: true, checkInTime: now, checkInBy: scannedBy },
      updatedAt: new Date().toISOString()
    };
    const updatedTeams = [...teams];
    updatedTeams[idx] = updatedTeam;
    setStoredTeams(updatedTeams);
    return updatedTeam;
  },

  async deleteTeam(id: string): Promise<void> {
    await mockDelay();
    const teams = getStoredTeams();
    const updated = teams.filter(t => t.id !== id);
    setStoredTeams(updated);
  },
};