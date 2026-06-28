"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Team, UserSession, Announcement, Participant, Notification, SupportTicket, Volunteer, UserProfile, ProblemStatement, Ticket } from "@/types";
import { INITIAL_TEAMS, INITIAL_ANNOUNCEMENTS, INITIAL_NOTIFICATIONS, INITIAL_VOLUNTEERS } from "@/lib/mockData";

interface StateContextType {
  teams: Team[];
  session: UserSession;
  announcements: Announcement[];
  notifications: Notification[];
  volunteers: Volunteer[];
  userProfiles: UserProfile[];
  problemStatements: ProblemStatement[];
  tickets: Ticket[];
  // Auth
  login: (email: string, role: "participant" | "admin" | "judge" | "organizer" | "volunteer") => boolean;
  logout: () => void;
  // Teams
  registerTeam: (teamData: { name: string; projectDescription: string; members: Participant[] }) => void;
  updateTeamMembers: (teamId: string, members: Participant[]) => void;
  approveTeam: (teamId: string) => void;
  rejectTeam: (teamId: string) => void;
  updateProjectDetails: (teamId: string, details: Partial<Team>) => void;
  evaluateProject: (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; technicalDepth?: number; aiUsage?: number; feedback: string; judgeEmail: string }) => void;
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
  // Volunteers
  addVolunteer: (v: Omit<Volunteer, "id" | "createdAt">) => void;
  updateVolunteer: (id: string, data: Partial<Volunteer>) => void;
  removeVolunteer: (id: string) => void;
  // Profiles
  updateProfile: (email: string, data: Partial<UserProfile>) => void;
  getProfile: (email: string) => UserProfile | undefined;
  // Problem Statements
  addProblemStatement: (ps: Omit<ProblemStatement, "id" | "createdAt">) => void;
  updateProblemStatement: (id: string, data: Partial<ProblemStatement>) => void;
  archiveProblemStatement: (id: string) => void;
  // Tickets (top-level)
  createTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "status">) => void;
  assignTicket: (ticketId: string, volunteerEmail: string) => void;
  updateTicketStatus: (ticketId: string, status: Ticket["status"]) => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [session, setSession] = useState<UserSession>({ isLoggedIn: false, role: null, email: null, teamId: null });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [initialized, setInitialized] = useState(false);

  const volunteersRef = useRef(volunteers);
  const teamsRef = useRef(teams);
  useEffect(() => { volunteersRef.current = volunteers; }, [volunteers]);
  useEffect(() => { teamsRef.current = teams; }, [teams]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Teams
      try {
        const storedTeams = localStorage.getItem("siet_teams_v2");
        if (storedTeams) {
          setTeams(JSON.parse(storedTeams));
        } else {
          const enhancedTeams = INITIAL_TEAMS;
          setTeams(enhancedTeams);
          localStorage.setItem("siet_teams_v2", JSON.stringify(enhancedTeams));
        }
      } catch { setTeams(INITIAL_TEAMS); }

      // Session
      try {
        const storedSession = localStorage.getItem("siet_session");
        if (storedSession) setSession(JSON.parse(storedSession));
      } catch { /* keep default session */ }

      // Announcements
      try {
        const storedAnn = localStorage.getItem("siet_announcements");
        if (storedAnn) {
          setAnnouncements(JSON.parse(storedAnn));
        } else {
          setAnnouncements(INITIAL_ANNOUNCEMENTS);
          localStorage.setItem("siet_announcements", JSON.stringify(INITIAL_ANNOUNCEMENTS));
        }
      } catch { setAnnouncements(INITIAL_ANNOUNCEMENTS); }

      // Notifications
      try {
        const storedNotifs = localStorage.getItem("siet_notifications_v2");
        if (storedNotifs) {
          setNotifications(JSON.parse(storedNotifs));
        } else {
          setNotifications(INITIAL_NOTIFICATIONS);
          localStorage.setItem("siet_notifications_v2", JSON.stringify(INITIAL_NOTIFICATIONS));
        }
      } catch { setNotifications(INITIAL_NOTIFICATIONS); }

      // Volunteers
      try {
        const storedVolunteers = localStorage.getItem("siet_volunteers");
        const parsed = storedVolunteers ? JSON.parse(storedVolunteers) : [];
        if (parsed && parsed.length > 0) {
          setVolunteers(parsed);
        } else {
          setVolunteers(INITIAL_VOLUNTEERS);
          localStorage.setItem("siet_volunteers", JSON.stringify(INITIAL_VOLUNTEERS));
        }
      } catch { setVolunteers(INITIAL_VOLUNTEERS); }

      // User Profiles
      try {
        const storedProfiles = localStorage.getItem("siet_profiles");
        if (storedProfiles) {
          setUserProfiles(JSON.parse(storedProfiles));
        }
      } catch { /* keep empty */ }

      // Problem Statements
      try {
        const storedProblems = localStorage.getItem("siet_problems");
        if (storedProblems) {
          setProblemStatements(JSON.parse(storedProblems));
        }
      } catch { /* keep empty */ }

      // Tickets
      try {
        const storedTickets = localStorage.getItem("siet_tickets");
        if (storedTickets) {
          setTickets(JSON.parse(storedTickets));
        }
      } catch { /* keep empty */ }

      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const timeout = setTimeout(() => {
      localStorage.setItem("siet_teams_v2", JSON.stringify(teams));
      localStorage.setItem("siet_session", JSON.stringify(session));
      localStorage.setItem("siet_announcements", JSON.stringify(announcements));
      localStorage.setItem("siet_notifications_v2", JSON.stringify(notifications));
      localStorage.setItem("siet_volunteers", JSON.stringify(volunteers));
      localStorage.setItem("siet_profiles", JSON.stringify(userProfiles));
      localStorage.setItem("siet_problems", JSON.stringify(problemStatements));
      localStorage.setItem("siet_tickets", JSON.stringify(tickets));
    }, 300);
    return () => clearTimeout(timeout);
  }, [teams, session, announcements, notifications, volunteers, userProfiles, problemStatements, tickets, initialized]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotif: Notification = { ...n, id: `notif-${Date.now()}`, createdAt: new Date().toISOString(), read: false };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const login = useCallback((email: string, role: "participant" | "admin" | "judge" | "organizer" | "volunteer"): boolean => {
    const names: Record<string, string> = {
      "admin@college.edu": "Admin User",
      "judge@college.edu": "Dr. Priya Rajan",
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
    if (role === "organizer" && email === "organizer@college.edu") {
      setSession({ isLoggedIn: true, role: "organizer", email, name: names[email] });
      return true;
    }
    if (role === "volunteer") {
      const vol = volunteersRef.current.find((v) => v.email.toLowerCase() === email.toLowerCase());
      if (vol) {
        setSession({ isLoggedIn: true, role: "volunteer", email, name: vol.name });
        return true;
      }
    }
    if (role === "participant") {
      const team = teamsRef.current.find((t) => t.members.some((m) => m.email.toLowerCase() === email.toLowerCase()));
      if (team) {
        const member = team.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
        setSession({ isLoggedIn: true, role: "participant", email, name: member?.name, teamId: team.id });
        return true;
      }
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setSession({ isLoggedIn: false, role: null, email: null, teamId: null });
  }, []);

  const registerTeam = useCallback((teamData: { name: string; projectDescription: string; members: Participant[] }) => {
    const teamId = `team-${Date.now()}`;
    const prefix = teamData.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const teamNum = 100 + teams.length + 5;
    const newTeam: Team = {
      id: teamId,
      name: teamData.name,
      size: teamData.members.length,
      members: teamData.members,
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      projectDescription: teamData.projectDescription,
      qrToken: `${prefix}-AI26-${teamNum}-SEC${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      paymentVerified: false,
      facultyApproved: false,
      ideaSubmitted: false,
      shortlisted: false,
      attendance: { teamId, checkedIn: false },
      milestonesProgress: [
        { id: "ms-1", title: "Ideation & Design Diagram", completed: false },
        { id: "ms-2", title: "Database & API Schema Setup", completed: false },
        { id: "ms-3", title: "Core ML/AI Model Integration", completed: false },
        { id: "ms-4", title: "Frontend Dashboard Integration", completed: false },
        { id: "ms-5", title: "Public Deployment & Pitch slides", completed: false },
      ],
      evaluations: [],
      supportTickets: [],
    };
    setTeams((prev) => [...prev, newTeam]);
    const leader = teamData.members.find((m) => m.isLeader) || teamData.members[0];
    setSession({ isLoggedIn: true, role: "participant", email: leader.email, name: leader.name, teamId });
    addNotification({ type: "system", title: "Team Registered", body: `Your team "${teamData.name}" has been registered successfully. Welcome to AI Hack Lab 2026!`, priority: "high" });
  }, [teams.length, addNotification]);

  const updateTeamMembers = useCallback((teamId: string, members: Participant[]) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, members, size: members.length } : t));
  }, []);

  const approveTeam = useCallback((teamId: string) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "APPROVED" as const } : t));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "approval", title: "Team Approved!", body: `Team "${team.name}" has been approved by the organizers.`, priority: "high", relatedTeamId: teamId });
    }
  }, [teams, addNotification]);

  const rejectTeam = useCallback((teamId: string) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "REJECTED" as const } : t));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "action", title: "Team Registration Rejected", body: `Team "${team.name}" registration was rejected. Contact organizers for details.`, priority: "high", relatedTeamId: teamId });
    }
  }, [teams, addNotification]);

  const updateProjectDetails = useCallback((teamId: string, details: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, ...details } : t));
  }, []);

  const evaluateProject = useCallback((teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; technicalDepth?: number; aiUsage?: number; feedback: string; judgeEmail: string }) => {
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
  }, [teams, addNotification]);

  const updateMilestoneProgress = useCallback((teamId: string, milestoneId: string, completed: boolean) => {
    setTeams((prev) => prev.map((t) => {
      if (t.id === teamId) {
        return { ...t, milestonesProgress: (t.milestonesProgress || []).map((m) => m.id === milestoneId ? { ...m, completed } : m) };
      }
      return t;
    }));
  }, []);

  const checkInTeam = useCallback((teamId: string, byName: string) => {
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, attendance: { teamId, checkedIn: true, checkInTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), checkInBy: byName } } : t));
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      addNotification({ type: "approval", title: "Attendance Recorded", body: `Team "${team.name}" checked in at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} by ${byName}.`, priority: "normal", relatedTeamId: teamId });
    }
  }, [teams, addNotification]);

  const addAnnouncement = useCallback((title: string, content: string, type: "info" | "warning" | "success") => {
    const newAnn: Announcement = { id: `ann-${Date.now()}`, title, content, type, date: "Just now" };
    setAnnouncements((prev) => [newAnn, ...prev]);
    addNotification({ type: "system", title, body: content, priority: "normal" });
  }, [addNotification]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const raiseTicket = useCallback((ticket: Omit<SupportTicket, "id" | "createdAt" | "status">) => {
    const newTicket: SupportTicket = { ...ticket, id: `sticket-${Date.now()}`, status: "Open", createdAt: new Date().toISOString() };
    setTeams((prev) => prev.map((t) => t.id === ticket.teamId ? { ...t, supportTickets: [newTicket, ...(t.supportTickets || [])] } : t));
    addNotification({ type: "action", title: `Support Ticket: ${ticket.category}`, body: ticket.description, priority: ticket.priority === "Critical" ? "high" : "normal", relatedTeamId: ticket.teamId });
  }, [addNotification]);

  const resolveTicket = useCallback((ticketId: string) => {
    setTeams((prev) => prev.map((t) => ({ ...t, supportTickets: (t.supportTickets || []).map((tk) => tk.id === ticketId ? { ...tk, status: "Resolved" as const } : tk) })));
  }, []);

  const addVolunteer = useCallback((v: Omit<Volunteer, "id" | "createdAt">) => {
    const newVol: Volunteer = { ...v, id: `vol-${Date.now()}`, createdAt: new Date().toISOString() };
    setVolunteers((prev) => [...prev, newVol]);
  }, []);

  const updateVolunteer = useCallback((id: string, data: Partial<Volunteer>) => {
    setVolunteers((prev) => prev.map((v) => v.id === id ? { ...v, ...data } : v));
  }, []);

  const removeVolunteer = useCallback((id: string) => {
    setVolunteers((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const updateProfile = useCallback((email: string, data: Partial<UserProfile>) => {
    setUserProfiles((prev) => {
      const idx = prev.findIndex((p) => p.email.toLowerCase() === email.toLowerCase());
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...data };
        return updated;
      }
      return prev;
    });
  }, []);

  const getProfile = useCallback((email: string): UserProfile | undefined => {
    return userProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }, [userProfiles]);

  const addProblemStatement = useCallback((ps: Omit<ProblemStatement, "id" | "createdAt">) => {
    const newPs: ProblemStatement = { ...ps, id: `ps-${Date.now()}`, createdAt: new Date().toISOString() };
    setProblemStatements((prev) => [...prev, newPs]);
  }, []);

  const updateProblemStatement = useCallback((id: string, data: Partial<ProblemStatement>) => {
    setProblemStatements((prev) => prev.map((ps) => ps.id === id ? { ...ps, ...data } : ps));
  }, []);

  const archiveProblemStatement = useCallback((id: string) => {
    setProblemStatements((prev) => prev.map((ps) => ps.id === id ? { ...ps, status: "archived" as const } : ps));
  }, []);

  const createTicket = useCallback((ticket: Omit<Ticket, "id" | "createdAt" | "status">) => {
    const newTicket: Ticket = { ...ticket, id: `ticket-${Date.now()}`, status: "Open" as const, createdAt: new Date().toISOString() };
    setTickets((prev) => [...prev, newTicket]);
    addNotification({ type: "action", title: `New Ticket: ${ticket.category}`, body: ticket.description, priority: ticket.priority === "Critical" ? "high" : "normal" });
  }, [addNotification]);

  const assignTicket = useCallback((ticketId: string, volunteerEmail: string) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, assignedTo: volunteerEmail, status: "Assigned" as const, updatedAt: new Date().toISOString() } : t));
  }, []);

  const updateTicketStatus = useCallback((ticketId: string, status: Ticket["status"]) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
  }, []);

  const value = useMemo(() => ({
    teams, session, announcements, notifications,
    volunteers, userProfiles, problemStatements, tickets,
    login, logout,
    registerTeam, updateTeamMembers, approveTeam, rejectTeam,
    updateProjectDetails, evaluateProject, updateMilestoneProgress, checkInTeam,
    addAnnouncement,
    addNotification, markNotificationRead, markAllNotificationsRead,
    raiseTicket, resolveTicket,
    addVolunteer, updateVolunteer, removeVolunteer,
    updateProfile, getProfile,
    addProblemStatement, updateProblemStatement, archiveProblemStatement,
    createTicket, assignTicket, updateTicketStatus,
  }), [teams, session, announcements, notifications, volunteers, userProfiles, problemStatements, tickets,
    login, logout, registerTeam, updateTeamMembers, approveTeam, rejectTeam,
    updateProjectDetails, evaluateProject, updateMilestoneProgress, checkInTeam,
    addAnnouncement, addNotification, markNotificationRead, markAllNotificationsRead,
    raiseTicket, resolveTicket, addVolunteer, updateVolunteer, removeVolunteer,
    updateProfile, getProfile, addProblemStatement, updateProblemStatement, archiveProblemStatement,
    createTicket, assignTicket, updateTicketStatus]);

  return (
    <StateContext.Provider value={value}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (context === undefined) throw new Error("useAppState must be used within a StateProvider");
  return context;
}
