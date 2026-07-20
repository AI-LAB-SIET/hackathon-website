"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Megaphone,
  CheckCircle,
  ChevronDown,
  BookOpen,
  Archive,
  Send,
  Pencil,
  Plus,
  Activity,
  Bell,
  Upload,
  FileText,
  Download,
  X,
  Paperclip,
  Clock,
} from "lucide-react";
import { Team, ProblemStatement, FileAttachment, Participant, Hackathon, FoodMeal } from "@/types";

import { isConfigured, db, auth } from "@/lib/firebase";

type TabType = "dashboard" | "hackathons" | "members" | "participants" | "attendance" | "announcements" | "problems" | "templates" | "teams" | "foodTokens" | "profile";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "organizer" | "volunteer" | "judge" | "admin";
  hackathonIds?: string[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const {
    session, teams, announcements, problemStatements, notifications, userProfiles,
    addAnnouncement, removeAnnouncement, addProblemStatement, updateProblemStatement, archiveProblemStatement,
    markNotificationRead, markAllNotificationsRead,
    updateProfile, getProfile, updateTeamMembers, addProfile, deleteProfile,
    approveTeam, rejectTeam, deleteTeam,
    hackathons, createHackathon, updateHackathon, deleteHackathon, setActiveHackathon, activeHackathonId,
    foodMeals, createMeal, deleteMeal, issueMealTokens, foodTokens, revokeToken,
    templates, addTemplate, deleteTemplate
  } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Derive members from Firestore/local userProfiles
  const members: Member[] = userProfiles.length > 0
    ? userProfiles
      .filter(u => u.role !== "participant")
      .map(u => ({
        id: u.id || u.uid || "",
        name: u.displayName || u.name || "Unknown User",
        email: u.email,
        role: u.role as Member["role"],
        hackathonIds: u.hackathonIds || []
      }))
    : [
      { id: "m-1", name: "System Admin", email: "admin@college.edu", role: "admin", hackathonIds: [] },
      { id: "m-2", name: "Prof. Suresh Kumar", email: "organizer@college.edu", role: "organizer", hackathonIds: [] },
      { id: "m-3", name: "Dr. A. Rajesh", email: "rajesh@college.edu", role: "organizer", hackathonIds: [] },
      { id: "m-4", name: "Dr. Priya Rajan", email: "judge@college.edu", role: "judge", hackathonIds: [] },
      { id: "m-5", name: "Riya Verma", email: "riya@college.edu", role: "volunteer", hackathonIds: [] },
      { id: "m-6", name: "Arjun Nair", email: "arjun@college.edu", role: "volunteer", hackathonIds: [] },
    ];
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({ name: "", email: "", password: "", role: "organizer" as Member["role"], hackathonIds: [] as string[] });

  // Hackathon form states
  const [hackathonModalOpen, setHackathonModalOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<Hackathon | null>(null);
  const [hackathonForm, setHackathonForm] = useState({
    name: "",
    slug: "",
    description: "",
    venue: "",
    startDate: "",
    endDate: "",
    registrationOpen: true,
    minTeamSize: 1,
    maxTeamSize: 3,
    status: "upcoming" as Hackathon["status"],
    problemStatementRevealTime: "",
    resultsRevealTime: "",
  });

  // Food Meal form states
  const [mealModalOpen, setMealModalOpen] = useState(false);
  const [mealForm, setMealForm] = useState({
    name: "",
    type: "lunch" as FoodMeal["type"],
    scheduledAt: "",
    windowMinutes: 120,
    targetAudience: "all" as "all" | "dayscholars" | "hostellers",
  });
  const [mealTargetMap, setMealTargetMap] = useState<Record<string, "all" | "dayscholars" | "hostellers">>({});
  const [tokenResidenceFilter, setTokenResidenceFilter] = useState<"ALL" | "DAYSCHOLAR" | "HOSTELLER">("ALL");

  const [tokenSearch, setTokenSearch] = useState("");

  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "info" as "info" | "warning" | "success", scheduleDate: "" });
  const [annEditId, setAnnEditId] = useState<string | null>(null);
  const [annCreateOpen, setAnnCreateOpen] = useState(false);

  // Participant edit form & filters
  const [participantEditOpen, setParticipantEditOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<(Participant & { teamId: string }) | null>(null);
  const [participantForm, setParticipantForm] = useState({ name: "", email: "", isLeader: false, hostelStatus: "dayscholar" as "hosteller" | "dayscholar" | "" });
  const [participantSearch, setParticipantSearch] = useState("");
  const [participantHostelFilter, setParticipantHostelFilter] = useState<"ALL" | "DAYSCHOLAR" | "HOSTELLER">("ALL");

  // Team management state
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatusFilter, setTeamStatusFilter] = useState<"ALL" | "APPROVED" | "REJECTED" | "PENDING">("ALL");
  const [teamDetailOpen2, setTeamDetailOpen2] = useState(false);
  const [managingTeam, setManagingTeam] = useState<(typeof teams)[0] | null>(null);

  // Problem statement form
  const [psForm, setPsForm] = useState({ title: "", description: "", status: "draft" as "draft" | "published" | "archived" });
  const [psEditId, setPsEditId] = useState<string | null>(null);
  const [psCreateOpen, setPsCreateOpen] = useState(false);
  const [expandedPs, setExpandedPs] = useState<string | null>(null);
  const [psAttachments, setPsAttachments] = useState<FileAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Template form
  const [tplForm, setTplForm] = useState({ title: "", description: "" });
  const [tplAttachments, setTplAttachments] = useState<FileAttachment[]>([]);
  const [tplCreateOpen, setTplCreateOpen] = useState(false);

  // Inline quick-add form
  const [quickPsForm, setQuickPsForm] = useState({ title: "", description: "" });
  const [quickPsAdding, setQuickPsAdding] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);

  // Approved team detail modal
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);

  // Profile form
  const profile = getProfile(session.email || "");
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || session.name || "",
    college: profile?.college || "",
    hostelStatus: (profile?.hostelStatus || "") as "hosteller" | "dayscholar" | "",
    bio: profile?.bio || "",
    skills: profile?.skills?.join(", ") || "",
    socialLinks: profile?.socialLinks || [] as { platform: string; url: string }[],
  });

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "admin")) router.push("/login");
  }, [session, router, mounted]);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || session.name || "",
        college: profile.college || "",
        hostelStatus: profile.hostelStatus || "",
        bio: profile.bio || "",
        skills: profile.skills?.join(", ") || "",
        socialLinks: profile.socialLinks || [],
      });
    }
  }, [profile, session.name]);

  // Recent activity (derived dynamically from Firestore & state actions)
  const recentActivity = useMemo(() => {
    const getTimeAgo = (dateStr: string): string => {
      try {
        if (dateStr.includes("ago") || dateStr.toLowerCase() === "just now") {
          return dateStr;
        }
        const date = new Date(dateStr);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (isNaN(seconds)) return dateStr;
        if (seconds < 0) return "Just now";
        
        const intervals = [
          { label: "year", seconds: 31536000 },
          { label: "month", seconds: 2592000 },
          { label: "day", seconds: 86400 },
          { label: "hour", seconds: 3600 },
          { label: "min", seconds: 60 },
          { label: "sec", seconds: 1 }
        ];
        
        for (const interval of intervals) {
          const count = Math.floor(seconds / interval.seconds);
          if (count >= 1) {
            return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
          }
        }
        return "Just now";
      } catch {
        return dateStr;
      }
    };

    interface ActivityItem {
      id: string;
      timestamp: number;
      timeStr: string;
      user: string;
      action: string;
      type: "info" | "success" | "warning";
    }
    const list: ActivityItem[] = [];

    // 1. Teams & Registrations & Evaluations
    const MOCK_IDS = new Set(["team-1", "team-2", "team-3"]);
    const realTeams = teams.filter((t) => !MOCK_IDS.has(t.id));
    realTeams.forEach((t) => {
      const leaderEmail = t.members.find((m) => m.isLeader)?.email || "System";
      const regTime = new Date(t.createdAt).getTime();

      if (!isNaN(regTime)) {
        list.push({
          id: `reg-${t.id}`,
          timestamp: regTime,
          timeStr: t.createdAt,
          user: leaderEmail,
          action: `Registered team "${t.name}"`,
          type: "info",
        });
      }

      if (t.status === "APPROVED" || t.status === "REJECTED") {
        const updateTime = t.updatedAt ? new Date(t.updatedAt).getTime() : regTime + 60000;
        if (!isNaN(updateTime)) {
          list.push({
            id: `status-${t.id}`,
            timestamp: updateTime,
            timeStr: t.updatedAt || t.createdAt,
            user: "organizer@college.edu",
            action: t.status === "APPROVED" 
              ? `Approved registration for team "${t.name}"` 
              : `Rejected registration for team "${t.name}"`,
            type: t.status === "APPROVED" ? "success" : "warning",
          });
        }
      }

      if (t.evaluations && t.evaluations.length > 0) {
        t.evaluations.forEach((e, idx) => {
          const evalTime = t.updatedAt ? new Date(t.updatedAt).getTime() : regTime + 120000;
          if (!isNaN(evalTime)) {
            const avg = Math.round(((e.innovation + e.feasibility + e.presentation) / 3) * 10) / 10;
            list.push({
              id: `eval-${t.id}-${idx}`,
              timestamp: evalTime,
              timeStr: t.updatedAt || t.createdAt,
              user: e.judgeEmail || "judge@college.edu",
              action: `Graded team "${t.name}" (Avg ${avg}/10)`,
              type: "success",
            });
          }
        });
      }
    });

    // 2. Problem Statements
    problemStatements.forEach((ps) => {
      const psTime = new Date(ps.createdAt).getTime();
      if (!isNaN(psTime)) {
        list.push({
          id: `ps-${ps.id}`,
          timestamp: psTime,
          timeStr: ps.createdAt,
          user: "admin@college.edu",
          action: ps.status === "published" 
            ? `Published problem statement "${ps.title}"` 
            : `Created draft problem statement "${ps.title}"`,
          type: "warning",
        });
      }
    });

    // 3. Announcements
    announcements.forEach((ann) => {
      let timestamp = Date.now();
      if (ann.date.includes("hour")) {
        const hours = parseInt(ann.date) || 1;
        timestamp = Date.now() - hours * 60 * 60 * 1000;
      } else if (ann.date.includes("day")) {
        const days = parseInt(ann.date) || 1;
        timestamp = Date.now() - days * 24 * 60 * 60 * 1000;
      } else {
        const parsed = new Date(ann.date).getTime();
        if (!isNaN(parsed)) timestamp = parsed;
      }

      list.push({
        id: `ann-${ann.id}`,
        timestamp: timestamp,
        timeStr: ann.date,
        user: "organizer@college.edu",
        action: `Published announcement: "${ann.title}"`,
        type: ann.type === "warning" ? "warning" : ann.type === "success" ? "success" : "info",
      });
    });

    // Sort by timestamp descending
    list.sort((a, b) => b.timestamp - a.timestamp);

    // Format output (limit to 5 items to keep UI compact)
    return list.slice(0, 5).map((item) => ({
      id: item.id,
      time: getTimeAgo(item.timeStr),
      user: item.user,
      action: item.action,
      type: item.type,
    }));
  }, [teams, problemStatements, announcements]);

  // Realtime storage stats
  const totalStorageBytes = useMemo(() => {
    let bytes = 0;
    teams.forEach((t) => {
      if (t.attachments) {
        t.attachments.forEach((a) => {
          bytes += a.size || 0;
        });
      }
    });
    templates.forEach((temp) => {
      if (temp.attachments) {
        temp.attachments.forEach((a) => {
          bytes += a.size || 0;
        });
      }
    });
    return bytes;
  }, [teams, templates]);

  const storageStats = useMemo(() => {
    const baseBytes = 15.6 * 1024 * 1024; // 15.6 MB base system files
    const totalBytes = baseBytes + totalStorageBytes;
    const totalMB = totalBytes / (1024 * 1024);
    const limitGB = 5.0;
    const limitBytes = limitGB * 1024 * 1024 * 1024;
    const percent = Math.min((totalBytes / limitBytes) * 100, 100);
    
    return {
      formatted: `${totalMB.toFixed(2)} MB / ${limitGB.toFixed(1)} GB`,
      percent: percent,
    };
  }, [totalStorageBytes]);

  const trafficStats = useMemo(() => {
    // Real connections = checked in participants
    const checkedInMembers = teams
      .filter((t) => t.attendance?.checkedIn)
      .reduce((acc, t) => acc + t.members.length, 0);
      
    // Fallback to active members of approved teams if no checkins yet
    const activeOnsite = checkedInMembers > 0 
      ? checkedInMembers 
      : teams.filter((t) => t.status === "APPROVED").reduce((acc, t) => acc + t.members.length, 0);

    const totalInteractions = notifications.length + teams.length + templates.length;
    const egressMB = (totalStorageBytes / (1024 * 1024)).toFixed(2);

    return {
      activeConnections: activeOnsite,
      requestsPerMin: Math.max(2, Math.round(totalInteractions / 15)),
      totalRequests: totalInteractions * 4 + 120,
      bandwidthUsed: parseFloat(egressMB),
    };
  }, [teams, notifications, templates, totalStorageBytes]);

  if (!mounted || !session.isLoggedIn || session.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
        Loading admin portal...
      </div>
    );
  }

  // Derived stats
  const totalMembers = members.length;
  const totalParticipants = teams.reduce((acc, t) => acc + t.members.length, 0);
  const activeTeams = teams.filter((t) => t.status === "APPROVED").length;
  const publishedPs = problemStatements.filter((p) => p.status === "published").length;
  const approvedTeams = teams.filter((t) => t.status === "APPROVED"); // used in attendance tab
  const unreadCount = notifications.filter((n) => !n.read).length;


  // ─── MEMBER HANDLERS ───
  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ name: "", email: "", password: "", role: "organizer", hackathonIds: [] });
    setMemberModalOpen(true);
  };
  const openEditMember = (m: Member) => {
    setEditingMember(m);
    setMemberForm({ name: m.name, email: m.email, password: "", role: m.role, hackathonIds: m.hackathonIds || [] });
    setMemberModalOpen(true);
  };
  const handleSaveMember = async () => {
    if (!memberForm.name || !memberForm.email) {
      toast("Name and email are required.", "error");
      return;
    }
    if (!editingMember && !memberForm.password) {
      toast("Password is required for adding a new member.", "error");
      return;
    }

    if (isConfigured && db && auth && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (!token) {
          throw new Error("Failed to retrieve authentication token. Please log in again.");
        }
        const method = editingMember ? "PUT" : "POST";
        const payload = editingMember
          ? { id: editingMember.id, name: memberForm.name, email: memberForm.email, password: memberForm.password || undefined, role: memberForm.role, hackathonIds: memberForm.hackathonIds }
          : { name: memberForm.name, email: memberForm.email, password: memberForm.password, role: memberForm.role, hackathonIds: memberForm.hackathonIds };

        const res = await fetch("/api/admin/members", {
          method,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to save member.");
        }

        // Also update local state immediately so the UI refreshes
        const memberId = editingMember ? editingMember.id : (data.uid || `m-${Date.now()}`);
        addProfile({
          id: memberId,
          uid: memberId,
          email: memberForm.email,
          displayName: memberForm.name,
          name: memberForm.name,
          role: memberForm.role,
          hackathonIds: memberForm.hackathonIds,
        });

        toast(editingMember ? "Member updated." : "Member added.", "success");
        setMemberModalOpen(false);
        setEditingMember(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred.";
        toast(msg, "error");
      }
    } else {
      // Local mock mode or user not authenticated via Firebase
      const memberId = editingMember ? editingMember.id : `m-${Date.now()}`;
      const newProfile = {
        id: memberId,
        uid: memberId,
        email: memberForm.email,
        displayName: memberForm.name,
        name: memberForm.name,
        role: memberForm.role,
        hackathonIds: memberForm.hackathonIds,
      };
      addProfile(newProfile);
      toast(editingMember ? "Member updated." : "Member added.", "success");
      setMemberModalOpen(false);
      setEditingMember(null);
    }
  };
  const handleRemoveMember = async (id: string) => {
    if (confirm("Are you sure you want to remove this member?")) {
      if (isConfigured && db && auth && auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          if (!token) {
            throw new Error("Failed to retrieve authentication token.");
          }
          const res = await fetch(`/api/admin/members?id=${id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to remove member.");
          }
          toast("Member removed.", "info");
          setMemberModalOpen(false);
          setEditingMember(null);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "An error occurred.";
          toast(msg, "error");
        }
      } else {
        deleteProfile(id);
        toast("Member removed.", "info");
        setMemberModalOpen(false);
        setEditingMember(null);
      }
    }
  };

  // ─── HACKATHON HANDLERS ───
  const openAddHackathon = () => {
    setEditingHackathon(null);
    setHackathonForm({
      name: "",
      slug: "",
      description: "",
      venue: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 24*3600*1000).toISOString().slice(0, 16),
      registrationOpen: true,
      minTeamSize: 1,
      maxTeamSize: 3,
      status: "upcoming",
      problemStatementRevealTime: "",
      resultsRevealTime: ""
    });
    setHackathonModalOpen(true);
  };
 
  const openEditHackathon = (h: Hackathon) => {
    setEditingHackathon(h);
    setHackathonForm({
      name: h.name,
      slug: h.slug,
      description: h.description,
      venue: h.venue || "",
      startDate: h.startDate ? new Date(h.startDate).toISOString().slice(0, 16) : "",
      endDate: h.endDate ? new Date(h.endDate).toISOString().slice(0, 16) : "",
      registrationOpen: h.registrationOpen,
      minTeamSize: h.minTeamSize || 1,
      maxTeamSize: Math.min(h.maxTeamSize || 3, 3),
      status: h.status,
      problemStatementRevealTime: h.problemStatementRevealTime ? new Date(h.problemStatementRevealTime).toISOString().slice(0, 16) : "",
      resultsRevealTime: h.resultsRevealTime ? new Date(h.resultsRevealTime).toISOString().slice(0, 16) : ""
    });
    setHackathonModalOpen(true);
  };

  const handleSaveHackathon = async () => {
    if (!hackathonForm.name || !hackathonForm.slug) {
      toast("Name and URL slug are required.", "error");
      return;
    }
    const slugFormat = /^[a-z0-9-]+$/;
    if (!slugFormat.test(hackathonForm.slug)) {
      toast("Slug must contain only lowercase letters, numbers, and dashes.", "error");
      return;
    }

    if (Number(hackathonForm.maxTeamSize) > 3) {
      toast("Max team size cannot be greater than 3.", "error");
      return;
    }

    try {
      const data: Omit<Hackathon, "id" | "createdAt"> = {
        name: hackathonForm.name,
        slug: hackathonForm.slug,
        description: hackathonForm.description,
        venue: hackathonForm.venue,
        startDate: new Date(hackathonForm.startDate).toISOString(),
        endDate: new Date(hackathonForm.endDate).toISOString(),
        registrationOpen: hackathonForm.registrationOpen,
        minTeamSize: Number(hackathonForm.minTeamSize),
        maxTeamSize: Number(hackathonForm.maxTeamSize),
        status: hackathonForm.status,
        createdBy: session.email || "admin@siet.edu",
        problemStatementRevealTime: hackathonForm.problemStatementRevealTime ? new Date(hackathonForm.problemStatementRevealTime).toISOString() : "",
        resultsRevealTime: hackathonForm.resultsRevealTime ? new Date(hackathonForm.resultsRevealTime).toISOString() : "",
      };

      if (editingHackathon) {
        await updateHackathon(editingHackathon.id, data);
        toast("Hackathon updated.", "success");
      } else {
        const id = await createHackathon(data);
        if (!activeHackathonId) {
          setActiveHackathon(id);
        }
        toast("Hackathon created.", "success");
      }
      setHackathonModalOpen(false);
      setEditingHackathon(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      toast(msg, "error");
    }
  };

  const handleDeleteHackathon = async (id: string) => {
    if (confirm("Are you sure you want to delete this hackathon? This will remove all associated teams and data!")) {
      try {
        await deleteHackathon(id);
        toast("Hackathon deleted.", "info");
        if (activeHackathonId === id) {
          setActiveHackathon(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred.";
        toast(msg, "error");
      }
    }
  };

  // ─── FOOD TOKEN HANDLERS ───
  const openAddMeal = () => {
    setMealForm({
      name: "",
      type: "lunch",
      scheduledAt: new Date().toISOString().slice(0, 16),
      windowMinutes: 125,
      targetAudience: "all",
    });
    setMealModalOpen(true);
  };

  const handleSaveMeal = async () => {
    if (!mealForm.name || !mealForm.scheduledAt) {
      toast("Name and scheduled time are required.", "error");
      return;
    }
    if (!activeHackathonId) {
      toast("Please select an active hackathon first.", "error");
      return;
    }

    try {
      const data = {
        hackathonId: activeHackathonId,
        name: mealForm.name,
        type: mealForm.type,
        scheduledAt: new Date(mealForm.scheduledAt).toISOString(),
        windowMinutes: Number(mealForm.windowMinutes),
        createdBy: session.email || "admin@siet.edu",
        targetAudience: mealForm.targetAudience,
      };

      await createMeal(data);
      toast("Meal scheduled successfully.", "success");
      setMealModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      toast(msg, "error");
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (confirm("Are you sure you want to delete this meal?")) {
      try {
        await deleteMeal(id);
        toast("Meal deleted.", "info");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred.";
        toast(msg, "error");
      }
    }
  };

  const handleBulkIssueTokens = async (mealId: string, filterTarget?: "all" | "dayscholars" | "hostellers") => {
    try {
      const result = await issueMealTokens(mealId, filterTarget);
      const targetLabel = filterTarget === "dayscholars" ? " (Dayscholars only)" : filterTarget === "hostellers" ? " (Hostellers only)" : "";
      toast(`Tokens issued${targetLabel}: ${result.issued} created, ${result.skipped} skipped.`, "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred.";
      toast(msg, "error");
    }
  };
  // ─── ANNOUNCEMENT HANDLERS ───
  const handleSaveAnnouncement = () => {
    if (!annForm.title || !annForm.content) {
      toast("Title and content are required.", "error");
      return;
    }
    if (annEditId) {
      toast("Announcement updated (local).", "success");
      setAnnEditId(null);
    } else {
      addAnnouncement(annForm.title, annForm.content, annForm.type);
      toast("Announcement published!", "success");
    }
    setAnnForm({ title: "", content: "", type: "info", scheduleDate: "" });
    setAnnCreateOpen(false);
  };
  const handleEditAnnouncement = (ann: { id: string; title: string; content: string; type: "info" | "warning" | "success" }) => {
    setAnnEditId(ann.id);
    setAnnForm({ title: ann.title, content: ann.content, type: ann.type, scheduleDate: "" });
    setAnnCreateOpen(true);
  };
  const handleDeleteAnnouncement = (id: string) => {
    if (confirm("Are you sure you want to delete this announcement?")) {
      removeAnnouncement(id);
      toast("Announcement deleted.", "info");
    }
  };

  // ─── PARTICIPANT HANDLERS ───
  const handleOpenParticipantEdit = (p: Participant & { teamId: string }) => {
    setEditingParticipant(p);
    const profile = userProfiles.find((u) => u.email.toLowerCase() === p.email.toLowerCase());
    const status = (p.hostelStatus || profile?.hostelStatus || "") as "hosteller" | "dayscholar" | "";
    setParticipantForm({ name: p.name, email: p.email, isLeader: p.isLeader || false, hostelStatus: status });
    setParticipantEditOpen(true);
  };
  const handleSaveParticipant = () => {
    if (!editingParticipant) return;
    const team = teams.find(t => t.id === editingParticipant.teamId);
    if (!team) return;
    const updatedMembers = team.members.map((m) => {
      if (m.email === editingParticipant.email) {
        return {
          ...m,
          name: participantForm.name,
          email: participantForm.email,
          isLeader: participantForm.isLeader,
          hostelStatus: (participantForm.hostelStatus as "hosteller" | "dayscholar") || undefined,
        };
      }
      if (participantForm.isLeader && m.email !== editingParticipant.email) {
        return { ...m, isLeader: false };
      }
      return m;
    });
    updateTeamMembers(editingParticipant.teamId, updatedMembers);
    toast("Participant updated.", "success");
    setParticipantEditOpen(false);
    setEditingParticipant(null);
  };

  const handleDeleteParticipant = async (p: Participant & { teamId: string; teamName: string }) => {
    if (!confirm(`Permanently delete "${p.name}" (${p.email}) from the system?\n\nThis will:\n• Remove them from Firebase Auth\n• Delete their user profile\n• Remove them from team "${p.teamName}"\n• Delete their food tokens\n\nThis action cannot be undone.`)) return;

    if (isConfigured && db && auth && auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        // Find the participant's uid from userProfiles
        const userProfile = userProfiles.find(
          (u) => u.email?.toLowerCase() === p.email?.toLowerCase()
        );
        const uid = userProfile?.uid || userProfile?.id || "";
        const params = new URLSearchParams();
        if (uid) params.set("uid", uid);
        params.set("email", p.email);

        const res = await fetch(`/api/admin/participants?${params.toString()}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to delete participant.");
        }
        toast(`"${p.name}" has been fully deleted from the system.`, "success");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An error occurred.";
        toast(msg, "error");
      }
    } else {
      // Mock mode: just remove from team locally
      const team = teams.find(t => t.id === p.teamId);
      if (!team) return;
      const updatedMembers = team.members.filter(m => m.email !== p.email);
      updateTeamMembers(p.teamId, updatedMembers);
      // Also remove from userProfiles if present
      deleteProfile(p.email);
      toast(`"${p.name}" removed from ${p.teamName}.`, "success");
    }
  };


  // ─── PROBLEM STATEMENT HANDLERS ───
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);
    const file = files[0];
    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast("File too large. Max 10MB allowed.", "error");
      setUploadingFile(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const attachment: FileAttachment = {
        id: `file-${Date.now()}`,
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      };
      setPsAttachments((prev) => [...prev, attachment]);
      setUploadingFile(false);
      toast(`"${file.name}" attached successfully.`, "success");
    };
    reader.onerror = () => {
      toast("Failed to read file.", "error");
      setUploadingFile(false);
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = "";
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setPsAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    toast("Attachment removed.", "info");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadAttachment = (att: FileAttachment) => {
    const link = document.createElement("a");
    link.href = att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveProblemStatement = () => {
    if (!psForm.title || !psForm.description) {
      toast("Title and description are required.", "error");
      return;
    }
    if (psEditId) {
      updateProblemStatement(psEditId, { title: psForm.title, description: psForm.description, status: psForm.status, attachments: psAttachments });
      toast("Problem statement updated.", "success");
      setPsEditId(null);
    } else {
      addProblemStatement({ title: psForm.title, description: psForm.description, status: psForm.status, attachments: psAttachments });
      toast("Problem statement created.", "success");
    }
    setPsForm({ title: "", description: "", status: "draft" });
    setPsAttachments([]);
    setPsCreateOpen(false);
  };
  const handleEditPs = (ps: ProblemStatement) => {
    setPsEditId(ps.id);
    setPsForm({ title: ps.title, description: ps.description, status: ps.status });
    setPsAttachments(ps.attachments || []);
    setPsCreateOpen(true);
  };
  const handlePublishPs = (id: string) => {
    updateProblemStatement(id, { status: "published" });
    toast("Problem statement published.", "success");
  };
  const handleArchivePs = (id: string) => {
    archiveProblemStatement(id);
    toast("Problem statement archived.", "info");
  };
  const handleDeletePs = (id: string) => {
    if (confirm("Are you sure you want to permanently delete this problem statement? This cannot be undone.")) {
      archiveProblemStatement(id);
      toast("Problem statement deleted.", "info");
      if (expandedPs === id) setExpandedPs(null);
    }
  };
  const handleQuickAddPs = () => {
    if (!quickPsForm.title.trim() || !quickPsForm.description.trim()) {
      toast("Title and explanation are required.", "error");
      return;
    }
    setQuickPsAdding(true);
    addProblemStatement({ title: quickPsForm.title.trim(), description: quickPsForm.description.trim(), status: "draft", attachments: [] });
    toast(`"${quickPsForm.title}" added as draft.`, "success");
    setQuickPsForm({ title: "", description: "" });
    setQuickPsAdding(false);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tplForm.title.trim()) {
      toast("Title is required", "error");
      return;
    }

    const payload = {
      title: tplForm.title.trim(),
      description: tplForm.description.trim(),
      attachments: tplAttachments,
      uploadedBy: session.email || "",
    };

    addTemplate(payload);
    toast("Template published successfully.", "success");

    setTplForm({ title: "", description: "" });
    setTplAttachments([]);
    setTplCreateOpen(false);
  };

  const handleArchiveTemplate = (id: string) => {
    deleteTemplate(id);
    toast("Template removed.", "info");
  };

  // ─── PROFILE ───
  const handleSaveProfile = () => {
    if (session.email) {
      if (!profileForm.college.trim()) { toast("College Name is required.", "error"); return; }
      if (!profileForm.hostelStatus) { toast("Please select whether you are a Hosteller or Dayscholar.", "error"); return; }
      updateProfile(session.email, {
        name: profileForm.name,
        college: profileForm.college,
        hostelStatus: profileForm.hostelStatus,
        bio: profileForm.bio,
        skills: profileForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
        socialLinks: profileForm.socialLinks,
      });
      toast("Profile updated.", "success");
    }
  };

  // ─── TAB LABELS ───
  const tabLabels: Record<TabType, string> = {
    dashboard: "Dashboard",
    hackathons: "Hackathons",
    members: "Users & Roles",
    participants: "Participants",
    attendance: "Attendance",
    announcements: "Announcements",
    problems: "On-Spot Materials",
    templates: "Publish Templates",
    teams: "Team Management",
    foodTokens: "Food Tokens",
    profile: "Profile",
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "danger";
      case "organizer": return "warning";
      case "judge": return "primary";
      case "volunteer": return "success";
      default: return "primary";
    }
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <Sidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as TabType)} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen pt-20 md:pt-10">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {(Object.keys(tabLabels) as TabType[]).map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${activeTab === id
                  ? "bg-primary-green text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                }`}
            >
              {tabLabels[id]}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">
              {tabLabels[activeTab]}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5 dark:text-gray-400">
              Logged in as: <strong>{session.email}</strong> | Role: {session.role?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Hackathon Switcher */}
            <div className="flex items-center gap-1.5 mr-1">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:inline">
                Active:
              </span>
              <select
                value={activeHackathonId || ""}
                onChange={(e) => {
                  setActiveHackathon(e.target.value || null);
                }}
                className="text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:ring-2 focus:ring-primary-green/40 cursor-pointer"
              >
                <option value="">No Active Hackathon</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            {(activeTab === "announcements" || activeTab === "problems") && (
              <Button
                onClick={() => {
                  if (activeTab === "announcements") {
                    setAnnEditId(null);
                    setAnnForm({ title: "", content: "", type: "info", scheduleDate: "" });
                    setAnnCreateOpen(true);
                  } else {
                    setPsEditId(null);
                    setPsForm({ title: "", description: "", status: "draft" });
                    setPsCreateOpen(true);
                  }
                }}
                className="text-xs"
              >
                <Plus className="h-4 w-4 mr-1" /> Create
              </Button>
            )}
            {activeTab === "members" && (
              <Button onClick={openAddMember} className="text-xs">
                <UserPlus className="h-4 w-4 mr-1" /> Add Member
              </Button>
            )}
            {activeTab === "hackathons" && (
              <Button onClick={openAddHackathon} className="text-xs">
                <Plus className="h-4 w-4 mr-1" /> Create Hackathon
              </Button>
            )}
            {activeTab === "foodTokens" && (
              <Button onClick={openAddMeal} className="text-xs">
                <Plus className="h-4 w-4 mr-1" /> Schedule Meal
              </Button>
            )}
            {/* Theme toggle */}
            <ThemeToggle />
            {/* Notification Bell */}
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-green hover:text-primary-green transition-colors cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold leading-none min-w-[16px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-bold text-sm text-primary-dark dark:text-gray-100">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={() => { markAllNotificationsRead(); toast("All notifications marked as read", "info"); }}
                          className="text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                        >Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications</div>}
                      {notifications.slice(0, 10).map((n) => (
                        <div key={n.id} onClick={() => markNotificationRead(n.id)}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.read ? "bg-emerald-50/50 dark:bg-emerald-900/20" : ""}`}
                        >
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-primary-green" : "bg-gray-300 dark:bg-gray-600"}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold ${!n.read ? "text-primary-dark dark:text-gray-100" : "text-gray-500 dark:text-gray-400"}`}>{n.title}</div>
                            <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* ═══════════════════════════════════════════ DASHBOARD TAB ═══════════════════════════════════════════ */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Members", val: totalMembers, icon: <Users className="h-5 w-5 text-emerald-600" /> },
                    { label: "Total Participants", val: totalParticipants, icon: <Users className="h-5 w-5 text-blue-600" /> },
                    { label: "Active Teams", val: activeTeams, icon: <Shield className="h-5 w-5 text-purple-600" /> },
                    { label: "Published Problems", val: publishedPs, icon: <BookOpen className="h-5 w-5 text-amber-500" /> },
                  ].map((stat, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-input-border/30 bg-white shadow-sm flex items-center gap-4 dark:bg-gray-900 dark:border-gray-700">
                      <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                        {stat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider dark:text-gray-500">{stat.label}</span>
                        <span className="text-lg font-extrabold text-primary-dark dark:text-gray-100">{stat.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Firebase System Indicator, Storage Stats & Traffic Monitoring */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Firebase Status */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">Firebase System Status</h4>
                      <Badge variant={isConfigured ? "success" : "warning"}>
                        {isConfigured ? "Firebase Connected" : "Local Mock Mode"}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1 mt-1">
                      <p><strong>Auth Service:</strong> {isConfigured ? "Active & Protected" : "Mocked (InMemory)"}</p>
                      <p><strong>Firestore DB:</strong> {isConfigured ? "Synced (Realtime)" : "Mocked (LocalStorage)"}</p>
                      <p><strong>Active Sessions:</strong> {isConfigured ? "Authenticated Client Sessions" : "1 Active Session (Demo)"}</p>
                    </div>
                  </div>

                  {/* Firebase Storage Stats */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">Storage Monitoring</h4>
                      <Badge variant="info" className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider">Spark Plan (Free)</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
                      <span>Storage Utilization</span>
                      <span className="font-bold">{storageStats.formatted}</span>
                    </div>
                    {/* ProgressBar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden mt-1">
                      <div className="bg-primary-green h-full rounded-full transition-all duration-500" style={{ width: `${storageStats.percent}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
                      <span>Limit: 5.0 GB stored</span>
                      <span>Egress: 1.0 GB/day max</span>
                    </div>
                  </div>

                  {/* Traffic Monitoring */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3 dark:bg-gray-900 dark:border-gray-700">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider dark:text-gray-500">Traffic Monitoring</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-1">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Active Users</p>
                        <p className="font-bold text-primary-dark dark:text-gray-200">{trafficStats.activeConnections} online</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Request Rate</p>
                        <p className="font-bold text-primary-dark dark:text-gray-200">{trafficStats.requestsPerMin} req/min</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total Requests</p>
                        <p className="font-bold text-primary-dark dark:text-gray-200">{trafficStats.totalRequests}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5">
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Bandwidth (Egress)</p>
                        <p className="font-bold text-primary-dark dark:text-gray-200">{trafficStats.bandwidthUsed} MB</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">Realtime API hits and assets distribution</span>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 shadow-sm flex flex-col gap-4 dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2 dark:text-gray-100 dark:border-gray-700">
                    <Activity className="h-4.5 w-4.5 text-primary-green" /> Recent Activity
                  </h3>
                  <div className="flex flex-col gap-3">
                    {recentActivity.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 bg-white text-xs dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex gap-3 items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${log.type === "warning" ? "bg-amber-500" : log.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                            }`} />
                          <div>
                            <p className="font-bold text-gray-800 dark:text-gray-200">{log.action}</p>
                            <p className="text-[9px] text-gray-400 font-semibold dark:text-gray-500">{log.user}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sensitive Settings safety panel */}
                <div className="rounded-3xl border border-red-500/20 bg-red-50/5 p-5 shadow-sm flex flex-col gap-4 dark:bg-red-950/5">
                  <h3 className="text-sm font-bold text-red-650 dark:text-red-400 flex items-center gap-2 border-b border-red-500/10 pb-2">
                    <Shield className="h-4.5 w-4.5 text-red-500" /> Sensitive Settings & Safety Panel
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to rotate encryption keys? This will invalidate all active sessions.")) {
                          toast("Encryption keys rotated successfully.", "success");
                        }
                      }}
                      className="px-4 py-3 rounded-xl bg-white border border-gray-250 dark:bg-gray-900 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-amber-500 hover:text-amber-500 cursor-pointer transition-all duration-200"
                    >
                      Rotate JWT/AES Keys
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("This will force check-in status reset for all teams. Continue?")) {
                          toast("All check-in statuses have been reset.", "info");
                        }
                      }}
                      className="px-4 py-3 rounded-xl bg-white border border-gray-250 dark:bg-gray-900 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-amber-500 hover:text-amber-500 cursor-pointer transition-all duration-200"
                    >
                      Reset Check-in Statuses
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("CRITICAL WARNING: This will permanently wipe all local storage mock databases. This cannot be undone!")) {
                          localStorage.clear();
                          toast("Wiped mock databases. Reloading page...", "success");
                          setTimeout(() => window.location.reload(), 1000);
                        }
                      }}
                      className="px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold cursor-pointer transition-all duration-200"
                    >
                      Wipe Mock Databases
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* ═══════════════════════════════════════════ HACKATHONS TAB ═══════════════════════════════════════════ */}
            {activeTab === "hackathons" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-700 pb-3">
                  <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">Hackathon Profiles</h3>
                  <span className="text-xs text-gray-500 font-medium">Total: {hackathons.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hackathons.map((h) => {
                    const regLink = typeof window !== "undefined" ? `${window.location.origin}/register?h=${h.slug}` : `/register?h=${h.slug}`;
                    const isActive = activeHackathonId === h.id;
                    return (
                      <div
                        key={h.id}
                        className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 bg-white dark:bg-gray-800 ${isActive ? "border-primary-green ring-2 ring-primary-green/20" : "border-gray-100 dark:border-gray-700 hover:border-gray-250 dark:hover:border-gray-600"}`}
                      >
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h4 className="font-extrabold text-sm text-primary-dark dark:text-gray-100 flex items-center gap-1.5">
                                {h.name}
                                {isActive && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-[9px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                    Active
                                  </span>
                                )}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-mono">ID: {h.id}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${h.status === "active" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : h.status === "upcoming" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" : h.status === "ended" ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400" : "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-450"}`}>
                              {h.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{h.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 dark:border-gray-700/50 text-[10px] text-gray-400">
                            <div>
                              <strong>Dates:</strong> {new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}
                            </div>
                            <div>
                              <strong>Venue:</strong> {h.venue || "TBD"}
                            </div>
                            <div>
                              <strong>Team Limits:</strong> {h.minTeamSize || 1} to {Math.min(h.maxTeamSize || 3, 3)} members
                            </div>
                            <div>
                              <strong>Registration:</strong> {h.registrationOpen ? "Open" : "Closed"}
                            </div>
                            <div>
                              <strong>Freeze Status:</strong> {h.teamsLocked || h.status === 'ended' || h.status === 'completed' || h.status === 'archived' || (new Date().getTime() > new Date(h.endDate).getTime()) ? 'Frozen ❄️' : 'Active 🟢'}
                            </div>
                          </div>

                          <div className="mt-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 flex flex-col gap-1.5">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Registration Link:</span>
                            <div className="flex gap-2 items-center">
                              <input
                                readOnly
                                value={regLink}
                                className="flex-1 text-[10px] font-mono bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded focus:outline-none"
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-6 px-2 text-[9px]"
                                onClick={() => {
                                  navigator.clipboard.writeText(regLink);
                                  toast("Copied registration link!", "success");
                                }}
                              >
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-gray-50 dark:border-gray-700/50 justify-between items-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setActiveHackathon(h.id);
                              toast(`Switched active hackathon to "${h.name}"`, "success");
                            }}
                            className={`h-7 text-[10px] font-bold ${isActive ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 cursor-default hover:bg-emerald-50 dark:hover:bg-emerald-950/20" : ""}`}
                            disabled={isActive}
                          >
                            {isActive ? "Currently Active" : "Set Active"}
                          </Button>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                if (confirm(`Are you sure you want to ${h.teamsLocked ? 'unfreeze' : 'freeze'} teams and submissions for this hackathon?`)) {
                                  updateHackathon(h.id, { teamsLocked: !h.teamsLocked });
                                  toast(`Teams and submissions ${h.teamsLocked ? 'unfrozen' : 'frozen'} successfully.`, "success");
                                }
                              }}
                              className={`h-7 text-[10px] ${h.teamsLocked ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30' : 'text-primary-dark hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                            >
                              {h.teamsLocked ? 'Unfreeze' : 'Freeze'}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openEditHackathon(h)}
                              className="h-7 text-[10px]"
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDeleteHackathon(h.id)}
                              className="h-7 text-[10px] text-red-500 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {hackathons.length === 0 && (
                    <div className="col-span-2 py-14 text-center flex flex-col items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-3xl">⚠️</div>
                      <div>
                        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">No hackathons found</p>
                        <p className="text-xs text-gray-400 mt-1">The hackathon data may have been deleted. Restore the default or create a new one.</p>
                      </div>
                      <div className="flex gap-3 flex-wrap justify-center">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await createHackathon({
                                name: "AI Lab Hackathon 2026",
                                slug: "ai-lab-2026",
                                description: "The premier AI & ML hackathon at Sri Eshwar College of Engineering — 24-hour coding sprint with mentors, cloud GPU credits, and a ₹1,00,000 prize pool.",
                                venue: "AI Research Lab, SIET Campus",
                                startDate: "2026-07-18T09:00",
                                endDate: "2026-07-19T18:00",
                                registrationOpen: true,
                                maxTeamSize: 3,
                                minTeamSize: 2,
                                status: "active",
                                createdBy: session.email || "admin@hacklab.internal",
                                teamsLocked: false,
                                problemStatementRevealTime: "",
                                resultsRevealTime: "",
                              });
                              toast("Default hackathon restored successfully!", "success");
                            } catch (err: unknown) {
                              const msg = err instanceof Error ? err.message : "Failed to restore";
                              toast(msg, "error");
                            }
                          }}
                          className="text-xs px-4 py-2 bg-primary-green text-white"
                        >
                          🔄 Restore Default Hackathon
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={openAddHackathon}
                          className="text-xs px-4 py-2"
                        >
                          + Create New Hackathon
                        </Button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ MEMBERS TAB ═══════════════════════════════════════════ */}
            {activeTab === "members" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 border-b border-gray-150 dark:border-gray-700 pb-3">Members & Roles</h3>
                <div className="flex flex-col gap-3">
                  {members.map((m) => (
                    <div key={m.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} size="sm" />
                        <div>
                          <p className="font-extrabold text-primary-dark dark:text-gray-100">{m.name}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{m.email}</p>
                          {m.hackathonIds && m.hackathonIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {m.hackathonIds.map((hId) => {
                                const hack = hackathons.find((h) => h.id === hId);
                                return (
                                  <span key={hId} className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold uppercase">
                                    {hack?.name || hId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={roleBadgeVariant(m.role)}>{m.role.toUpperCase()}</Badge>
                        <button onClick={() => openEditMember(m)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-dark cursor-pointer transition-colors">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleRemoveMember(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ PARTICIPANTS TAB ═══════════════════════════════════════════ */}
            {activeTab === "participants" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-150 dark:border-gray-700 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">
                      All Participants
                      {isConfigured && (
                        <span className="ml-2 text-xs font-normal text-gray-400">(Live from Firebase)</span>
                      )}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Pills for Hostel Status */}
                    <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
                      <button
                        onClick={() => setParticipantHostelFilter("ALL")}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${participantHostelFilter === "ALL" ? "bg-white dark:bg-gray-700 text-primary-dark dark:text-gray-100 shadow-xs" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setParticipantHostelFilter("DAYSCHOLAR")}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${participantHostelFilter === "DAYSCHOLAR" ? "bg-emerald-500 text-white shadow-xs font-bold" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
                      >
                        <span>🎓 Dayscholars Only</span>
                      </button>
                      <button
                        onClick={() => setParticipantHostelFilter("HOSTELLER")}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${participantHostelFilter === "HOSTELLER" ? "bg-purple-600 text-white shadow-xs font-bold" : "text-gray-500 hover:text-gray-700 dark:text-gray-400"}`}
                      >
                        <span>🏢 Hostellers Only</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Search by name, email, register no..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 w-56 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                    />
                  </div>
                </div>

                {isConfigured && teams.length === 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-700 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300">
                    🔄 Waiting for Firestore data... If this persists, no teams have been registered via onboarding yet.
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Reg No.</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Residence</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Dept / Year</th>
                        <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Leader</th>
                        {isConfigured && <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account</th>}
                        <th className="py-3 px-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const MOCK_TEAM_IDS = new Set(["team-1", "team-2", "team-3"]);
                        const sourceteams = teams.filter(t => !MOCK_TEAM_IDS.has(t.id));

                        const allParticipants = sourceteams.flatMap((t) =>
                          t.members.map((m) => {
                            const profile = userProfiles.find((u) => u.email.toLowerCase() === m.email.toLowerCase());
                            const status = (m.hostelStatus || profile?.hostelStatus || "").toLowerCase();
                            return { ...m, teamName: t.name, teamId: t.id, hostelStatusResolved: status };
                          })
                        );

                        let filtered = allParticipants;
                        if (participantHostelFilter === "DAYSCHOLAR") {
                          filtered = filtered.filter((p) => p.hostelStatusResolved === "dayscholar");
                        } else if (participantHostelFilter === "HOSTELLER") {
                          filtered = filtered.filter((p) => p.hostelStatusResolved === "hosteller");
                        }

                        const query = participantSearch.toLowerCase().trim();
                        if (query) {
                          filtered = filtered.filter(
                            (p) =>
                              p.name.toLowerCase().includes(query) ||
                              p.email.toLowerCase().includes(query) ||
                              (p.registerNumber ?? "").toLowerCase().includes(query) ||
                              (p.department ?? "").toLowerCase().includes(query)
                          );
                        }

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={isConfigured ? 8 : 7} className="py-8 text-center text-gray-400 text-sm">
                                {query || participantHostelFilter !== "ALL" ? `No participants match current search / filters` : "No participants yet."}
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((p, idx) => {
                          const hasAccount = isConfigured
                            ? userProfiles.some((u) => u.email === p.email)
                            : true;

                          return (
                            <tr key={`${p.teamId}-${p.email}-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <Avatar name={p.name} size="sm" />
                                  <div>
                                    <p className="font-bold text-primary-dark dark:text-gray-100">{p.name}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.email}</p>
                                    {p.phone && <p className="text-[10px] text-gray-300 dark:text-gray-600">{p.phone}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono text-[10px]">
                                {p.registerNumber || <span className="text-gray-300">—</span>}
                              </td>
                              <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{p.teamName}</td>
                              <td className="py-3 px-3">
                                {p.hostelStatusResolved === "dayscholar" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                                    🎓 Dayscholar
                                  </span>
                                ) : p.hostelStatusResolved === "hosteller" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800">
                                    🏢 Hosteller
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-[10px] font-medium">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="text-gray-600 dark:text-gray-300">{p.department || <span className="text-gray-300">—</span>}</div>
                                {p.year && <div className="text-[10px] text-gray-400">{p.year}</div>}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {p.isLeader ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <span className="text-gray-300">—</span>
                                )}
                              </td>
                              {isConfigured && (
                                <td className="py-3 px-3 text-center">
                                  {hasAccount ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700">
                                      <CheckCircle className="h-3 w-3" /> Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
                                      No Account
                                    </span>
                                  )}
                                </td>
                              )}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleOpenParticipantEdit(p as unknown as Participant & { teamId: string })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-primary-dark cursor-pointer transition-colors" title="Edit">
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteParticipant(p as unknown as Participant & { teamId: string; teamName: string })} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" title="Remove from team">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ ANNOUNCEMENTS TAB ═══════════════════════════════════════════ */}
            {activeTab === "announcements" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 border-b border-gray-150 dark:border-gray-700 pb-3 flex items-center gap-2">
                  <Megaphone className="h-4.5 w-4.5 text-primary-green" /> Announcements
                </h3>
                <div className="flex flex-col gap-3">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex gap-3 items-start">
                          <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${ann.type === "warning" ? "bg-amber-500" : ann.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                            }`} />
                          <div>
                            <p className="font-bold text-primary-dark dark:text-gray-100">{ann.title}</p>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{ann.content}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-2">{ann.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => handleEditAnnouncement(ann)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-pointer transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 cursor-pointer transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {announcements.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No announcements yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ PROBLEM STATEMENTS TAB ═══════════════════════════════════════════ */}
            {activeTab === "problems" && (
              <div className="flex flex-col gap-5">
                {/* ── Reveal Settings ── */}
                {(() => {
                  const activeHackathon = hackathons.find(h => h.id === activeHackathonId);
                  if (!activeHackathon) return null;
                  const isRevealed = !activeHackathon.problemStatementRevealTime || new Date().getTime() >= new Date(activeHackathon.problemStatementRevealTime).getTime();
                  return (
                    <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-primary-dark dark:text-gray-100 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary-green" /> Problem Statement Reveal Time
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 max-w-md">Set a specific date & time to automatically reveal published problem statements to participants. If left empty, they are revealed immediately.</p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input
                          type="datetime-local"
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-green"
                          value={activeHackathon.problemStatementRevealTime ? new Date(new Date(activeHackathon.problemStatementRevealTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateHackathon(activeHackathon.id, { 
                              problemStatementRevealTime: val ? new Date(val).toISOString() : "" 
                            });
                            toast(val ? "Reveal time updated." : "Problem statements are now immediately visible.", "success");
                          }}
                        />
                        {activeHackathon.problemStatementRevealTime && (
                           <button
                             onClick={() => {
                               updateHackathon(activeHackathon.id, { problemStatementRevealTime: "" });
                               toast("Problem statements revealed immediately.", "success");
                             }}
                             className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-bold whitespace-nowrap cursor-pointer"
                           >
                             Reveal Now
                           </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${isRevealed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                          {isRevealed ? 'Revealed' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Results Reveal Settings ── */}
                {(() => {
                  const activeHackathon = hackathons.find(h => h.id === activeHackathonId);
                  if (!activeHackathon) return null;
                  const isRevealed = activeHackathon.resultsRevealTime && new Date().getTime() >= new Date(activeHackathon.resultsRevealTime).getTime();
                  return (
                    <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-primary-dark dark:text-gray-100 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary-green" /> Results Reveal Time
                        </h3>
                        <p className="text-[10px] text-gray-500 mt-1 max-w-md">Set a specific date & time to automatically reveal the hackathon results (leaderboard standings) to all participants.</p>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <input
                          type="datetime-local"
                          className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-green"
                          value={activeHackathon.resultsRevealTime ? new Date(new Date(activeHackathon.resultsRevealTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateHackathon(activeHackathon.id, { 
                              resultsRevealTime: val ? new Date(val).toISOString() : "" 
                            });
                            toast(val ? "Results reveal time updated." : "Results reveal time cleared.", "success");
                          }}
                        />
                        {activeHackathon.resultsRevealTime && (
                           <button
                             onClick={() => {
                               updateHackathon(activeHackathon.id, { resultsRevealTime: new Date().toISOString() });
                               toast("Results revealed immediately.", "success");
                             }}
                             className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-bold whitespace-nowrap cursor-pointer"
                           >
                             Reveal Now
                           </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${isRevealed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                          {isRevealed ? 'Revealed' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  );
                })()}



                {/* ── Inline Quick-Add Form ── */}
                <div className="rounded-3xl border-2 border-dashed border-primary-green/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary-green/10 flex items-center justify-center shrink-0">
                      <Plus className="h-4 w-4 text-primary-green" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-primary-dark dark:text-gray-100">Quick Add Problem Statement</h3>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Add one by one — saved as draft. Use the &quot;Create&quot; button above for advanced options.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Title *"
                      value={quickPsForm.title}
                      onChange={(e) => setQuickPsForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. AI-powered Smart Campus Energy Monitor"
                    />
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Statement Explanation *</label>
                      <textarea
                        rows={4}
                        value={quickPsForm.description}
                        onChange={(e) => setQuickPsForm((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Describe the problem, the context, what participants need to build, and any constraints..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleQuickAddPs}
                        className="text-xs"
                        disabled={quickPsAdding || !quickPsForm.title.trim() || !quickPsForm.description.trim()}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add as Draft
                      </Button>
                      {(quickPsForm.title || quickPsForm.description) && (
                        <button
                          onClick={() => setQuickPsForm({ title: "", description: "" })}
                          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Stats summary bar ── */}
                {problemStatements.length > 0 && (
                  <div className="flex items-center gap-3 px-1">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">All Statements ({problemStatements.length})</span>
                    <div className="flex gap-2">
                      {(["draft", "published", "archived"] as const).map((s) => {
                        const count = problemStatements.filter((p) => p.status === s).length;
                        if (!count) return null;
                        return (
                          <span key={s} className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            s === "published" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" :
                            s === "archived" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" :
                            "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          }`}>{count} {s}</span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── Problem statements list ── */}
                {problemStatements.map((ps) => {

                  const isExpanded = expandedPs === ps.id;
                  return (
                    <div key={ps.id} className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                      <button
                        onClick={() => setExpandedPs(isExpanded ? null : ps.id)}
                        className="w-full p-5 flex items-center justify-between text-left cursor-pointer bg-transparent border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Badge variant={ps.status === "published" ? "success" : ps.status === "archived" ? "danger" : "warning"}>
                            {ps.status.toUpperCase()}
                          </Badge>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-primary-dark dark:text-gray-100 truncate">{ps.title}</h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                              Created {new Date(ps.createdAt).toLocaleDateString()}
                              {ps.attachments && ps.attachments.length > 0 && ` · ${ps.attachments.length} file${ps.attachments.length > 1 ? "s" : ""}`}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform shrink-0 ml-3 ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
                          {/* Description */}
                          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Statement Explanation</p>
                            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{ps.description}</p>
                          </div>

                          {/* Attachments */}
                          {ps.attachments && ps.attachments.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                <Paperclip className="h-3 w-3" /> Attachments ({ps.attachments.length})
                              </p>
                              <div className="flex flex-col gap-2">
                                {ps.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{att.name}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatFileSize(att.size)}</p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => downloadAttachment(att)}
                                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold hover:bg-emerald-200 cursor-pointer transition-colors flex items-center gap-1"
                                    >
                                      <Download className="h-3 w-3" /> Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button onClick={() => handleEditPs(ps)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors flex items-center gap-1">
                              <Edit3 className="h-3 w-3" /> Edit
                            </button>
                            {ps.status !== "published" && (
                              <button onClick={() => handlePublishPs(ps.id)} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold hover:bg-emerald-200 cursor-pointer transition-colors flex items-center gap-1">
                                <Send className="h-3 w-3" /> Publish
                              </button>
                            )}
                            {ps.status === "published" && (
                              <button onClick={() => handleArchivePs(ps.id)} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-bold hover:bg-amber-200 cursor-pointer transition-colors flex items-center gap-1">
                                <Archive className="h-3 w-3" /> Archive
                              </button>
                            )}
                            <button onClick={() => handleDeletePs(ps.id)} className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 text-[11px] font-bold hover:bg-red-100 dark:hover:bg-red-900/40 cursor-pointer transition-colors flex items-center gap-1 ml-auto">
                              <Trash2 className="h-3 w-3" /> Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {problemStatements.length === 0 && (
                  <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-10 text-center shadow-sm">
                    <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">No problem statements yet. Use the quick-add form above or click &quot;Create&quot; for advanced options.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ TEMPLATES TAB ═══════════════════════════════════════════ */}
            {activeTab === "templates" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">Publish Templates</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload PPT templates and resources for participants.</p>
                  </div>
                  <button
                    onClick={() => {
                      setTplForm({ title: "", description: "" });
                      setTplAttachments([]);
                      setTplCreateOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    <Plus className="h-4 w-4" /> Upload Template
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-150 dark:border-gray-800 p-4 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate">{tpl.title}</h4>
                          <p className="text-[10px] text-gray-500">{new Date(tpl.createdAt).toLocaleString()}</p>
                        </div>
                        <button
                          onClick={() => handleArchiveTemplate(tpl.id)}
                          className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 flex-1">{tpl.description}</p>
                      
                      {tpl.attachments && tpl.attachments.length > 0 && (
                        <div className="mt-auto space-y-1.5">
                          {tpl.attachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.dataUrl}
                              download={file.name}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{file.name}</span>
                              </div>
                              <Download className="h-3.5 w-3.5 text-gray-400 group-hover:text-blue-500 shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {templates.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
                    <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No templates published.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ ATTENDANCE TAB ═══════════════════════════════════════════ */}
            {activeTab === "attendance" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">Team Attendance Register</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Overview of team check-ins.</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-gray-150 dark:border-gray-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Team</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Problem Statement</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Status</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Checked In By</th>
                          <th className="py-3 px-4 font-bold text-xs uppercase tracking-wider">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                        {teams.filter(t => t.status === "APPROVED").map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900 dark:text-gray-100">{t.name}</div>
                              <div className="text-[10px] text-gray-500">{t.members.length} members</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold">
                                {problemStatements.find(ps => ps.id === t.problemStatementId)?.title || "N/A"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant={t.attendance?.checkedIn ? "success" : "warning"}>
                                {t.attendance?.checkedIn ? "Checked In" : "Pending"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                              {t.attendance?.checkInBy || "-"}
                            </td>
                            <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-xs">
                              {t.attendance?.checkInTime ? (
                                isNaN(new Date(t.attendance.checkInTime).getTime())
                                  ? t.attendance.checkInTime
                                  : new Date(t.attendance.checkInTime).toLocaleString()
                              ) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {/* ═══════════════════════════════════════════ FOOD TOKENS TAB ═══════════════════════════════════════════ */}
            {activeTab === "foodTokens" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-700 pb-3">
                  <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">Food Meals & Tokens</h3>
                  <span className="text-xs text-gray-500 font-medium">Scheduled: {foodMeals.length}</span>
                </div>

                {!activeHackathonId ? (
                  <div className="py-12 text-center text-xs text-gray-400">
                    Please select an active hackathon in the header to manage meals and issue tokens.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Meals List */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Scheduled Meals</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {foodMeals.map((m) => {
                          const isPast = new Date(m.scheduledAt).getTime() + m.windowMinutes * 60000 < Date.now();
                          const countTokens = foodTokens.filter((t) => t.mealId === m.id).length;
                          const countRedeemed = foodTokens.filter((t) => t.mealId === m.id && t.status === "redeemed").length;

                          return (
                            <div key={m.id} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-extrabold text-sm text-primary-dark dark:text-gray-150">{m.name}</h5>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-400 capitalize">{m.type}</span>
                                    {m.targetAudience && m.targetAudience !== "all" && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase tracking-wide">
                                        {m.targetAudience === "dayscholars" ? "🎓 Dayscholars Only" : "🏢 Hostellers Only"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isPast ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                                  {isPast ? "Expired" : "Active"}
                                </span>
                              </div>

                              <div className="text-[11px] text-gray-400 space-y-1">
                                <p><strong>Scheduled:</strong> {new Date(m.scheduledAt).toLocaleString()}</p>
                                <p><strong>Window:</strong> {m.windowMinutes} minutes</p>
                                <p><strong>Issued Tokens:</strong> {countTokens}</p>
                                <p><strong>Redeemed:</strong> {countRedeemed} / {countTokens} ({countTokens > 0 ? Math.round((countRedeemed/countTokens)*100) : 0}%)</p>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target:</span>
                                  <select
                                    value={mealTargetMap[m.id] ?? m.targetAudience ?? "all"}
                                    onChange={(e) => setMealTargetMap((prev) => ({ ...prev, [m.id]: e.target.value as "all" | "dayscholars" | "hostellers" }))}
                                    className="text-xs py-1 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-green"
                                  >
                                    <option value="all">All Participants</option>
                                    <option value="dayscholars">Dayscholars Only 🎓</option>
                                    <option value="hostellers">Hostellers Only 🏢</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleBulkIssueTokens(m.id, mealTargetMap[m.id] ?? m.targetAudience ?? "all")}
                                    className="h-7 text-[10px] bg-primary-green hover:bg-emerald-600 text-white font-bold"
                                  >
                                    Publish / Issue Tokens
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleDeleteMeal(m.id)}
                                    className="h-7 text-[10px] text-red-500 hover:bg-red-50"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {foodMeals.length === 0 && (
                          <div className="col-span-2 py-8 text-center text-xs text-gray-400">
                            No meals scheduled. Click &quot;Schedule Meal&quot; in the header.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tokens List / Audit Log */}
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Issued Tokens & Redemption Log</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={tokenResidenceFilter}
                            onChange={(e) => setTokenResidenceFilter(e.target.value as "ALL" | "DAYSCHOLAR" | "HOSTELLER")}
                            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-150 focus:outline-none font-semibold"
                          >
                            <option value="ALL">All Residence Types</option>
                            <option value="DAYSCHOLAR">Dayscholars Only 🎓</option>
                            <option value="HOSTELLER">Hostellers Only 🏢</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Search by name/email/code..."
                            value={tokenSearch}
                            onChange={(e) => setTokenSearch(e.target.value)}
                            className="text-xs px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-150 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 dark:bg-gray-800/80 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Participant</th>
                              <th className="px-4 py-3">Meal</th>
                              <th className="px-4 py-3">Token Code</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Redeemed At</th>
                              <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {foodTokens
                              .filter((t) => {
                                if (tokenResidenceFilter !== "ALL") {
                                  const userProf = userProfiles.find((u) => u.email.toLowerCase() === t.participantEmail.toLowerCase());
                                  let statusStr = (userProf?.hostelStatus || "").toLowerCase();
                                  if (!statusStr) {
                                    for (const team of teams) {
                                      const mem = team.members.find((m) => m.email.toLowerCase() === t.participantEmail.toLowerCase());
                                      if (mem?.hostelStatus) {
                                        statusStr = mem.hostelStatus.toLowerCase();
                                        break;
                                      }
                                    }
                                  }
                                  if (tokenResidenceFilter === "DAYSCHOLAR" && statusStr !== "dayscholar") return false;
                                  if (tokenResidenceFilter === "HOSTELLER" && statusStr !== "hosteller") return false;
                                }
                                if (!tokenSearch) return true;
                                const queryStr = tokenSearch.toLowerCase();
                                return (
                                  t.participantName.toLowerCase().includes(queryStr) ||
                                  t.participantEmail.toLowerCase().includes(queryStr) ||
                                  t.tokenCode.toLowerCase().includes(queryStr) ||
                                  (t.registerNumber && t.registerNumber.toLowerCase().includes(queryStr))
                                );
                              })
                              .slice(0, 50)
                              .map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-primary-dark dark:text-gray-150">{t.participantName}</div>
                                    <div className="text-[10px] text-gray-400">{t.participantEmail}</div>
                                  </td>
                                  <td className="px-4 py-3">{t.mealName}</td>
                                  <td className="px-4 py-3 font-mono text-[10px] font-bold">{t.tokenCode}</td>
                                  <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${t.status === "redeemed" ? "bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400" : "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400"}`}>
                                      {t.status.toUpperCase()}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-[10px] text-gray-400">
                                    {t.redeemedAt ? new Date(t.redeemedAt).toLocaleString() : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => {
                                        if (confirm("Revoke this token?")) {
                                          revokeToken(t.id);
                                          toast("Token revoked.", "info");
                                        }
                                      }}
                                      className="h-6 text-[9px] text-red-500 hover:bg-red-50"
                                    >
                                      Revoke
                                    </Button>
                                  </td>
                                </tr>
                              ))}

                            {foodTokens.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center py-6 text-gray-400">
                                  No tokens issued yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ TEAMS TAB ═══════════════════════════════════════════ */}
            {activeTab === "teams" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">

                {/* Header + filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-150 dark:border-gray-700 pb-4">
                  <h3 className="text-base font-bold text-primary-dark dark:text-gray-100">
                    Team Management
                    {isConfigured && <span className="ml-2 text-xs font-normal text-gray-400">(Live from Firebase)</span>}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search teams..."
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      className="text-xs border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 w-48 bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/40"
                    />
                    {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setTeamStatusFilter(s)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border cursor-pointer transition-all ${
                          teamStatusFilter === s
                            ? "bg-primary-green text-white border-primary-green"
                            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-primary-green/40"
                        }`}
                      >
                        {s === "ALL" ? `All (${teams.length})` : `${s} (${teams.filter(t => t.status === s).length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teams list */}
                <div className="flex flex-col gap-3">
                  {(() => {
                    const MOCK_IDS = new Set(["team-1", "team-2", "team-3"]);
                    const sourceTeams = teams.filter(t => !MOCK_IDS.has(t.id));
                    const q = teamSearch.toLowerCase().trim();
                    const filtered = sourceTeams
                      .filter(t => teamStatusFilter === "ALL" || t.status === teamStatusFilter)
                      .filter(t => !q || t.name.toLowerCase().includes(q) || t.members.some(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)));

                    if (filtered.length === 0) {
                      return (
                        <p className="text-center text-gray-400 text-sm py-8">
                          {isConfigured && sourceTeams.length === 0
                            ? "No teams have been registered via onboarding yet."
                            : q ? `No teams match "${teamSearch}"` : `No ${teamStatusFilter.toLowerCase()} teams.`}
                        </p>
                      );
                    }

                    return filtered.map((team) => {
                      const leader = team.members.find(m => m.isLeader) || team.members[0];
                      const statusColor = team.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700"
                        : team.status === "REJECTED"
                        ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700"
                        : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700";

                      return (
                        <div key={team.id} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col gap-3">
                          {/* Team header row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {team.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-extrabold text-sm text-primary-dark dark:text-gray-100">{team.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                                  {leader && ` · Leader: ${leader.name}`}
                                </p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  <span className="font-bold">Problem:</span> {problemStatements.find(ps => ps.id === team.problemStatementId)?.title || "Not selected yet"}
                                </p>
                                <p className="text-[10px] text-gray-300 dark:text-gray-600">
                                  Registered: {new Date(team.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${statusColor}`}>
                                {team.status || "PENDING"}
                              </span>
                              <button
                                onClick={() => { setManagingTeam(team); setTeamDetailOpen2(true); }}
                                className="text-[10px] font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-primary-green/50 hover:text-primary-green cursor-pointer transition-all"
                              >
                                View Details
                              </button>
                              {team.status !== "APPROVED" && (
                                <button
                                  onClick={() => { approveTeam(team.id); toast(`Team "${team.name}" approved.`, "success"); }}
                                  className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transition-colors"
                                >
                                  Approve
                                </button>
                              )}
                              {team.status !== "REJECTED" && (
                                <button
                                  onClick={() => { rejectTeam(team.id); toast(`Team "${team.name}" rejected.`, "error"); }}
                                  className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-colors"
                                >
                                  Reject
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  if (!confirm(`Permanently delete team "${team.name}" and all its data? This cannot be undone.`)) return;
                                  await deleteTeam(team.id);
                                  toast(`Team "${team.name}" deleted.`, "success");
                                }}
                                className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-red-50 dark:bg-gray-700 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Members mini-list */}
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-50 dark:border-gray-700/50">
                            {team.members.map((m, i) => (
                              <div key={i} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1">
                                <Avatar name={m.name} size="sm" />
                                <div>
                                  <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-200">{m.name}</p>
                                  <p className="text-[9px] text-gray-400">{m.email}</p>
                                </div>
                                {m.isLeader && (
                                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded dark:bg-emerald-900/30 dark:text-emerald-400">LEAD</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Team Detail Modal */}
            {teamDetailOpen2 && managingTeam && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setTeamDetailOpen2(false)}>
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-primary-dark dark:text-gray-100">{managingTeam.name}</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{managingTeam.id}</p>
                    </div>
                    <button onClick={() => setTeamDetailOpen2(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="p-6 space-y-5">
                    {/* Status + Actions */}
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        managingTeam.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400"
                          : managingTeam.status === "REJECTED"
                          ? "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                      }`}>{managingTeam.status || "PENDING"}</span>
                      {managingTeam.status !== "APPROVED" && (
                        <button onClick={() => { approveTeam(managingTeam.id); setManagingTeam({...managingTeam, status: "APPROVED"}); toast("Team approved.", "success"); }}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer">Approve</button>
                      )}
                      {managingTeam.status !== "REJECTED" && (
                        <button onClick={() => { rejectTeam(managingTeam.id); setManagingTeam({...managingTeam, status: "REJECTED"}); toast("Team rejected.", "error"); }}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 cursor-pointer">Reject</button>
                      )}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {[
                        { label: "Team Size", val: `${managingTeam.members.length} members` },
                        { label: "Registered", val: new Date(managingTeam.createdAt).toLocaleString() },
                        { label: "Payment", val: managingTeam.paymentVerified ? "Verified ✅" : "Not Verified ❌" },
                        { label: "Check-in", val: managingTeam.attendance?.checkedIn ? "Checked In ✅" : "Not Arrived" },
                        { label: "Idea Submitted", val: managingTeam.ideaSubmitted ? "Yes ✅" : "No" },
                        { label: "Problem Statement", val: problemStatements.find(ps => ps.id === managingTeam.problemStatementId)?.title || "Not selected yet" },
                      ].map(({label, val}) => (
                        <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
                          <p className="font-semibold text-gray-700 dark:text-gray-200">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Members */}
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Members</p>
                      <div className="space-y-2">
                        {managingTeam.members.map((m, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs">
                            <Avatar name={m.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 dark:text-gray-100">{m.name} {m.isLeader && <span className="text-emerald-600 text-[9px] font-bold ml-1">LEADER</span>}</p>
                              <p className="text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                              <p className="text-gray-300 dark:text-gray-600">{m.registerNumber && `${m.registerNumber} · `}{m.department}{m.year && ` · ${m.year}`}</p>
                            </div>
                            {m.phone && <p className="text-gray-400 shrink-0">{m.phone}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {managingTeam.projectDescription && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Project Description</p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">{managingTeam.projectDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "profile" && (
              <div className="flex flex-col gap-6 max-w-xl">
                <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-6 shadow-sm flex flex-col gap-5">
                  <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 border-b border-gray-150 dark:border-gray-700 pb-2">Edit Profile</h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Email</label>
                      <input
                        type="email"
                        value={session.email || ""}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed.</p>
                    </div>
                    <Input
                      label="Display Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your display name"
                    />
                    <Input
                      label="College Name"
                      value={profileForm.college}
                      onChange={(e) => setProfileForm((p) => ({ ...p, college: e.target.value }))}
                      placeholder="e.g. SIET"
                    />
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                        Hosteller / Dayscholar
                      </label>
                      <select
                        value={profileForm.hostelStatus}
                        onChange={(e) => setProfileForm((p) => ({ ...p, hostelStatus: e.target.value as "hosteller" | "dayscholar" }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Select status</option>
                        <option value="hosteller">Hosteller</option>
                        <option value="dayscholar">Dayscholar</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Bio</label>
                      <textarea
                        rows={3}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="A short bio about yourself..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <Input
                      label="Skills (comma separated)"
                      value={profileForm.skills}
                      onChange={(e) => setProfileForm((p) => ({ ...p, skills: e.target.value }))}
                      placeholder="e.g. React, Python, ML"
                    />
                    <Button onClick={handleSaveProfile} className="text-xs mt-2">Save Profile</Button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ═══════════════════════════ MODALS ═══════════════════════════ */}

      {/* Member Modal */}
      <Modal isOpen={memberModalOpen} onClose={() => { setMemberModalOpen(false); setEditingMember(null); }} title={editingMember ? "Edit Member" : "Add Member"}>
        <div className="space-y-4">
          <Input
            label="Name *"
            value={memberForm.name}
            onChange={(e) => setMemberForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Full name"
          />
          <Input
            label="Email *"
            type="email"
            value={memberForm.email}
            onChange={(e) => setMemberForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="email@srishakthi.ac.in"
          />
          <Input
            label={editingMember ? "Change Password (optional)" : "Password *"}
            type="password"
            value={memberForm.password}
            onChange={(e) => setMemberForm((p) => ({ ...p, password: e.target.value }))}
            placeholder={editingMember ? "Leave blank to keep unchanged" : "Min 6 characters"}
          />
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Role</label>
            <select
              value={memberForm.role}
              onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value as Member["role"] }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer"
            >
              <option value="admin">Admin</option>
              <option value="organizer">Organizer</option>
              <option value="judge">Judge</option>
              <option value="volunteer">Volunteer</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Assigned Hackathons</label>
            <div className="space-y-2 max-h-32 overflow-y-auto p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {hackathons.map((h) => {
                const checked = memberForm.hackathonIds?.includes(h.id) ?? false;
                return (
                  <label key={h.id} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const newIds = e.target.checked
                          ? [...(memberForm.hackathonIds || []), h.id]
                          : (memberForm.hackathonIds || []).filter((id) => id !== h.id);
                        setMemberForm((prev) => ({ ...prev, hackathonIds: newIds }));
                      }}
                      className="rounded border-gray-350 text-primary-green focus:ring-primary-green/30"
                    />
                    {h.name}
                  </label>
                );
              })}
              {hackathons.length === 0 && (
                <div className="text-[10px] text-gray-400">No hackathons available.</div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveMember} className="flex-1 text-xs">
              {editingMember ? "Update" : "Add Member"}
            </Button>
            {editingMember && (
              <Button variant="danger" onClick={() => handleRemoveMember(editingMember.id)} className="text-xs">
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Hackathon Modal */}
      <Modal
        isOpen={hackathonModalOpen}
        onClose={() => {
          setHackathonModalOpen(false);
          setEditingHackathon(null);
        }}
        title={editingHackathon ? "Edit Hackathon" : "Create Hackathon"}
      >
        <div className="space-y-4">
          <Input
            label="Hackathon Name *"
            value={hackathonForm.name}
            onChange={(e) => setHackathonForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. HackMIT 2026"
          />
          <Input
            label="URL Slug (lowercase, no spaces) *"
            value={hackathonForm.slug}
            onChange={(e) => setHackathonForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
            placeholder="e.g. hackmit-2026"
          />
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide block mb-1.5">
              Description
            </label>
            <textarea
              value={hackathonForm.description}
              onChange={(e) => setHackathonForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Provide a brief summary of the hackathon..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
              rows={3}
            />
          </div>
          <Input
            label="Venue"
            value={hackathonForm.venue}
            onChange={(e) => setHackathonForm((p) => ({ ...p, venue: e.target.value }))}
            placeholder="e.g. Main Seminar Hall"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date *"
              type="datetime-local"
              value={hackathonForm.startDate}
              onChange={(e) => setHackathonForm((p) => ({ ...p, startDate: e.target.value }))}
            />
            <Input
              label="End Date *"
              type="datetime-local"
              value={hackathonForm.endDate}
              onChange={(e) => setHackathonForm((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Team Size"
              type="number"
              value={hackathonForm.minTeamSize}
              onChange={(e) => setHackathonForm((p) => ({ ...p, minTeamSize: Number(e.target.value) }))}
            />
            <Input
              label="Max Team Size"
              type="number"
              max={3}
              value={hackathonForm.maxTeamSize}
              onChange={(e) => setHackathonForm((p) => ({ ...p, maxTeamSize: Math.min(Number(e.target.value), 3) }))}
            />
          </div>
          <Input
            label="Problem Statement Reveal Time (Optional)"
            type="datetime-local"
            value={hackathonForm.problemStatementRevealTime}
            onChange={(e) => setHackathonForm((p) => ({ ...p, problemStatementRevealTime: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide block mb-1.5">
                Status
              </label>
              <select
                value={hackathonForm.status}
                onChange={(e) => setHackathonForm((p) => ({ ...p, status: e.target.value as Hackathon["status"] }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hackathonForm.registrationOpen}
                  onChange={(e) => setHackathonForm((p) => ({ ...p, registrationOpen: e.target.checked }))}
                  className="rounded border-gray-300 text-primary-green focus:ring-primary-green/30"
                />
                Registration Open
              </label>
            </div>
          </div>
          <div className="pt-2">
            <Button onClick={handleSaveHackathon} className="w-full text-xs py-3">
              {editingHackathon ? "Update Hackathon" : "Create Hackathon"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Meal Modal */}
      <Modal
        isOpen={mealModalOpen}
        onClose={() => setMealModalOpen(false)}
        title="Schedule Meal"
      >
        <div className="space-y-4">
          <Input
            label="Meal Name *"
            value={mealForm.name}
            onChange={(e) => setMealForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Day 1 Lunch"
          />
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide block mb-1.5">
              Meal Type
            </label>
            <select
              value={mealForm.type}
              onChange={(e) => setMealForm((p) => ({ ...p, type: e.target.value as FoodMeal["type"] }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack/Refreshments</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide block mb-1.5">
              Target Audience Filter
            </label>
            <select
              value={mealForm.targetAudience}
              onChange={(e) => setMealForm((p) => ({ ...p, targetAudience: e.target.value as "all" | "dayscholars" | "hostellers" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 font-semibold"
            >
              <option value="all">All Participants (Hostellers & Dayscholars)</option>
              <option value="dayscholars">Dayscholars Only 🎓</option>
              <option value="hostellers">Hostellers Only 🏢</option>
            </select>
          </div>
          <Input
            label="Scheduled Date & Time *"
            type="datetime-local"
            value={mealForm.scheduledAt}
            onChange={(e) => setMealForm((p) => ({ ...p, scheduledAt: e.target.value }))}
          />
          <Input
            label="Validity Window (Minutes)"
            type="number"
            value={mealForm.windowMinutes}
            onChange={(e) => setMealForm((p) => ({ ...p, windowMinutes: Number(e.target.value) }))}
            placeholder="e.g. 120"
          />
          <div className="pt-2">
            <Button onClick={handleSaveMeal} className="w-full text-xs py-3">
              Schedule Meal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Participant Edit Modal */}
      <Modal isOpen={participantEditOpen} onClose={() => { setParticipantEditOpen(false); setEditingParticipant(null); }} title="Edit Participant">
        <div className="space-y-4">
          <Input
            label="Name *"
            value={participantForm.name}
            onChange={(e) => setParticipantForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Participant Name"
          />
          <Input
            label="Email *"
            type="email"
            value={participantForm.email}
            onChange={(e) => setParticipantForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="email@srishakthi.ac.in"
          />
          <div>
            <label className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide block mb-1.5">
              Residence Status
            </label>
            <select
              value={participantForm.hostelStatus}
              onChange={(e) => setParticipantForm((p) => ({ ...p, hostelStatus: e.target.value as "hosteller" | "dayscholar" | "" }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 font-semibold"
            >
              <option value="">Not Specified</option>
              <option value="dayscholar">Dayscholar 🎓</option>
              <option value="hosteller">Hosteller 🏢</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isLeader"
              checked={participantForm.isLeader}
              onChange={(e) => setParticipantForm((p) => ({ ...p, isLeader: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-primary-green focus:ring-primary-green cursor-pointer"
            />
            <label htmlFor="isLeader" className="text-sm font-bold text-gray-700 dark:text-gray-200 cursor-pointer">
              Team Leader
            </label>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Checking this will automatically remove the leader status from the current leader.</p>
          <div className="pt-2">
            <Button onClick={handleSaveParticipant} className="w-full text-xs">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>


      {/* Announcement Create/Edit Modal */}
      <Modal isOpen={annCreateOpen} onClose={() => { setAnnCreateOpen(false); setAnnEditId(null); }} title={annEditId ? "Edit Announcement" : "Create Announcement"}>
        <div className="space-y-4">
          <Input
            label="Title *"
            value={annForm.title}
            onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Announcement title"
          />
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Content *</label>
            <textarea
              rows={4}
              value={annForm.content}
              onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="Write your announcement here..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Type</label>
            <select
              value={annForm.type}
              onChange={(e) => setAnnForm((p) => ({ ...p, type: e.target.value as "info" | "warning" | "success" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer"
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Schedule Date (optional)</label>
            <input
              type="date"
              value={annForm.scheduleDate}
              onChange={(e) => setAnnForm((p) => ({ ...p, scheduleDate: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Scheduling is a future feature. Date is saved but not yet used.</p>
          </div>
          <Button onClick={handleSaveAnnouncement} className="w-full text-xs">
            {annEditId ? "Update Announcement" : "Publish Announcement"}
          </Button>
        </div>
      </Modal>

      {/* Problem Statement Create/Edit Modal */}
      <Modal isOpen={psCreateOpen} onClose={() => { setPsCreateOpen(false); setPsEditId(null); setPsAttachments([]); }} title={psEditId ? "Edit Problem Statement" : "Create Problem Statement"}>
        <div className="space-y-4">
          <Input
            label="Title *"
            value={psForm.title}
            onChange={(e) => setPsForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Problem statement title"
          />
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Description *</label>
            <textarea
              rows={5}
              value={psForm.description}
              onChange={(e) => setPsForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Describe the problem statement..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Status</label>
            <select
              value={psForm.status}
              onChange={(e) => setPsForm((p) => ({ ...p, status: e.target.value as "draft" | "published" | "archived" }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* ─── FILE UPLOAD ZONE ─── */}
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Attachments (PPT, Dataset, Docs)</label>
            <label
              className={`flex flex-col items-center justify-center w-full px-4 py-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${uploadingFile
                  ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 dark:border-gray-700 hover:border-primary-green hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10"
                }`}
            >
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".ppt,.pptx,.pdf,.csv,.xlsx,.xls,.zip,.rar,.doc,.docx,.txt,.json,.py,.ipynb,.png,.jpg,.jpeg"
                disabled={uploadingFile}
              />
              {uploadingFile ? (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold">Processing file...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-1.5" />
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Click to upload or drag & drop</span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">PPT, PDF, CSV, XLSX, ZIP, DOCX, Images — Max 10MB each</span>
                </>
              )}
            </label>

            {/* Attached Files List */}
            {psAttachments.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {psAttachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-700 dark:text-gray-200 truncate">{att.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatFileSize(att.size)}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 cursor-pointer transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSaveProblemStatement} className="w-full text-xs">
            {psEditId ? "Update" : "Create Problem Statement"}
          </Button>
        </div>
      </Modal>

      {/* ─── CREATE TEMPLATE MODAL ─── */}
      <Modal isOpen={tplCreateOpen} onClose={() => { setTplCreateOpen(false); setTplForm({ title: "", description: "" }); setTplAttachments([]); }} title="Upload Template">
        <form onSubmit={handleSaveTemplate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Template Title *</label>
            <input type="text" required value={tplForm.title} onChange={(e) => setTplForm({ ...tplForm, title: e.target.value })}
              placeholder="e.g. Official Pitch Deck Template" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Description</label>
            <textarea rows={3} value={tplForm.description} onChange={(e) => setTplForm({ ...tplForm, description: e.target.value })}
              placeholder="Describe this template..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Attachments</label>
            <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input type="file" multiple id="tpl-upload-admin" className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setUploadingFile(true);
                    Array.from(e.target.files).forEach(file => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setTplAttachments(prev => [...prev, {
                          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          dataUrl: ev.target?.result as string,
                          uploadedAt: new Date().toISOString()
                        }]);
                      };
                      reader.readAsDataURL(file);
                    });
                    setUploadingFile(false);
                  }
                }}
              />
              <label htmlFor="tpl-upload-admin" className="cursor-pointer flex flex-col items-center">
                <Paperclip className="h-6 w-6 text-gray-400 mb-2" />
                <span className="text-sm font-semibold text-primary-dark dark:text-gray-100">Click to upload files</span>
                <span className="text-xs text-gray-500 mt-1">PPTX, PDF, DOCX (Max 10MB)</span>
              </label>
            </div>
            {tplAttachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {tplAttachments.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 overflow-hidden text-xs">
                      <FileText className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="truncate font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                      <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button type="button" onClick={() => setTplAttachments(tplAttachments.filter(a => a.id !== file.id))} className="p-1 text-gray-400 hover:text-red-500 cursor-pointer rounded">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2">
            <button type="submit" disabled={uploadingFile}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer disabled:opacity-50">
              {uploadingFile ? "Uploading..." : "Publish Template"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Team Detail Modal */}
      <Modal isOpen={teamDetailOpen} onClose={() => { setTeamDetailOpen(false); setDetailTeam(null); }} title="Team Details">
        {detailTeam && (
          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {detailTeam.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h4 className="font-extrabold text-primary-dark dark:text-gray-100">{detailTeam.name}</h4>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{detailTeam.size} members · {problemStatements.find((ps) => ps.id === detailTeam.problemStatementId)?.title || "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Created</p>
                <p className="font-bold text-primary-dark dark:text-gray-100">{new Date(detailTeam.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Attendance</p>
                <p className={`font-bold ${detailTeam.attendance?.checkedIn ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                  {detailTeam.attendance?.checkedIn ? "Checked In" : "Not Arrived"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Members</p>
              <div className="flex flex-col gap-2">
                {detailTeam.members.map((m) => (
                  <div key={m.email} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-xs">
                    <Avatar name={m.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-primary-dark dark:text-gray-100">{m.name} {m.isLeader && <span className="text-[10px] text-amber-600 dark:text-amber-400">(Leader)</span>}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{m.email} · {m.department} · {m.hostelStatus ? (m.hostelStatus === "hosteller" ? "Hosteller" : "Dayscholar") : "N/A"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {detailTeam.projectDescription && (
              <div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Project</p>
                <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">{detailTeam.projectDescription}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
