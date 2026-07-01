import { Participant } from '@/types';

export interface Team {
  id: string;
  name: string;
  size: number;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
  projectDescription?: string;
  githubUrl?: string;
  videoUrl?: string;
  demoUrl?: string;
  aiDisclosure?: string;
  problemStatementId?: string;
  submitted?: boolean;
  submittedAt?: string;
  qrToken?: string;
  paymentVerified?: boolean;
  facultyApproved?: boolean;
  attendance?: AttendanceRecord;
  supportTickets?: SupportTicket[];
  ideaSubmitted?: boolean;
  shortlisted?: boolean;
  milestonesProgress?: MilestoneProgress[];
  evaluations?: Evaluation[];
  members: Participant[];
}

export type TeamStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';

export interface AttendanceRecord {
  teamId: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkInBy?: string;
  checkOutTime?: string;
  checkOutBy?: string;
}

export interface SupportTicket {
  id: string;
  teamId: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  raisedBy: string;
  assignedTo?: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolution?: string;
}

export type TicketCategory = 'Internet' | 'Power' | 'Hardware' | 'Food' | 'Venue' | 'Other' | 'Mentor Needed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface MilestoneProgress {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Evaluation {
  innovation: number;
  feasibility: number;
  presentation: number;
  technicalDepth?: number;
  aiUsage?: number;
  feedback: string;
  judgeEmail: string;
  evaluatedAt: string;
}

export interface TeamRegistrationRequest {
  name: string;
  projectDescription: string;
  problemStatementId: string;
  members: Participant[];
}

export interface TeamUpdateRequest {
  name?: string;
  projectDescription?: string;
  githubUrl?: string;
  videoUrl?: string;
  demoUrl?: string;
  aiDisclosure?: string;
  problemStatementId?: string;
  members?: Participant[];
}

export interface TeamApprovalRequest {
  teamId: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface TeamFilters {
  status?: TeamStatus;
  problemStatementId?: string;
  department?: string;
  size?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'status';
  sortOrder?: 'asc' | 'desc';
}