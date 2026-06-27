export interface Participant {
  name: string;
  registerNumber: string;
  email: string;
  phone: string;
  department: string;
  year: string;
  skills: string[];
  github?: string;
  isLeader?: boolean;
}

export interface AttendanceRecord {
  teamId: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkInBy?: string;
}

export interface SupportTicket {
  id: string;
  teamId: string;
  category: "Internet" | "Power" | "Mentor Needed" | "Hardware" | "Food" | "Venue" | "Other";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed";
  raisedBy: string;
  assignedTo?: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Team {
  id: string;
  name: string;
  size: number;
  members: Participant[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  projectDescription?: string;
  githubUrl?: string;
  videoUrl?: string;
  demoUrl?: string;
  aiDisclosure?: string;
  problemStatementId?: string;
  submitted?: boolean;
  submittedAt?: string;
  milestonesProgress?: { id: string; title: string; completed: boolean }[];
  evaluations?: {
    innovation: number;
    feasibility: number;
    presentation: number;
    technicalDepth?: number;
    aiUsage?: number;
    feedback: string;
    judgeEmail: string;
  }[];
  mentorFeedbacks?: { author: string; feedback: string; date: string }[];
  // v2 additions
  qrToken?: string;
  trackId?: string;
  paymentVerified?: boolean;
  facultyApproved?: boolean;
  attendance?: AttendanceRecord;
  supportTickets?: SupportTicket[];
  ideaSubmitted?: boolean;
  shortlisted?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "completed" | "ongoing" | "upcoming";
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "success";
  date: string;
}

export interface Notification {
  id: string;
  type: "approval" | "deadline" | "mentor" | "judge" | "action" | "system";
  title: string;
  body: string;
  read: boolean;
  priority: "normal" | "high";
  createdAt: string;
  relatedTeamId?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Registration" | "Technical" | "Prizes";
}

export interface UserSession {
  isLoggedIn: boolean;
  role: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null;
  email: string | null;
  name?: string | null;
  teamId?: string | null;
  profilePicture?: string;
}

export interface HackTrack {
  id: string;
  label: string;
  color: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedArea: string;
  assignedResponsibilities: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  bio?: string;
  skills?: string[];
  socialLinks?: { platform: string; url: string }[];
  role: "participant" | "admin" | "judge" | "organizer" | "volunteer";
  teamId?: string;
}

export interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  trackId: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
}

export type Ticket = SupportTicket;
