"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Team, UserSession, Announcement, Participant, Notification, SupportTicket } from "@/types";
import { INITIAL_TEAMS, INITIAL_ANNOUNCEMENTS, INITIAL_NOTIFICATIONS } from "@/lib/mockData";

interface StateContextType {
  teams: Team[];
  session: UserSession;
  announcements: Announcement[];
  notifications: Notification[];
  // Auth
  login: (email: string, role: "participant" | "admin" | "judge" | "mentor" | "organizer") => boolean;
  logout: () => void;
  // Teams
  registerTeam: (teamData: { name: string; projectDescription: string; members: Participant[] }) => void;
  updateTeamMembers: (teamId: string, members: Participant[]) => void;
  approveTeam: (teamId: string) => void;
  rejectTeam: (teamId: string) => void;
  updateProjectDetails: (teamId: string, details: Partial<Team>) => void;
  evaluateProject: (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; technicalDepth?: number; aiUsage?: number; feedback: string; judgeEmail: string }) => void;
  addMentorFeedback: (teamId: string, feedback: { author: string; feedback: string }) => void;
  updateMilestoneProgress: (teamId: string, milestoneId: string, completed: boolean) => void;
  checkInTeam: (teamId: string, byName: string) => void;
  // Announcements
  addAnnouncement: (title: string, content: string, type: "info" | "warning" | "success") => void;
  // Notifications
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // Support Tickets
  raiseTicket: (ticket: Omit<SupportTicket, "id" | "createdAt" | "status">) => void;
  resolveTicket: (ticketId: string) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [session, setSession] = useState<UserSession>({ isLoggedIn: false, role: null, email: null, teamId: null });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Teams
      const storedTeams = localStorage.getItem("siet_teams_v2");
      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
      } else {
        const enhancedTeams = INITIAL_TEAMS;
        setTeams(enhancedTeams);
        localStorage.setItem("siet_teams_v2", JSON.stringify(enhancedTeams));
      }

      // Session
      const storedSession = localStorage.getItem("siet_session");
      if (storedSession) setSession(JSON.parse(storedSession));

      // Announcements
      const storedAnn = localStorage.getItem("siet_announcements");
      if (storedAnn) {
        setAnnouncements(JSON.parse(storedAnn));
      } else {
        setAnnouncements(INITIAL_ANNOUNCEMENTS);
        localStorage.setItem("siet_announcements", JSON.stringify(INITIAL_ANNOUNCEMENTS));
      }

      // Notifications
      const storedNotifs = localStorage.getItem("siet_notifications_v2");
      if (storedNotifs) {
        setNotifications(JSON.parse(storedNotifs));
      } else {
        setNotifications(INITIAL_NOTIFICATIONS);
        localStorage.setItem("siet_notifications_v2", JSON.stringify(INITIAL_NOTIFICATIONS));
      }

      setInitialized(true);
    }
  }, []);

  useEffect(() => { if (initialized) localStorage.setItem("siet_teams_v2", JSON.stringify(teams)); }, [teams, initialized]);
  useEffect(() => { if (initialized) localStorage.setItem("siet_session", JSON.stringify(session)); }, [session, initialized]);
  useEffect(() => { if (initialized) localStorage.setItem("siet_announcements", JSON.stringify(announcements)); }, [announcements, initialized]);
  useEffect(() => { if (initialized) localStorage.setItem("siet_notifications_v2", JSON.stringify(notifications)); }, [notifications, initialized]);

  const login = (email: string, role: "participant" | "admin" | "judge" | "mentor" | "organizer"): boolean => {
    const names: Record<string, string> = {
      "admin@college.edu": "Admin User",
      "judge@college.edu": "Dr. Priya Rajan",
      "mentor@college.edu": "Dr. A. Rajesh",
      "organizer@college.edu": "Prof. Suresh Kumar",
    };
    if (role === "admin" && email === "admin@college.edu") {
      setSession({ isLoggedIn: true, role: "admin", email, name: names[email] });
      return true;
    }
    if (role === "judge" && email === "judge@college.edu") {
      setSession({ isLoggedIn: true, role: "judge", email, name: names[email] });
      return true;
    }
    if (role === "mentor" && email === "mentor@college.edu") {
      setSession({ isLoggedIn: true, role: "mentor", email, name: names[email] });
      return true;
    }
    if (role === "organizer" && email === "organizer@college.edu") {
      setSession({ isLoggedIn: true, role: "organizer", email, name: names[email] });
      return true;
    }
    if (role === "participant") {
      const team = teams.find((t) => t.members.some((m) => m.email.toLowerCase() === email.toLowerCase()));
      if (team) {
        const member = team.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
        setSession({ isLoggedIn: true, role: "participant", email, name: member?.name, teamId: team.id });
        return true;
      }
    }
    return false;
  };

  const logout = () => setSession({ isLoggedIn: false, role: null, email: null, teamId: null });

  const registerTeam = (teamData: { name: string; projectDescription: string; members: Participant[] }) => {
    const teamNum = 100 + teams.length + 5;
    const prefix = teamData.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamData.name,
      size: teamData.members.length,
      members: teamData.members,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      projectDescription: teamData.projectDescription,
      qrToken: `${prefix}-AI26-${teamNum}-SEC${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      paymentVerified: false,
      facultyApproved: false,
      ideaSubmitted: false,
      shortlisted: false,
      attendance: { teamId: `team-${Date.now()}`, checkedIn: false },
      milestonesProgress: [
        { id: "ms-1", title: "Ideation & Design Diagram", completed: false },
        { id: "ms-2", title: "Database & API Schema Setup", completed: false },
        { id: "ms-3", title: "Core ML/AI Model Integration", completed: false },
        { id: "ms-4", title: "Frontend Dashboard Integration", completed: false },
        { id: "ms-5", title: "Public Deployment & Pitch slides", completed: false },
      ],
      evaluations: [],
      mentorFeedbacks: [],
      supportTickets: [],
    };
    setTeams((prev) => [...prev, newTeam]);
    const leader = teamData.members.find((m) => m.isLeader) || teamData.members[0];
    setSession({ isLoggedIn: true, role: "participant", email: leader.email, name: leader.name, teamId: newTeam.id });
    addNotification({ type: "system", title: "Team Registered", body: `Your team "${teamData.name}" has been submitted for review. You'll be notified once approved.`, priority: "normal" });
  };

  const updateTeamMembers = (teamId: string, members: Participant[]) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, members, size: members.length } : t));
  };

  const approveTeam = (teamId: string) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "APPROVED" as const } : t));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "approval", title: "Team Approved!", body: `Team "${team.name}" has been approved by the organizers.`, priority: "high", relatedTeamId: teamId });
    }
  };

  const rejectTeam = (teamId: string) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "REJECTED" as const } : t));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "action", title: "Team Registration Rejected", body: `Team "${team.name}" registration was rejected. Contact organizers for details.`, priority: "high", relatedTeamId: teamId });
    }
  };

  const updateProjectDetails = (teamId: string, details: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, ...details } : t));
  };

  const evaluateProject = (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; technicalDepth?: number; aiUsage?: number; feedback: string; judgeEmail: string }) => {
    setTeams((prev) => prev.map((t) => {
      if (t.id === teamId) {
        const evals = t.evaluations || [];
        const idx = evals.findIndex((e) => e.judgeEmail === evaluation.judgeEmail);
        const updatedEvals = [...evals];
        if (idx > -1) updatedEvals[idx] = evaluation;
        else updatedEvals.push(evaluation);
        return { ...t, evaluations: updatedEvals };
      }
      return t;
    }));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "judge", title: "New Evaluation Submitted", body: `A judge has submitted scores for your team. Check the Project tab for feedback.`, priority: "normal", relatedTeamId: teamId });
    }
  };

  const addMentorFeedback = (teamId: string, feedback: { author: string; feedback: string }) => {
    setTeams((prev) => prev.map((t) => {
      if (t.id === teamId) {
        const logs = t.mentorFeedbacks || [];
        return { ...t, mentorFeedbacks: [{ author: feedback.author, feedback: feedback.feedback, date: "Just now" }, ...logs] };
      }
      return t;
    }));
    addNotification({ type: "mentor", title: `Mentor Feedback from ${feedback.author}`, body: feedback.feedback.slice(0, 120), priority: "normal", relatedTeamId: teamId });
  };

  const updateMilestoneProgress = (teamId: string, milestoneId: string, completed: boolean) => {
    setTeams((prev) => prev.map((t) => {
      if (t.id === teamId) {
        return { ...t, milestonesProgress: (t.milestonesProgress || []).map((m) => m.id === milestoneId ? { ...m, completed } : m) };
      }
      return t;
    }));
  };

  const checkInTeam = (teamId: string, byName: string) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, attendance: { teamId, checkedIn: true, checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), checkInBy: byName } } : t));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "approval", title: "Attendance Recorded", body: `Team "${team.name}" checked in at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} by ${byName}.`, priority: "normal", relatedTeamId: teamId });
    }
  };

  const addAnnouncement = (title: string, content: string, type: "info" | "warning" | "success") => {
    const newAnn: Announcement = { id: `ann-${Date.now()}`, title, content, type, date: "Just now" };
    setAnnouncements((prev) => [newAnn, ...prev]);
    addNotification({ type: "system", title, body: content, priority: "normal" });
  };

  const addNotification = (n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotif: Notification = { ...n, id: `notif-${Date.now()}`, createdAt: new Date().toISOString(), read: false };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const raiseTicket = (ticket: Omit<SupportTicket, "id" | "createdAt" | "status">) => {
    const newTicket: SupportTicket = { ...ticket, id: `ticket-${Date.now()}`, status: "Open", createdAt: new Date().toISOString() };
    setTeams((prev) => prev.map((t) => t.id === ticket.teamId ? { ...t, supportTickets: [newTicket, ...(t.supportTickets || [])] } : t));
    addNotification({ type: "action", title: `Support Ticket: ${ticket.category}`, body: ticket.description, priority: ticket.priority === "Critical" ? "high" : "normal", relatedTeamId: ticket.teamId });
  };

  const resolveTicket = (ticketId: string) => {
    setTeams((prev) => prev.map((t) => ({ ...t, supportTickets: (t.supportTickets || []).map((tk) => tk.id === ticketId ? { ...tk, status: "Resolved" as const } : tk) })));
  };

  return (
    <StateContext.Provider value={{
      teams, session, announcements, notifications,
      login, logout,
      registerTeam, updateTeamMembers, approveTeam, rejectTeam,
      updateProjectDetails, evaluateProject, addMentorFeedback, updateMilestoneProgress, checkInTeam,
      addAnnouncement,
      addNotification, markNotificationRead, markAllNotificationsRead,
      raiseTicket, resolveTicket,
    }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (context === undefined) throw new Error("useAppState must be used within a StateProvider");
  return context;
}
