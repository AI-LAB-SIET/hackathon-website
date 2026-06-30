"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Team, UserSession, Announcement, Participant, Notification, SupportTicket, Volunteer, UserProfile, ProblemStatement, Ticket } from "@/types";
import { INITIAL_TEAMS, INITIAL_ANNOUNCEMENTS, INITIAL_NOTIFICATIONS, INITIAL_VOLUNTEERS } from "@/lib/mockData";
import { db as rawDb, auth as rawAuth, isConfigured } from "@/lib/firebase";
import { Firestore } from "firebase/firestore";
import { Auth } from "firebase/auth";

const db = rawDb as Firestore;
const auth = rawAuth as Auth;
import {
  onSnapshot,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

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
  login: (email: string, role?: "participant" | "admin" | "judge" | "organizer" | "volunteer") => { success: boolean; role?: "participant" | "admin" | "judge" | "organizer" | "volunteer" };
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
  removeAnnouncement: (id: string) => void;
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

function setSessionCookie(sessionData: UserSession) {
  if (typeof window !== "undefined") {
    document.cookie = `siet_session=${encodeURIComponent(JSON.stringify(sessionData))}; path=/; max-age=86400; SameSite=Lax`;
  }
}

function clearSessionCookie() {
  if (typeof window !== "undefined") {
    document.cookie = "siet_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }
}

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

  // ── 1. Real-time Firebase listeners ─────────────────────────────────────────
  useEffect(() => {
    const loadLocalData = () => {
      if (typeof window === "undefined") return;
      try {
        const storedTeams = localStorage.getItem("siet_teams_v2");
        setTeams(storedTeams ? JSON.parse(storedTeams) : INITIAL_TEAMS);
      } catch { setTeams(INITIAL_TEAMS); }
      try {
        const storedSession = localStorage.getItem("siet_session");
        if (storedSession) setSession(JSON.parse(storedSession));
      } catch { /* skip */ }
      try {
        const storedAnn = localStorage.getItem("siet_announcements");
        setAnnouncements(storedAnn ? JSON.parse(storedAnn) : INITIAL_ANNOUNCEMENTS);
      } catch { setAnnouncements(INITIAL_ANNOUNCEMENTS); }
      try {
        const storedNotifs = localStorage.getItem("siet_notifications_v2");
        setNotifications(storedNotifs ? JSON.parse(storedNotifs) : INITIAL_NOTIFICATIONS);
      } catch { setNotifications(INITIAL_NOTIFICATIONS); }
      try {
        const storedVolunteers = localStorage.getItem("siet_volunteers");
        setVolunteers(storedVolunteers ? JSON.parse(storedVolunteers) : INITIAL_VOLUNTEERS);
      } catch { setVolunteers(INITIAL_VOLUNTEERS); }
      try {
        const storedProfiles = localStorage.getItem("siet_profiles");
        if (storedProfiles) setUserProfiles(JSON.parse(storedProfiles));
      } catch { /* skip */ }
      try {
        const storedProblems = localStorage.getItem("siet_problems");
        if (storedProblems) setProblemStatements(JSON.parse(storedProblems));
      } catch { /* skip */ }
      try {
        const storedTickets = localStorage.getItem("siet_tickets");
        if (storedTickets) setTickets(JSON.parse(storedTickets));
      } catch { /* skip */ }
      setInitialized(true);
    };

    if (!isConfigured || !db || !auth) {
      loadLocalData();
      return;
    }

    const firestore = db;
    const firebaseAuth = auth;
    let firebaseFailed = false;

    const fallbackWithMock = () => {
      firebaseFailed = true;
      try { unsubAnn?.(); } catch {}
      try { unsubProblems?.(); } catch {}
      try { unsubAuth?.(); } catch {}
      cleanupActiveListeners();
      loadLocalData();
    };

    let unsubUsers: (() => void) | null = null;
    let unsubTeams: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;
    let unsubTickets: (() => void) | null = null;
    let unsubVols: (() => void) | null = null;

    const cleanupActiveListeners = () => {
      if (unsubUsers) { unsubUsers(); unsubUsers = null; }
      if (unsubTeams) { unsubTeams(); unsubTeams = null; }
      if (unsubNotifs) { unsubNotifs(); unsubNotifs = null; }
      if (unsubTickets) { unsubTickets(); unsubTickets = null; }
      if (unsubVols) { unsubVols(); unsubVols = null; }
    };

    let unsubAnn: (() => void) | null = null;
    let unsubProblems: (() => void) | null = null;
    let unsubAuth: (() => void) | null = null;

    unsubAnn = onSnapshot(collection(firestore, "announcements"), (snap) => {
      const list: Announcement[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title ?? "",
          content: data.content ?? "",
          type: data.type ?? "info",
          date: data.date ?? "Just now"
        });
      });
      setAnnouncements(list);
    }, (err) => {
      console.warn("Firestore announcements error, using mock data:", err.message);
      fallbackWithMock();
    });

    unsubProblems = onSnapshot(collection(firestore, "problemStatements"), (snap) => {
      const list: ProblemStatement[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          title: data.title ?? "",
          description: data.description ?? "",
          trackId: data.trackId ?? "",
          status: data.status ?? "draft",
          createdAt: data.createdAt ?? new Date().toISOString(),
          attachments: data.attachments ?? [],
        });
      });
      setProblemStatements(list);
    }, (err) => {
      console.warn("Firestore problemStatements error, using mock data:", err.message);
      fallbackWithMock();
    });

    // Subscribe to Auth state changes
    unsubAuth = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      cleanupActiveListeners();

      if (firebaseUser && !firebaseFailed) {
        try {
          const userDocRef = doc(firestore, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          let role: "participant" | "admin" | "judge" | "organizer" | "volunteer" = "participant";
          let teamId: string | null = null;
          let displayName = firebaseUser.displayName ?? "New User";

          if (userSnap.exists()) {
            const userData = userSnap.data();
            role = userData.role ?? "participant";
            teamId = userData.teamId ?? null;
            displayName = userData.displayName ?? displayName;
          }

          setSession({ isLoggedIn: true, role, email: firebaseUser.email, name: displayName, teamId });
          setSessionCookie({ isLoggedIn: true, role, email: firebaseUser.email, name: displayName, teamId });

          // Start listeners now that we are logged in
          unsubTeams = onSnapshot(collection(firestore, "teams"), (snap) => {
            const list: Team[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Team));
            setTeams(list);
          }, (err) => console.warn("Teams sync error:", err));

          unsubTickets = onSnapshot(collection(firestore, "tickets"), (snap) => {
            const list: Ticket[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Ticket));
            setTickets(list);
          }, (err) => console.warn("Tickets sync error:", err));

          unsubNotifs = onSnapshot(collection(firestore, "notifications"), (snap) => {
            const list: Notification[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Notification));
            setNotifications(list);
          }, (err) => console.warn("Notifications sync error:", err));

          if (role === "admin" || role === "organizer") {
            unsubUsers = onSnapshot(collection(firestore, "users"), (snap) => {
              const allProfiles: UserProfile[] = [];
              const vols: Volunteer[] = [];
              snap.forEach((d) => {
                const data = d.data();
                allProfiles.push({ id: d.id, ...data, email: data.email || "" } as unknown as UserProfile);
                if (data.role === "volunteer") {
                  vols.push({ id: d.id, name: data.displayName || "", email: data.email || "", status: data.status || "active", assignedTicketsCount: 0, createdAt: data.createdAt || "" } as Volunteer);
                }
              });
              setUserProfiles(allProfiles);
              setVolunteers(vols);
            }, (err) => console.warn("Users sync error:", err));
          }

        } catch (err) {
          console.warn("Firestore user profile fetch failed:", err);
        }
      } else if (!firebaseUser && !firebaseFailed) {
        cleanupActiveListeners();
        setSession({ isLoggedIn: false, role: null, email: null, teamId: null });
        clearSessionCookie();
        setTeams([]);
        setNotifications([]);
        setTickets([]);
        setVolunteers([]);
      }
      setInitialized(true);
    });

    return () => {
      unsubAnn();
      unsubProblems();
      unsubAuth();
      cleanupActiveListeners();
    };
  }, []);

  // Sync data for local Admin who bypassed Firebase Auth
  useEffect(() => {
    if (!isConfigured || !db || session.role !== "admin") return;
    
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => {
      const list: Team[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Team));
      setTeams(list);
    });

    const unsubTickets = onSnapshot(collection(db, "tickets"), (snap) => {
      const list: Ticket[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Ticket));
      setTickets(list);
    });

    const unsubNotifs = onSnapshot(collection(db, "notifications"), (snap) => {
      const list: Notification[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Notification));
      setNotifications(list);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const allProfiles: UserProfile[] = [];
      const vols: Volunteer[] = [];
      snap.forEach((d) => {
        const data = d.data();
        allProfiles.push({ id: d.id, ...data, email: data.email || "" } as unknown as UserProfile);
        if (data.role === "volunteer") {
          vols.push({ id: d.id, name: data.displayName || "", email: data.email || "", status: data.status || "active", assignedTicketsCount: 0, createdAt: data.createdAt || "" } as Volunteer);
        }
      });
      setUserProfiles(allProfiles);
      setVolunteers(vols);
    });

    return () => {
      unsubTeams();
      unsubTickets();
      unsubNotifs();
      unsubUsers();
    };
  }, [session.role]);

  // ── 2. Local persistence ──────────────────────────────────────────────────
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

  // ── 3. Actions & Operations ──────────────────────────────────────────────────

  const addNotification = useCallback(async (n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotif = {
      userId: n.userId || session.email || "",
      type: n.type,
      title: n.title,
      body: n.body,
      read: false,
      createdAt: new Date().toISOString(),
      priority: n.priority ?? "normal",
      relatedTeamId: n.relatedTeamId || null
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "notifications"), newNotif);
    } else {
      setNotifications((prev) => [
        { ...newNotif, id: `notif-${Date.now()}` },
        ...prev
      ]);
    }
  }, [session.email]);

  const login = useCallback((email: string, roleInput?: "participant" | "admin" | "judge" | "organizer" | "volunteer"): { success: boolean; role?: "participant" | "admin" | "judge" | "organizer" | "volunteer" } => {
    let resolvedRole: "participant" | "admin" | "judge" | "organizer" | "volunteer" | null = roleInput ?? null;

    if (isConfigured) {
      if (resolvedRole === "admin") {
        const newSession = { isLoggedIn: true, role: "admin" as const, email: "admin@hacklab.internal", name: "System Admin", teamId: null };
        setSession(newSession);
        setSessionCookie(newSession);
        return { success: true, role: "admin" };
      }
      return { success: true, role: resolvedRole ?? "participant" };
    }

    const names: Record<string, string> = {
      "admin@college.edu": "Admin User",
      "judge@college.edu": "Dr. Priya Rajan",
      "organizer@college.edu": "Prof. Suresh Kumar",
    };

    // Auto-resolve role based on email if not specified
    if (!resolvedRole) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower === "admin@college.edu" || emailLower === "admin2727") {
        resolvedRole = "admin";
      } else if (emailLower === "judge@college.edu") {
        resolvedRole = "judge";
      } else if (emailLower === "organizer@college.edu") {
        resolvedRole = "organizer";
      } else {
        // Check in volunteer list
        const vol = volunteersRef.current.find((v) => v.email.toLowerCase() === emailLower);
        if (vol) {
          resolvedRole = "volunteer";
        } else {
          // Check in teams members list
          const team = teamsRef.current.find((t) => t.members.some((m) => m.email.toLowerCase() === emailLower));
          if (team) {
            resolvedRole = "participant";
          } else {
            // Check in loaded user profiles
            const profile = userProfiles.find((p) => (p.email || "").toLowerCase() === emailLower);
            if (profile) {
              resolvedRole = profile.role;
            }
          }
        }
      }
    }

    if (!resolvedRole) {
      resolvedRole = "participant"; // Default fallback
    }

    let matched = false;
    let name = "Demo User";
    let tId: string | null = null;

    if (resolvedRole === "admin") {
      matched = true;
      name = names[email] ?? "System Admin";
    } else if (resolvedRole === "judge") {
      matched = true;
      name = names[email] ?? "Dr. Priya Rajan";
    } else if (resolvedRole === "organizer") {
      matched = true;
      name = names[email] ?? "Prof. Suresh Kumar";
    } else if (resolvedRole === "volunteer") {
      const vol = volunteersRef.current.find((v) => v.email.toLowerCase() === email.toLowerCase());
      if (vol) {
        matched = true;
        name = vol.name;
      }
    } else if (resolvedRole === "participant") {
      const team = teamsRef.current.find((t) => t.members.some((m) => m.email.toLowerCase() === email.toLowerCase()));
      if (team) {
        matched = true;
        const member = team.members.find((m) => m.email.toLowerCase() === email.toLowerCase());
        name = member?.name ?? name;
        tId = team.id;
      } else {
        matched = true;
        name = email.split("@")[0];
      }
    }

    if (matched) {
      const newSession = { isLoggedIn: true, role: resolvedRole, email, name, teamId: tId };
      setSession(newSession);
      setSessionCookie(newSession);
      return { success: true, role: resolvedRole };
    }
    return { success: false };
  }, [userProfiles]);

  const logout = useCallback(async () => {
    if (isConfigured && auth) {
      await auth.signOut();
    }
    setSession({ isLoggedIn: false, role: null, email: null, teamId: null });
    clearSessionCookie();
  }, []);

  const registerTeam = useCallback(async (teamData: { name: string; projectDescription: string; members: Participant[] }) => {
    const teamId = `team-${Date.now()}`;
    const prefix = teamData.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const teamNum = 100 + teamsRef.current.length + 5;
    const qrToken = `${prefix}-AI26-${teamNum}-SEC${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newTeam: Team = {
      id: teamId,
      name: teamData.name,
      size: teamData.members.length,
      members: teamData.members,
      status: "APPROVED",
      createdAt: new Date().toISOString(),
      projectDescription: teamData.projectDescription,
      qrToken,
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

    if (isConfigured && db && auth?.currentUser) {
      const batch = writeBatch(db);
      // Create team document
      batch.set(doc(db, "teams", teamId), newTeam);
      // Link user to the team
      batch.update(doc(db, "users", auth.currentUser.uid), { teamId });
      await batch.commit();
    } else {
      setTeams((prev) => [...prev, newTeam]);
      const leader = teamData.members.find((m) => m.isLeader) || teamData.members[0];
      const newSession = { isLoggedIn: true, role: "participant" as const, email: leader.email, name: leader.name, teamId };
      setSession(newSession);
      setSessionCookie(newSession);
    }

    addNotification({
      userId: session.email || "",
      type: "system",
      title: "Team Registered",
      body: `Your team "${teamData.name}" has been registered successfully. Welcome to AI Hack Lab 2026!`,
      priority: "high"
    });
  }, [addNotification, session.email]);

  const updateTeamMembers = useCallback(async (teamId: string, members: Participant[]) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), { members, size: members.length });
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, members, size: members.length } : t));
    }
  }, []);

  const approveTeam = useCallback(async (teamId: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), { status: "APPROVED" });
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "APPROVED" as const } : t));
    }

    const team = teamsRef.current.find((t) => t.id === teamId);
    if (team) {
      addNotification({
        userId: team.members[0]?.email || "",
        type: "approval",
        title: "Team Approved!",
        body: `Team "${team.name}" has been approved by the organizers.`,
        priority: "high",
        relatedTeamId: teamId
      });
    }
  }, [addNotification]);

  const rejectTeam = useCallback(async (teamId: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), { status: "REJECTED" });
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "REJECTED" as const } : t));
    }

    const team = teamsRef.current.find((t) => t.id === teamId);
    if (team) {
      addNotification({
        userId: team.members[0]?.email || "",
        type: "action",
        title: "Team Registration Rejected",
        body: `Team "${team.name}" registration was rejected. Contact organizers for details.`,
        priority: "high",
        relatedTeamId: teamId
      });
    }
  }, [addNotification]);

  const updateProjectDetails = useCallback(async (teamId: string, details: Partial<Team>) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), details);
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, ...details } : t));
    }
  }, []);

  const evaluateProject = useCallback(async (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; technicalDepth?: number; aiUsage?: number; feedback: string; judgeEmail: string }) => {
    if (isConfigured && db) {
      const evaluationId = `${teamId}_${evaluation.judgeEmail.replace(/[^a-zA-Z0-9]/g, "_")}`;
      await setDoc(doc(db, "evaluations", evaluationId), {
        ...evaluation,
        teamId,
        evaluatedAt: new Date().toISOString()
      });
    } else {
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
    }

    const team = teamsRef.current.find((t) => t.id === teamId);
    if (team) {
      addNotification({
        userId: team.members[0]?.email || "",
        type: "judge",
        title: "New Evaluation Submitted",
        body: `A judge has submitted scores for your team. Check the Project tab for feedback.`,
        priority: "normal",
        relatedTeamId: teamId
      });
    }
  }, [addNotification]);

  const updateMilestoneProgress = useCallback(async (teamId: string, milestoneId: string, completed: boolean) => {
    const team = teamsRef.current.find((t) => t.id === teamId);
    if (!team) return;

    const updatedMilestones = (team.milestonesProgress || []).map((m) =>
      m.id === milestoneId ? { ...m, completed } : m
    );

    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), { milestonesProgress: updatedMilestones });
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, milestonesProgress: updatedMilestones } : t));
    }
  }, []);

  const checkInTeam = useCallback(async (teamId: string, byName: string) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const attendance = { teamId, checkedIn: true, checkInTime: now, checkInBy: byName };

    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), { attendance });
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, attendance } : t));
    }

    const team = teamsRef.current.find((t) => t.id === teamId);
    if (team) {
      addNotification({
        userId: team.members[0]?.email || "",
        type: "approval",
        title: "Attendance Recorded",
        body: `Team "${team.name}" checked in at ${now} by ${byName}.`,
        priority: "normal",
        relatedTeamId: teamId
      });
    }
  }, [addNotification]);

  const addAnnouncement = useCallback(async (title: string, content: string, type: "info" | "warning" | "success") => {
    const newAnn = {
      title,
      content,
      type,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "announcements"), newAnn);
    } else {
      setAnnouncements((prev) => [
        { ...newAnn, id: `ann-${Date.now()}` },
        ...prev
      ]);
    }

    addNotification({
      userId: "all",
      type: "system",
      title,
      body: content,
      priority: "normal"
    });
  }, [addNotification]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } else {
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    if (isConfigured && db) {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          batch.update(doc(db, "notifications", n.id), { read: true });
        }
      });
      await batch.commit();
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [notifications]);

  const raiseTicket = useCallback(async (ticket: Omit<SupportTicket, "id" | "createdAt" | "status">) => {
    const team = teamsRef.current.find((t) => t.id === ticket.teamId);
    if (!team) return;

    const newTicket = {
      teamId: ticket.teamId,
      teamName: team.name,
      category: ticket.category,
      description: ticket.description,
      priority: ticket.priority,
      status: "Open" as const,
      createdAt: new Date().toISOString(),
      raisedBy: session.email || "",
      title: `${ticket.category} Request`
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "tickets"), newTicket);
    } else {
      const updatedTickets = [{ ...newTicket, id: `sticket-${Date.now()}` }, ...(team.supportTickets || [])];
      setTeams((prev) => prev.map((t) => t.id === ticket.teamId ? { ...t, supportTickets: updatedTickets } : t));
    }

    addNotification({
      userId: "organizer@college.edu",
      type: "action",
      title: `Support Ticket: ${ticket.category}`,
      body: ticket.description,
      priority: ticket.priority === "Critical" ? "high" : "normal",
      relatedTeamId: ticket.teamId
    });
  }, [addNotification, session.email]);

  const resolveTicket = useCallback(async (ticketId: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "tickets", ticketId), { status: "Resolved" });
    } else {
      setTeams((prev) => prev.map((t) => ({ ...t, supportTickets: (t.supportTickets || []).map((tk) => tk.id === ticketId ? { ...tk, status: "Resolved" as const } : tk) })));
    }
  }, []);

  const addVolunteer = useCallback(async (v: Omit<Volunteer, "id" | "createdAt">) => {
    const profile = {
      email: v.email,
      displayName: v.name,
      role: "volunteer" as const,
      status: "active",
      createdAt: new Date().toISOString()
    };

    if (isConfigured && db) {
      // Add custom doc in users collection using email hash or doc generator
      await addDoc(collection(db, "users"), profile);
    } else {
      setVolunteers((prev) => [
        { ...v, id: `vol-${Date.now()}`, createdAt: new Date().toISOString(), status: "active", assignedTicketsCount: 0 },
        ...prev
      ]);
    }
  }, []);

  const updateVolunteer = useCallback(async (id: string, data: Partial<Volunteer>) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "users", id), data);
    } else {
      setVolunteers((prev) => prev.map((v) => v.id === id ? { ...v, ...data } : v));
    }
  }, []);

  const removeVolunteer = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "users", id));
    } else {
      setVolunteers((prev) => prev.filter((v) => v.id !== id));
    }
  }, []);

  const updateProfile = useCallback(async (email: string, data: Partial<UserProfile>) => {
    if (isConfigured && db && auth?.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), data);
    } else {
      setUserProfiles((prev) => {
        const idx = prev.findIndex((p) => p.email.toLowerCase() === email.toLowerCase());
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...data };
          return updated;
        }
        return prev;
      });
    }
  }, []);

  const getProfile = useCallback((email: string): UserProfile | undefined => {
    return userProfiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }, [userProfiles]);

  const addProblemStatement = useCallback(async (ps: Omit<ProblemStatement, "id" | "createdAt">) => {
    const data = {
      title: ps.title,
      description: ps.description,
      trackId: ps.trackId ?? "",
      status: ps.status ?? "draft",
      attachments: ps.attachments ?? [],
      createdAt: new Date().toISOString()
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "problemStatements"), data);
    } else {
      setProblemStatements((prev) => [
        { ...data, id: `ps-${Date.now()}` },
        ...prev
      ]);
    }
  }, []);

  const updateProblemStatement = useCallback(async (id: string, data: Partial<ProblemStatement>) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "problemStatements", id), data);
    } else {
      setProblemStatements((prev) => prev.map((ps) => ps.id === id ? { ...ps, ...data } : ps));
    }
  }, []);

  const archiveProblemStatement = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "problemStatements", id), { status: "archived" });
    } else {
      setProblemStatements((prev) => prev.map((ps) => ps.id === id ? { ...ps, status: "archived" as const } : ps));
    }
  }, []);

  const removeAnnouncement = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "announcements", id));
    } else {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }, []);

  const createTicket = useCallback(async (ticket: Omit<Ticket, "id" | "createdAt" | "status">) => {
    const data = {
      title: `${ticket.category} Request`,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      status: "Open" as const,
      raisedBy: ticket.raisedBy,
      createdAt: new Date().toISOString()
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "tickets"), data);
    } else {
      setTickets((prev) => [
        { ...data, id: `ticket-${Date.now()}` },
        ...prev
      ]);
    }

    addNotification({
      userId: "organizer@college.edu",
      type: "action",
      title: `New Ticket: ${ticket.category}`,
      body: ticket.description,
      priority: ticket.priority === "Critical" ? "high" : "normal"
    });
  }, [addNotification]);

  const assignTicket = useCallback(async (ticketId: string, volunteerEmail: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "tickets", ticketId), {
        assignedTo: volunteerEmail,
        status: "Assigned",
        updatedAt: new Date().toISOString()
      });
    } else {
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, assignedTo: volunteerEmail, status: "Assigned" as const, updatedAt: new Date().toISOString() } : t));
    }
  }, []);

  const updateTicketStatus = useCallback(async (ticketId: string, status: Ticket["status"]) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "tickets", ticketId), {
        status,
        updatedAt: new Date().toISOString()
      });
    } else {
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    }
  }, []);

  const value = useMemo(() => ({
    teams, session, announcements, notifications,
    volunteers, userProfiles, problemStatements, tickets,
    login, logout,
    registerTeam, updateTeamMembers, approveTeam, rejectTeam,
    updateProjectDetails, evaluateProject, updateMilestoneProgress, checkInTeam,
    addAnnouncement,
    removeAnnouncement,
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
