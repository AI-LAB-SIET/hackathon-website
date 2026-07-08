// ─── Core Participant ─────────────────────────────────────────────────────────

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

// ─── Hackathon ────────────────────────────────────────────────────────────────

export interface Hackathon {
  id: string;
  name: string;               // "AI Lab Hackathon 2026"
  slug: string;               // "ai-lab-2026" — used in /register?h=slug
  description: string;
  venue?: string;
  startDate: string;          // ISO datetime
  endDate: string;            // ISO datetime
  registrationOpen: boolean;
  maxTeamSize: number;        // default 4
  minTeamSize: number;        // default 1 (solo allowed)
  status: "upcoming" | "active" | "completed" | "archived" | "ended";
  createdAt: string;
  createdBy: string;          // admin email
  registrationLink?: string;  // computed: /register?h=slug
  teamsLocked?: boolean;      // NEW — permanently locks all teams under this hackathon
  problemStatementRevealTime?: string; // ISO datetime for revealing problem statements
  resultsRevealTime?: string; // ISO datetime for revealing results
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  teamId: string;
  checkedIn: boolean;
  checkInTime?: string;
  checkInBy?: string;
}

export interface SupportTicket {
  id: string;
  hackathonId?: string;       // NEW
  teamId?: string;
  teamName?: string;          // Added teamName to SupportTicket
  category: "Internet" | "Power" | "Hardware" | "Food" | "Venue" | "Other" | "General";
  priority: "Low" | "Medium" | "High" | "Critical" | "Normal";
  status: "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed";
  raisedBy: string;
  assignedTo?: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  title?: string;
}

export interface Team {
  id: string;
  hackathonId?: string;       // optional — filled from activeHackathonId on create
  name: string;
  size: number;
  members: Participant[];
  status: "PENDING" | "APPROVED" | "REJECTED" | "DRAFT";
  createdAt: string;
  updatedAt?: string;
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
  // v2 additions
  qrToken?: string;
  paymentVerified?: boolean;

  attendance?: AttendanceRecord;
  supportTickets?: SupportTicket[];
  ideaSubmitted?: boolean;
  shortlisted?: boolean;
  attachments?: FileAttachment[];
}

// ─── Team Requests (join / invite) ───────────────────────────────────────────

export interface TeamRequest {
  id: string;
  hackathonId: string;
  teamId: string;
  teamName: string;
  fromEmail: string;         // who sent it
  fromName: string;
  toEmail: string;           // who receives it
  toName: string;
  direction: "join" | "invite"; // "join" = user→team, "invite" = team→user
  status: "pending" | "accepted" | "rejected";
  message?: string;
  createdAt: string;
  respondedAt?: string;
}

// ─── Food Token System ────────────────────────────────────────────────────────

export interface FoodMeal {
  id: string;
  hackathonId: string;
  name: string;              // "Day 1 — Breakfast"
  type: "breakfast" | "lunch" | "dinner" | "snacks";
  scheduledAt: string;       // ISO datetime
  windowMinutes: number;     // how long the token is valid (e.g. 60)
  createdAt: string;
  createdBy: string;
  totalIssued?: number;      // updated when tokens are bulk-issued
  totalRedeemed?: number;    // updated on each redemption
}

export interface FoodToken {
  id: string;
  hackathonId: string;
  mealId: string;
  mealName: string;
  mealType: FoodMeal["type"];
  scheduledAt: string;
  participantEmail: string;
  participantName: string;
  registerNumber: string;
  teamId?: string;
  teamName?: string;
  status: "issued" | "redeemed" | "expired";
  issuedAt: string;
  redeemedAt?: string;
  redeemedBy?: string;       // email of volunteer/organizer who marked it
  tokenCode: string;         // unique code / QR payload e.g. "FT-abc123"
}

// ─── Other Core Types ─────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "completed" | "ongoing" | "upcoming";
}

export interface Announcement {
  id: string;
  hackathonId?: string | null;      // NEW — null/undefined = global
  title: string;
  content: string;
  type: "info" | "warning" | "success";
  date: string;
}

export interface Notification {
  id: string;
  hackathonId?: string | null;      // NEW
  type: "approval" | "deadline" | "judge" | "action" | "system" | "team_request";
  title: string;
  body: string;
  read: boolean;
  priority: "normal" | "high";
  createdAt: string;
  relatedTeamId?: string | null;
  relatedRequestId?: string | null; // NEW — for team request notifications
  userId?: string;
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
  teamSetupDone?: boolean;
  currentHackathonId?: string | null; // NEW
  profilePicture?: string;
  onboarded?: boolean;               // NEW
}



export interface Volunteer {
  id: string;
  name: string;
  phone?: string;
  email: string;
  assignedArea?: string;
  assignedResponsibilities?: string;
  createdAt: string;
  status?: string;
  assignedTicketsCount?: number;
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
  teamId?: string | null;
  currentHackathonId?: string;     // NEW — participant's selected hackathon
  hackathonIds?: string[];         // NEW — staff assignment: which hackathons they manage
  onboarded?: boolean;             // NEW
  // Compatibility fields
  uid?: string;
  displayName?: string;
  phone?: string;
  college?: string;
  department?: string;
  year?: string;
  registerNumber?: string;
  teamSetupDone?: boolean;
  assignedArea?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  uploadedAt: string;
}

export interface TemplateResource {
  id: string;
  hackathonId?: string;
  title: string;
  description: string;
  attachments?: FileAttachment[];
  createdAt: string;
  uploadedBy?: string;
}

export interface ProblemStatement {
  id: string;
  hackathonId?: string;            // optional — StateProvider fills from activeHackathonId
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  attachments?: FileAttachment[];
}

export type Ticket = SupportTicket;

declare module "mammoth" {
  export function convertToHtml(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string; messages: any[] }>;
}
