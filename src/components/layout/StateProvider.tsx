"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Team, UserSession, Announcement, Participant, Notification, SupportTicket, Volunteer, UserProfile, ProblemStatement, Ticket, Hackathon, TeamRequest, FoodMeal, FoodToken } from "@/types";
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
  getDocs,
  writeBatch,
  query,
  where
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

interface StateContextType {
  // ─── Data ───────────────────────────────────────────────────────────────────
  teams: Team[];
  session: UserSession;
  announcements: Announcement[];
  notifications: Notification[];
  volunteers: Volunteer[];
  userProfiles: UserProfile[];
  problemStatements: ProblemStatement[];
  tickets: Ticket[];
  hackathons: Hackathon[];
  teamRequests: TeamRequest[];
  foodMeals: FoodMeal[];
  foodTokens: FoodToken[];
  activeHackathonId: string | null;
  // ─── Auth ───────────────────────────────────────────────────────────────────
  login: (email: string, role?: "participant" | "admin" | "judge" | "organizer" | "volunteer") => { success: boolean; role?: "participant" | "admin" | "judge" | "organizer" | "volunteer" };
  logout: () => void;
  // ─── Hackathons ──────────────────────────────────────────────────────────────
  setActiveHackathon: (id: string | null) => void;
  createHackathon: (data: Omit<Hackathon, "id" | "createdAt">) => Promise<string>;
  updateHackathon: (id: string, data: Partial<Hackathon>) => Promise<void>;
  deleteHackathon: (id: string) => Promise<void>;
  // ─── Teams ──────────────────────────────────────────────────────────────────
  registerTeam: (teamData: { name: string; projectDescription: string; members: Participant[]; hackathonId?: string }) => void;
  updateTeamMembers: (teamId: string, members: Participant[]) => void;
  approveTeam: (teamId: string) => void;
  rejectTeam: (teamId: string) => void;
  deleteTeam: (teamId: string) => Promise<void>;
  updateProjectDetails: (teamId: string, details: Partial<Team>) => void;
  evaluateProject: (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; technicalDepth?: number; aiUsage?: number; feedback: string; judgeEmail: string }) => void;
  updateMilestoneProgress: (teamId: string, milestoneId: string, completed: boolean) => void;
  checkInTeam: (teamId: string, byName: string) => void;
  // ─── Team Requests ───────────────────────────────────────────────────────────
  sendJoinRequest: (teamId: string, message?: string) => Promise<void>;
  sendTeamInvite: (toEmail: string, toName: string, teamId: string, message?: string) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  // ─── Announcements ───────────────────────────────────────────────────────────
  addAnnouncement: (title: string, content: string, type: "info" | "warning" | "success") => void;
  removeAnnouncement: (id: string) => void;
  // ─── Notifications ───────────────────────────────────────────────────────────
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  // ─── Support Tickets ─────────────────────────────────────────────────────────
  raiseTicket: (ticket: Omit<SupportTicket, "id" | "createdAt" | "status">) => void;
  resolveTicket: (ticketId: string) => void;
  // ─── Volunteers ──────────────────────────────────────────────────────────────
  addVolunteer: (v: Omit<Volunteer, "id" | "createdAt">) => void;
  updateVolunteer: (id: string, data: Partial<Volunteer>) => void;
  removeVolunteer: (id: string) => void;
  // ─── Profiles ────────────────────────────────────────────────────────────────
  updateProfile: (email: string, data: Partial<UserProfile>) => void;
  getProfile: (email: string) => UserProfile | undefined;
  addProfile: (profile: UserProfile) => void;
  deleteProfile: (id: string) => void;
  // ─── Problem Statements ──────────────────────────────────────────────────────
  addProblemStatement: (ps: Omit<ProblemStatement, "id" | "createdAt">) => void;
  updateProblemStatement: (id: string, data: Partial<ProblemStatement>) => void;
  archiveProblemStatement: (id: string) => void;
  // ─── Tickets (top-level) ─────────────────────────────────────────────────────
  createTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "status">) => void;
  assignTicket: (ticketId: string, volunteerEmail: string) => void;
  updateTicketStatus: (ticketId: string, status: Ticket["status"]) => void;
  // ─── Food Tokens ─────────────────────────────────────────────────────────────
  createMeal: (meal: Omit<FoodMeal, "id" | "createdAt" | "totalIssued" | "totalRedeemed">) => Promise<string>;
  updateMeal: (id: string, data: Partial<FoodMeal>) => Promise<void>;
  deleteMeal: (id: string) => Promise<void>;
  issueMealTokens: (mealId: string) => Promise<{ issued: number; skipped: number }>;
  redeemToken: (tokenId: string) => Promise<void>;
  redeemTokenByCode: (tokenCode: string) => Promise<FoodToken | null>;
  getMyTokens: (email: string) => FoodToken[];
  revokeToken: (tokenId: string) => Promise<void>;
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
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>([]);
  const [foodMeals, setFoodMeals] = useState<FoodMeal[]>([]);
  const [foodTokens, setFoodTokens] = useState<FoodToken[]>([]);
  const [activeHackathonId, setActiveHackathonIdState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const volunteersRef = useRef(volunteers);
  const teamsRef = useRef(teams);
  const userProfilesRef = useRef(userProfiles);
  useEffect(() => { volunteersRef.current = volunteers; }, [volunteers]);
  useEffect(() => { teamsRef.current = teams; }, [teams]);
  useEffect(() => { userProfilesRef.current = userProfiles; }, [userProfiles]);

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
        if (storedProfiles) {
          setUserProfiles(JSON.parse(storedProfiles));
        } else {
          const defaultProfiles = [
            { id: "m-1", uid: "m-1", displayName: "System Admin", name: "System Admin", email: "admin@college.edu", role: "admin" },
            { id: "m-2", uid: "m-2", displayName: "Prof. Suresh Kumar", name: "Prof. Suresh Kumar", email: "organizer@college.edu", role: "organizer" },
            { id: "m-3", uid: "m-3", displayName: "Dr. A. Rajesh", name: "Dr. A. Rajesh", email: "rajesh@college.edu", role: "organizer" },
            { id: "m-4", uid: "m-4", displayName: "Dr. Priya Rajan", name: "Dr. Priya Rajan", email: "judge@college.edu", role: "judge" },
            { id: "m-5", uid: "m-5", displayName: "Riya Verma", name: "Riya Verma", email: "riya@college.edu", role: "volunteer" },
            { id: "m-6", uid: "m-6", displayName: "Arjun Nair", name: "Arjun Nair", email: "arjun@college.edu", role: "volunteer" },
          ];
          setUserProfiles(defaultProfiles as UserProfile[]);
        }
      } catch { /* skip */ }
      try {
        const storedProblems = localStorage.getItem("siet_problems");
        if (storedProblems) setProblemStatements(JSON.parse(storedProblems));
      } catch { /* skip */ }
      try {
        const storedTickets = localStorage.getItem("siet_tickets");
        if (storedTickets) setTickets(JSON.parse(storedTickets));
      } catch { /* skip */ }
      try {
        const storedHackathons = localStorage.getItem("siet_hackathons");
        if (storedHackathons) setHackathons(JSON.parse(storedHackathons));
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
      try { unsubHackathons?.(); } catch {}
      try { unsubAuth?.(); } catch {}
      cleanupActiveListeners();
      loadLocalData();
    };

    let unsubUsers: (() => void) | null = null;
    let unsubTeams: (() => void) | null = null;
    let unsubNotifs: (() => void) | null = null;
    let unsubTickets: (() => void) | null = null;
    let unsubVols: (() => void) | null = null;
    let unsubTeamRequests: (() => void) | null = null;
    let unsubFoodMeals: (() => void) | null = null;
    let unsubFoodTokens: (() => void) | null = null;

    const cleanupActiveListeners = () => {
      if (unsubUsers) { unsubUsers(); unsubUsers = null; }
      if (unsubTeams) { unsubTeams(); unsubTeams = null; }
      if (unsubNotifs) { unsubNotifs(); unsubNotifs = null; }
      if (unsubTickets) { unsubTickets(); unsubTickets = null; }
      if (unsubVols) { unsubVols(); unsubVols = null; }
      if (unsubTeamRequests) { unsubTeamRequests(); unsubTeamRequests = null; }
      if (unsubFoodMeals) { unsubFoodMeals(); unsubFoodMeals = null; }
      if (unsubFoodTokens) { unsubFoodTokens(); unsubFoodTokens = null; }
    };

    let unsubAnn: (() => void) | null = null;
    let unsubProblems: (() => void) | null = null;
    let unsubHackathons: (() => void) | null = null;
    let unsubAuth: (() => void) | null = null;

    // Global listeners (no auth required)
    unsubAnn = onSnapshot(collection(firestore, "announcements"), (snap) => {
      const list: Announcement[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({ id: d.id, title: data.title ?? "", content: data.content ?? "", type: data.type ?? "info", date: data.date ?? "Just now", hackathonId: data.hackathonId });
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
        list.push({ id: d.id, title: data.title ?? "", description: data.description ?? "", trackId: data.trackId ?? "", status: data.status ?? "draft", createdAt: data.createdAt ?? new Date().toISOString(), attachments: data.attachments ?? [], hackathonId: data.hackathonId ?? "" });
      });
      setProblemStatements(list);
    }, (err) => {
      console.warn("Firestore problemStatements error:", err.message);
      fallbackWithMock();
    });

    unsubHackathons = onSnapshot(collection(firestore, "hackathons"), (snap) => {
      const list: Hackathon[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Hackathon));
      setHackathons(list);
    }, (err) => console.warn("Hackathons sync error:", err));

    // Auth-gated listeners
    unsubAuth = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      cleanupActiveListeners();

      if (firebaseUser && !firebaseFailed) {
        if (!firebaseUser.emailVerified && firebaseUser.email !== 'admin@hacklab.internal') {
          try { await signOut(firebaseAuth); } catch (e) { console.error("Sign out failed", e); }
          setSession({ isLoggedIn: false, role: null, email: null, teamId: null });
          clearSessionCookie();
          return;
        }

        try {
          const userDocRef = doc(firestore, "users", firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          let role: "participant" | "admin" | "judge" | "organizer" | "volunteer" = "participant";
          let teamId: string | null = null;
          let displayName = firebaseUser.displayName ?? "New User";
          let teamSetupDone: boolean = true;
          let currentHackathonId: string | null = null;
          let hackathonIds: string[] = [];

          if (userSnap.exists()) {
            const userData = userSnap.data();
            role = userData.role ?? "participant";
            teamId = userData.teamId ?? null;
            displayName = userData.displayName ?? displayName;
            teamSetupDone = userData.teamSetupDone ?? true;
            currentHackathonId = userData.currentHackathonId ?? null;
            hackathonIds = userData.hackathonIds ?? [];
          }

          setSession({ isLoggedIn: true, role, email: firebaseUser.email, name: displayName, teamId, teamSetupDone, currentHackathonId });
          setSessionCookie({ isLoggedIn: true, role, email: firebaseUser.email, name: displayName, teamId, teamSetupDone, currentHackathonId });

          // Set active hackathon from user data
          if (currentHackathonId) setActiveHackathonIdState(currentHackathonId);
          else if (hackathonIds.length > 0) setActiveHackathonIdState(hackathonIds[0]);

          // Shared listeners
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

          // Team requests for this user (both directions)
          unsubTeamRequests = onSnapshot(collection(firestore, "teamRequests"), (snap) => {
            const list: TeamRequest[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as TeamRequest));
            setTeamRequests(list);
          }, (err) => console.warn("TeamRequests sync error:", err));

          // Food meals (all roles can see)
          unsubFoodMeals = onSnapshot(collection(firestore, "foodMeals"), (snap) => {
            const list: FoodMeal[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FoodMeal));
            setFoodMeals(list);
          }, (err) => console.warn("FoodMeals sync error:", err));

          // Food tokens — participants see their own; staff see all
          if (role === "admin" || role === "organizer" || role === "volunteer") {
            unsubFoodTokens = onSnapshot(collection(firestore, "foodTokens"), (snap) => {
              const list: FoodToken[] = [];
              snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FoodToken));
              setFoodTokens(list);
            }, (err) => console.warn("FoodTokens sync error:", err));
          } else if (firebaseUser.email) {
            const tokenQ = query(collection(firestore, "foodTokens"), where("participantEmail", "==", firebaseUser.email));
            unsubFoodTokens = onSnapshot(tokenQ, (snap) => {
              const list: FoodToken[] = [];
              snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FoodToken));
              setFoodTokens(list);
            }, (err) => console.warn("FoodTokens (participant) sync error:", err));
          }

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
        setTeamRequests([]);
        setFoodTokens([]);
        setActiveHackathonIdState(null);
      }
      setInitialized(true);
    });

    return () => {
      unsubAnn?.();
      unsubProblems?.();
      unsubHackathons?.();
      unsubAuth?.();
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
    const unsubTeamReqs = onSnapshot(collection(db, "teamRequests"), (snap) => {
      const list: TeamRequest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as TeamRequest));
      setTeamRequests(list);
    });
    const unsubFoodMeals = onSnapshot(collection(db, "foodMeals"), (snap) => {
      const list: FoodMeal[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FoodMeal));
      setFoodMeals(list);
    });
    const unsubFoodTokens = onSnapshot(collection(db, "foodTokens"), (snap) => {
      const list: FoodToken[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as FoodToken));
      setFoodTokens(list);
    });

    return () => {
      unsubTeams();
      unsubTickets();
      unsubNotifs();
      unsubUsers();
      unsubTeamReqs();
      unsubFoodMeals();
      unsubFoodTokens();
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
      localStorage.setItem("siet_hackathons", JSON.stringify(hackathons));
    }, 300);
    return () => clearTimeout(timeout);
  }, [teams, session, announcements, notifications, volunteers, userProfiles, problemStatements, tickets, hackathons, initialized]);

  // ── 3. Actions & Operations ──────────────────────────────────────────────────

  const setActiveHackathon = useCallback((id: string | null) => {
    setActiveHackathonIdState(id);
  }, []);

  const addNotification = useCallback(async (n: Omit<Notification, "id" | "createdAt" | "read">) => {
    const newNotif = {
      userId: n.userId || session.email || "",
      type: n.type,
      title: n.title,
      body: n.body,
      read: false,
      createdAt: new Date().toISOString(),
      priority: n.priority ?? "normal",
      relatedTeamId: n.relatedTeamId || null,
      relatedRequestId: n.relatedRequestId || null,
      hackathonId: n.hackathonId || activeHackathonId || null,
    };
    if (isConfigured && db) {
      await addDoc(collection(db, "notifications"), newNotif);
    } else {
      setNotifications((prev) => [{ ...newNotif, id: `notif-${Date.now()}` }, ...prev]);
    }
  }, [session.email, activeHackathonId]);

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

    if (!resolvedRole) {
      const emailLower = email.toLowerCase().trim();
      if (emailLower === "admin@college.edu" || emailLower === "admin2727") {
        resolvedRole = "admin";
      } else if (emailLower === "judge@college.edu") {
        resolvedRole = "judge";
      } else if (emailLower === "organizer@college.edu") {
        resolvedRole = "organizer";
      } else {
        const vol = volunteersRef.current.find((v) => v.email.toLowerCase() === emailLower);
        if (vol) {
          resolvedRole = "volunteer";
        } else {
          const team = teamsRef.current.find((t) => t.members.some((m) => m.email.toLowerCase() === emailLower));
          if (team) {
            resolvedRole = "participant";
          } else {
            const profile = userProfilesRef.current.find((p) => (p.email || "").toLowerCase() === emailLower);
            if (profile) resolvedRole = profile.role;
          }
        }
      }
    }
    if (!resolvedRole) resolvedRole = "participant";

    let matched = false;
    let name = "Demo User";
    let tId: string | null = null;

    if (resolvedRole === "admin") {
      matched = true; name = names[email] ?? "System Admin";
    } else if (resolvedRole === "judge") {
      matched = true; name = names[email] ?? "Dr. Priya Rajan";
    } else if (resolvedRole === "organizer") {
      matched = true; name = names[email] ?? "Prof. Suresh Kumar";
    } else if (resolvedRole === "volunteer") {
      const vol = volunteersRef.current.find((v) => v.email.toLowerCase() === email.toLowerCase());
      if (vol) { matched = true; name = vol.name; }
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
  }, []);

  const logout = useCallback(async () => {
    if (isConfigured && auth) await auth.signOut();
    setSession({ isLoggedIn: false, role: null, email: null, teamId: null });
    clearSessionCookie();
    setActiveHackathonIdState(null);
  }, []);

  // ─── Hackathon CRUD ─────────────────────────────────────────────────────────

  const createHackathon = useCallback(async (data: Omit<Hackathon, "id" | "createdAt">): Promise<string> => {
    const hackathonData = {
      ...data,
      createdAt: new Date().toISOString(),
      createdBy: session.email || "",
    };
    if (isConfigured && db) {
      const ref = await addDoc(collection(db, "hackathons"), hackathonData);
      return ref.id;
    }
    const id = `hackathon-${Date.now()}`;
    setHackathons((prev) => [...prev, { ...hackathonData, id }]);
    return id;
  }, [session.email]);

  const updateHackathon = useCallback(async (id: string, data: Partial<Hackathon>) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "hackathons", id), data);
    } else {
      setHackathons((prev) => prev.map((h) => h.id === id ? { ...h, ...data } : h));
    }
  }, []);

  const deleteHackathon = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "hackathons", id));
    }
    setHackathons((prev) => prev.filter((h) => h.id !== id));
  }, []);

  // ─── Team Operations ────────────────────────────────────────────────────────

  const registerTeam = useCallback(async (teamData: { name: string; projectDescription: string; members: Participant[]; hackathonId?: string }) => {
    const teamId = `team-${Date.now()}`;
    const prefix = teamData.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    const teamNum = 100 + teamsRef.current.length + 5;
    const qrToken = `${prefix}-AI26-${teamNum}-SEC${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const newTeam: Team = {
      id: teamId,
      hackathonId: teamData.hackathonId || activeHackathonId || "",
      name: teamData.name,
      size: teamData.members.length,
      members: teamData.members,
      status: "PENDING",
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
      batch.set(doc(db, "teams", teamId), newTeam);
      batch.update(doc(db, "users", auth.currentUser.uid), { teamId, teamSetupDone: true });
      await batch.commit();
      setSession((prev) => ({ ...prev, teamId, teamSetupDone: true }));
    } else {
      setTeams((prev) => [...prev, newTeam]);
      const leader = teamData.members.find((m) => m.isLeader) || teamData.members[0];
      const newSession = { isLoggedIn: true, role: "participant" as const, email: leader.email, name: leader.name, teamId, teamSetupDone: true };
      setSession(newSession);
      setSessionCookie(newSession);
    }

    addNotification({
      userId: session.email || "",
      type: "system",
      title: "Team Registered",
      body: `Your team "${teamData.name}" has been registered. Await admin approval.`,
      priority: "high"
    });
  }, [addNotification, session.email, activeHackathonId]);

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
  }, []);

  const rejectTeam = useCallback(async (teamId: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "teams", teamId), { status: "REJECTED" });
    } else {
      setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, status: "REJECTED" as const } : t));
    }
  }, []);

  const deleteTeam = useCallback(async (teamId: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "teams", teamId));
    }
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  }, []);

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
      await setDoc(doc(db, "evaluations", evaluationId), { ...evaluation, teamId, evaluatedAt: new Date().toISOString() });
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
      addNotification({ userId: team.members[0]?.email || "", type: "judge", title: "New Evaluation Submitted", body: "A judge has submitted scores for your team.", priority: "normal", relatedTeamId: teamId });
    }
  }, [addNotification]);

  const updateMilestoneProgress = useCallback(async (teamId: string, milestoneId: string, completed: boolean) => {
    const team = teamsRef.current.find((t) => t.id === teamId);
    if (!team) return;
    const updatedMilestones = (team.milestonesProgress || []).map((m) => m.id === milestoneId ? { ...m, completed } : m);
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
      addNotification({ userId: team.members[0]?.email || "", type: "approval", title: "Attendance Recorded", body: `Team "${team.name}" checked in at ${now} by ${byName}.`, priority: "normal", relatedTeamId: teamId });
    }
  }, [addNotification]);

  // ─── Team Requests ──────────────────────────────────────────────────────────

  const sendJoinRequest = useCallback(async (teamId: string, message?: string) => {
    if (!session.email || !session.name) return;
    const team = teamsRef.current.find((t) => t.id === teamId);
    if (!team) return;
    const leader = team.members.find((m) => m.isLeader) || team.members[0];

    const requestData = {
      hackathonId: team.hackathonId || activeHackathonId || "",
      teamId,
      teamName: team.name,
      fromEmail: session.email,
      fromName: session.name,
      toEmail: leader?.email || "",
      toName: leader?.name || "",
      direction: "join" as const,
      status: "pending" as const,
      message: message || "",
      createdAt: new Date().toISOString(),
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "teamRequests"), requestData);
    } else {
      setTeamRequests((prev) => [...prev, { ...requestData, id: `req-${Date.now()}` }]);
    }

    addNotification({ userId: leader?.email || "", type: "team_request", title: "Join Request Received", body: `${session.name} wants to join your team "${team.name}".`, priority: "high", relatedTeamId: teamId });
  }, [session.email, session.name, activeHackathonId, addNotification]);

  const sendTeamInvite = useCallback(async (toEmail: string, toName: string, teamId: string, message?: string) => {
    if (!session.email || !session.name) return;
    const team = teamsRef.current.find((t) => t.id === teamId);
    if (!team) return;

    const requestData = {
      hackathonId: team.hackathonId || activeHackathonId || "",
      teamId,
      teamName: team.name,
      fromEmail: session.email,
      fromName: session.name,
      toEmail,
      toName,
      direction: "invite" as const,
      status: "pending" as const,
      message: message || "",
      createdAt: new Date().toISOString(),
    };

    if (isConfigured && db) {
      await addDoc(collection(db, "teamRequests"), requestData);
    } else {
      setTeamRequests((prev) => [...prev, { ...requestData, id: `req-${Date.now()}` }]);
    }

    addNotification({ userId: toEmail, type: "team_request", title: "Team Invite", body: `Team "${team.name}" has invited you to join.`, priority: "high", relatedTeamId: teamId });
  }, [session.email, session.name, activeHackathonId, addNotification]);

  const respondToRequest = useCallback(async (requestId: string, accept: boolean) => {
    const request = teamRequests.find((r) => r.id === requestId);
    if (!request) return;

    const newStatus = accept ? "accepted" : "rejected";

    if (isConfigured && db) {
      await updateDoc(doc(db, "teamRequests", requestId), { status: newStatus, respondedAt: new Date().toISOString() });
    } else {
      setTeamRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: newStatus, respondedAt: new Date().toISOString() } : r));
    }

    if (accept) {
      // Add user to team
      const team = teamsRef.current.find((t) => t.id === request.teamId);
      if (team) {
        const newEmail = request.direction === "join" ? request.fromEmail : request.toEmail;
        const newName = request.direction === "join" ? request.fromName : request.toName;
        if (!team.members.some((m) => m.email === newEmail)) {
          const newMember: Participant = { name: newName, email: newEmail, registerNumber: "", phone: "", department: "", year: "", skills: [], isLeader: false };
          const updatedMembers = [...team.members, newMember];
          await updateTeamMembers(request.teamId, updatedMembers);
        }
      }
      const notifyEmail = request.direction === "join" ? request.fromEmail : request.toEmail;
      addNotification({ userId: notifyEmail, type: "team_request", title: "Request Accepted", body: `You have been added to team "${request.teamName}".`, priority: "high", relatedTeamId: request.teamId, relatedRequestId: requestId });
    }
  }, [teamRequests, updateTeamMembers, addNotification]);

  const cancelRequest = useCallback(async (requestId: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "teamRequests", requestId));
    }
    setTeamRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  // ─── Announcements ──────────────────────────────────────────────────────────

  const addAnnouncement = useCallback(async (title: string, content: string, type: "info" | "warning" | "success") => {
    const newAnn = {
      title, content, type,
      hackathonId: activeHackathonId || null,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    };
    if (isConfigured && db) {
      await addDoc(collection(db, "announcements"), newAnn);
    } else {
      setAnnouncements((prev) => [{ ...newAnn, id: `ann-${Date.now()}` }, ...prev]);
    }
    addNotification({ userId: "all", type: "system", title, body: content, priority: "normal" });
  }, [addNotification, activeHackathonId]);

  const removeAnnouncement = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "announcements", id));
    } else {
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    }
  }, []);

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
      notifications.forEach((n) => { if (!n.read) batch.update(doc(db, "notifications", n.id), { read: true }); });
      await batch.commit();
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [notifications]);

  const raiseTicket = useCallback(async (ticket: Omit<SupportTicket, "id" | "createdAt" | "status">) => {
    const team = teamsRef.current.find((t) => t.id === ticket.teamId);
    if (!team) return;
    const newTicket = { teamId: ticket.teamId, teamName: team.name, category: ticket.category, description: ticket.description, priority: ticket.priority, status: "Open" as const, createdAt: new Date().toISOString(), raisedBy: session.email || "", title: `${ticket.category} Request` };
    if (isConfigured && db) {
      await addDoc(collection(db, "tickets"), newTicket);
    } else {
      const updatedTickets = [{ ...newTicket, id: `sticket-${Date.now()}` }, ...(team.supportTickets || [])];
      setTeams((prev) => prev.map((t) => t.id === ticket.teamId ? { ...t, supportTickets: updatedTickets } : t));
    }
    addNotification({ userId: "organizer@college.edu", type: "action", title: `Support Ticket: ${ticket.category}`, body: ticket.description, priority: ticket.priority === "Critical" ? "high" : "normal", relatedTeamId: ticket.teamId });
  }, [addNotification, session.email]);

  const resolveTicket = useCallback(async (ticketId: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "tickets", ticketId), { status: "Resolved" });
    } else {
      setTeams((prev) => prev.map((t) => ({ ...t, supportTickets: (t.supportTickets || []).map((tk) => tk.id === ticketId ? { ...tk, status: "Resolved" as const } : tk) })));
    }
  }, []);

  const addVolunteer = useCallback(async (v: Omit<Volunteer, "id" | "createdAt">) => {
    const profile = { email: v.email, displayName: v.name, role: "volunteer" as const, status: "active", createdAt: new Date().toISOString() };
    if (isConfigured && db) {
      await addDoc(collection(db, "users"), profile);
    } else {
      setVolunteers((prev) => [{ ...v, id: `vol-${Date.now()}`, createdAt: new Date().toISOString(), status: "active", assignedTicketsCount: 0 }, ...prev]);
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
        if (idx > -1) { const updated = [...prev]; updated[idx] = { ...updated[idx], ...data }; return updated; }
        return prev;
      });
    }
  }, []);

  const getProfile = useCallback((email: string): UserProfile | undefined => {
    return userProfilesRef.current.find((p) => p.email.toLowerCase() === email.toLowerCase());
  }, []);

  const addProfile = useCallback((profile: UserProfile) => {
    setUserProfiles((prev) => {
      const idx = prev.findIndex((p) => p.email.toLowerCase() === profile.email.toLowerCase());
      if (idx > -1) { const updated = [...prev]; updated[idx] = { ...updated[idx], ...profile }; return updated; }
      return [...prev, profile];
    });
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setUserProfiles((prev) => prev.filter((p) => p.id !== id && p.uid !== id));
  }, []);

  const addProblemStatement = useCallback(async (ps: Omit<ProblemStatement, "id" | "createdAt">) => {
    const data = { title: ps.title, description: ps.description, trackId: ps.trackId ?? "", status: ps.status ?? "draft", attachments: ps.attachments ?? [], createdAt: new Date().toISOString(), hackathonId: ps.hackathonId || activeHackathonId || "" };
    if (isConfigured && db) {
      await addDoc(collection(db, "problemStatements"), data);
    } else {
      setProblemStatements((prev) => [{ ...data, id: `ps-${Date.now()}` }, ...prev]);
    }
  }, [activeHackathonId]);

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

  const createTicket = useCallback(async (ticket: Omit<Ticket, "id" | "createdAt" | "status">) => {
    const data = { title: `${ticket.category} Request`, description: ticket.description, category: ticket.category, priority: ticket.priority, status: "Open" as const, raisedBy: ticket.raisedBy, createdAt: new Date().toISOString() };
    if (isConfigured && db) {
      await addDoc(collection(db, "tickets"), data);
    } else {
      setTickets((prev) => [{ ...data, id: `ticket-${Date.now()}` }, ...prev]);
    }
    addNotification({ userId: "organizer@college.edu", type: "action", title: `New Ticket: ${ticket.category}`, body: ticket.description, priority: ticket.priority === "Critical" ? "high" : "normal" });
  }, [addNotification]);

  const assignTicket = useCallback(async (ticketId: string, volunteerEmail: string) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "tickets", ticketId), { assignedTo: volunteerEmail, status: "Assigned", updatedAt: new Date().toISOString() });
    } else {
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, assignedTo: volunteerEmail, status: "Assigned" as const, updatedAt: new Date().toISOString() } : t));
    }
  }, []);

  const updateTicketStatus = useCallback(async (ticketId: string, status: Ticket["status"]) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "tickets", ticketId), { status, updatedAt: new Date().toISOString() });
    } else {
      setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t));
    }
  }, []);

  // ─── Food Token Operations ──────────────────────────────────────────────────

  const createMeal = useCallback(async (meal: Omit<FoodMeal, "id" | "createdAt" | "totalIssued" | "totalRedeemed">): Promise<string> => {
    const mealData = { ...meal, hackathonId: meal.hackathonId || activeHackathonId || "", createdAt: new Date().toISOString(), createdBy: session.email || "", totalIssued: 0, totalRedeemed: 0 };
    if (isConfigured && db) {
      const ref = await addDoc(collection(db, "foodMeals"), mealData);
      return ref.id;
    }
    const id = `meal-${Date.now()}`;
    setFoodMeals((prev) => [...prev, { ...mealData, id }]);
    return id;
  }, [session.email, activeHackathonId]);

  const updateMeal = useCallback(async (id: string, data: Partial<FoodMeal>) => {
    if (isConfigured && db) {
      await updateDoc(doc(db, "foodMeals", id), data);
    } else {
      setFoodMeals((prev) => prev.map((m) => m.id === id ? { ...m, ...data } : m));
    }
  }, []);

  const deleteMeal = useCallback(async (id: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "foodMeals", id));
    }
    setFoodMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const issueMealTokens = useCallback(async (mealId: string): Promise<{ issued: number; skipped: number }> => {
    const meal = foodMeals.find((m) => m.id === mealId);
    if (!meal) return { issued: 0, skipped: 0 };

    const participants: Array<{ email: string; name: string; registerNumber: string; teamId?: string; teamName?: string }> = [];

    if (isConfigured && db) {
      // Get all participants from teams in this hackathon
      const teamsSnap = await getDocs(query(collection(db, "teams"), where("hackathonId", "==", meal.hackathonId)));
      teamsSnap.forEach((d) => {
        const team = d.data() as Team;
        team.members.forEach((m) => {
          participants.push({ email: m.email, name: m.name, registerNumber: m.registerNumber, teamId: d.id, teamName: team.name });
        });
      });

      // Check which tokens already exist for this meal
      const existingSnap = await getDocs(query(collection(db, "foodTokens"), where("mealId", "==", mealId)));
      const existingEmails = new Set<string>();
      existingSnap.forEach((d) => existingEmails.add(d.data().participantEmail));

      const newParticipants = participants.filter((p) => !existingEmails.has(p.email));
      if (newParticipants.length === 0) return { issued: 0, skipped: participants.length };

      const batch = writeBatch(db);
      newParticipants.forEach((p) => {
        const tokenRef = doc(collection(db, "foodTokens"));
        const tokenCode = `FT-${mealId.slice(-4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        batch.set(tokenRef, {
          hackathonId: meal.hackathonId,
          mealId,
          mealName: meal.name,
          mealType: meal.type,
          scheduledAt: meal.scheduledAt,
          participantEmail: p.email,
          participantName: p.name,
          registerNumber: p.registerNumber,
          teamId: p.teamId || "",
          teamName: p.teamName || "",
          status: "issued",
          issuedAt: new Date().toISOString(),
          tokenCode,
        });
      });
      batch.update(doc(db, "foodMeals", mealId), { totalIssued: participants.length });
      await batch.commit();
      return { issued: newParticipants.length, skipped: existingEmails.size };
    } else {
      // Mock mode: use teams in state
      const hackathonTeams = teamsRef.current.filter((t) => t.hackathonId === meal.hackathonId || !meal.hackathonId);
      hackathonTeams.forEach((team) => {
        team.members.forEach((m) => {
          participants.push({ email: m.email, name: m.name, registerNumber: m.registerNumber, teamId: team.id, teamName: team.name });
        });
      });
      const existingEmails = new Set(foodTokens.filter((t) => t.mealId === mealId).map((t) => t.participantEmail));
      const newTokens: FoodToken[] = participants
        .filter((p) => !existingEmails.has(p.email))
        .map((p) => ({
          id: `ft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          hackathonId: meal.hackathonId,
          mealId,
          mealName: meal.name,
          mealType: meal.type,
          scheduledAt: meal.scheduledAt,
          participantEmail: p.email,
          participantName: p.name,
          registerNumber: p.registerNumber,
          teamId: p.teamId,
          teamName: p.teamName,
          status: "issued" as const,
          issuedAt: new Date().toISOString(),
          tokenCode: `FT-${mealId.slice(-4).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        }));
      setFoodTokens((prev) => [...prev, ...newTokens]);
      return { issued: newTokens.length, skipped: existingEmails.size };
    }
  }, [foodMeals, foodTokens]);

  const redeemToken = useCallback(async (tokenId: string) => {
    const redeemedAt = new Date().toISOString();
    const redeemedBy = session.email || "";
    if (isConfigured && db) {
      await updateDoc(doc(db, "foodTokens", tokenId), { status: "redeemed", redeemedAt, redeemedBy });
      // Increment totalRedeemed on the meal
      const token = foodTokens.find((t) => t.id === tokenId);
      if (token) {
        const meal = foodMeals.find((m) => m.id === token.mealId);
        if (meal) await updateDoc(doc(db, "foodMeals", token.mealId), { totalRedeemed: (meal.totalRedeemed || 0) + 1 });
      }
    } else {
      setFoodTokens((prev) => prev.map((t) => t.id === tokenId ? { ...t, status: "redeemed" as const, redeemedAt, redeemedBy } : t));
    }
  }, [session.email, foodTokens, foodMeals]);

  const redeemTokenByCode = useCallback(async (tokenCode: string): Promise<FoodToken | null> => {
    // Look up by tokenCode
    let token = foodTokens.find((t) => t.tokenCode === tokenCode);
    if (!token && isConfigured && db) {
      const snap = await getDocs(query(collection(db, "foodTokens"), where("tokenCode", "==", tokenCode)));
      if (!snap.empty) token = { id: snap.docs[0].id, ...snap.docs[0].data() } as FoodToken;
    }
    if (!token) return null;
    if (token.status !== "issued") return token; // already redeemed/expired
    await redeemToken(token.id);
    return { ...token, status: "redeemed" };
  }, [foodTokens, redeemToken]);

  const getMyTokens = useCallback((email: string): FoodToken[] => {
    return foodTokens.filter((t) => t.participantEmail === email);
  }, [foodTokens]);

  const revokeToken = useCallback(async (tokenId: string) => {
    if (isConfigured && db) {
      await deleteDoc(doc(db, "foodTokens", tokenId));
    }
    setFoodTokens((prev) => prev.filter((t) => t.id !== tokenId));
  }, []);

  // ─── Context value ──────────────────────────────────────────────────────────

  const value = useMemo(() => ({
    // Data
    teams, session, announcements, notifications,
    volunteers, userProfiles, problemStatements, tickets,
    hackathons, teamRequests, foodMeals, foodTokens, activeHackathonId,
    // Auth
    login, logout,
    // Hackathons
    setActiveHackathon, createHackathon, updateHackathon, deleteHackathon,
    // Teams
    registerTeam, updateTeamMembers, approveTeam, rejectTeam, deleteTeam,
    updateProjectDetails, evaluateProject, updateMilestoneProgress, checkInTeam,
    // Team requests
    sendJoinRequest, sendTeamInvite, respondToRequest, cancelRequest,
    // Announcements
    addAnnouncement, removeAnnouncement,
    // Notifications
    addNotification, markNotificationRead, markAllNotificationsRead,
    // Tickets
    raiseTicket, resolveTicket,
    // Volunteers
    addVolunteer, updateVolunteer, removeVolunteer,
    // Profiles
    updateProfile, getProfile, addProfile, deleteProfile,
    // Problem Statements
    addProblemStatement, updateProblemStatement, archiveProblemStatement,
    // Tickets (top-level)
    createTicket, assignTicket, updateTicketStatus,
    // Food tokens
    createMeal, updateMeal, deleteMeal, issueMealTokens, redeemToken, redeemTokenByCode, getMyTokens, revokeToken,
  }), [
    teams, session, announcements, notifications,
    volunteers, userProfiles, problemStatements, tickets,
    hackathons, teamRequests, foodMeals, foodTokens, activeHackathonId,
    login, logout,
    setActiveHackathon, createHackathon, updateHackathon, deleteHackathon,
    registerTeam, updateTeamMembers, approveTeam, rejectTeam, deleteTeam,
    updateProjectDetails, evaluateProject, updateMilestoneProgress, checkInTeam,
    sendJoinRequest, sendTeamInvite, respondToRequest, cancelRequest,
    addAnnouncement, removeAnnouncement,
    addNotification, markNotificationRead, markAllNotificationsRead,
    raiseTicket, resolveTicket,
    addVolunteer, updateVolunteer, removeVolunteer,
    updateProfile, getProfile, addProfile, deleteProfile,
    addProblemStatement, updateProblemStatement, archiveProblemStatement,
    createTicket, assignTicket, updateTicketStatus,
    createMeal, updateMeal, deleteMeal, issueMealTokens, redeemToken, redeemTokenByCode, getMyTokens, revokeToken,
  ]);

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
