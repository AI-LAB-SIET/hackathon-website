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
  submitted?: boolean;
  submittedAt?: string;
  milestonesProgress?: { id: string; title: string; completed: boolean }[];
  evaluations?: { innovation: number; feasibility: number; presentation: number; feedback: string; judgeEmail: string }[];
  mentorFeedbacks?: { author: string; feedback: string; date: string }[];
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

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "General" | "Registration" | "Technical" | "Prizes";
}

export interface UserSession {
  isLoggedIn: boolean;
  role: "participant" | "admin" | "judge" | "mentor" | "organizer" | null;
  email: string | null;
  teamId?: string | null;
}
