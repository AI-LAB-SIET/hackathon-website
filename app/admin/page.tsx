"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { QRScanner } from "@/components/ui/QRScanner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Megaphone,
  CheckCircle,
  QrCode,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  BookOpen,
  Archive,
  Send,
  Pencil,
  Plus,
  Activity,
  Bell,
} from "lucide-react";
import { Team, ProblemStatement } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

type TabType = "dashboard" | "members" | "participants" | "announcements" | "problems" | "scanner" | "teams" | "profile";
type ProfileTabType = "edit" | "appearance";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "organizer" | "volunteer" | "judge" | "mentor" | "admin";
}

export default function AdminDashboard() {
  const router = useRouter();
  const {
    session, teams, announcements, problemStatements, notifications,
    addAnnouncement, addProblemStatement, updateProblemStatement, archiveProblemStatement,
    markNotificationRead, markAllNotificationsRead,
    updateProfile, getProfile,
  } = useAppState();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [profileTab, setProfileTab] = useState<ProfileTabType>("edit");

  // Members local state
  const [members, setMembers] = useState<Member[]>([
    { id: "m-1", name: "System Admin", email: "admin@college.edu", role: "admin" },
    { id: "m-2", name: "Prof. Suresh Kumar", email: "organizer@college.edu", role: "organizer" },
    { id: "m-3", name: "Dr. A. Rajesh", email: "mentor@college.edu", role: "mentor" },
    { id: "m-4", name: "Dr. Priya Rajan", email: "judge@college.edu", role: "judge" },
    { id: "m-5", name: "Riya Verma", email: "riya@college.edu", role: "volunteer" },
    { id: "m-6", name: "Arjun Nair", email: "arjun@college.edu", role: "volunteer" },
  ]);
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberForm, setMemberForm] = useState({ name: "", email: "", role: "organizer" as Member["role"] });

  // Announcement form
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "info" as "info" | "warning" | "success", scheduleDate: "" });
  const [annEditId, setAnnEditId] = useState<string | null>(null);
  const [annCreateOpen, setAnnCreateOpen] = useState(false);

  // Problem statement form
  const [psForm, setPsForm] = useState({ title: "", description: "", trackId: "gen-ai", status: "draft" as "draft" | "published" | "archived" });
  const [psEditId, setPsEditId] = useState<string | null>(null);
  const [psCreateOpen, setPsCreateOpen] = useState(false);
  const [expandedPs, setExpandedPs] = useState<string | null>(null);

  // QR Scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Approved team detail modal
  const [teamDetailOpen, setTeamDetailOpen] = useState(false);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);

  // Profile form
  const profile = getProfile(session.email || "");
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || session.name || "",
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
        bio: profile.bio || "",
        skills: profile.skills?.join(", ") || "",
        socialLinks: profile.socialLinks || [],
      });
    }
  }, [profile, session.name]);

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
  const approvedTeams = teams.filter((t) => t.status === "APPROVED");
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Recent activity (simplified audit log)
  const recentActivity = [
    { id: 1, time: "Just now", user: "admin@college.edu", action: "Reviewed team registration", type: "info" as const },
    { id: 2, time: "5 mins ago", user: "organizer@college.edu", action: "Approved registration for team 'AI Visionaries'", type: "success" as const },
    { id: 3, time: "20 mins ago", user: "judge@college.edu", action: "Graded 'Code Crusaders' (Avg 8.5/10)", type: "success" as const },
    { id: 4, time: "1 hour ago", user: "mentor@college.edu", action: "Scheduled office hour session", type: "info" as const },
    { id: 5, time: "2 hours ago", user: "admin@college.edu", action: "Published new problem statement", type: "warning" as const },
  ];

  // ─── MEMBER HANDLERS ───
  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm({ name: "", email: "", role: "organizer" });
    setMemberModalOpen(true);
  };
  const openEditMember = (m: Member) => {
    setEditingMember(m);
    setMemberForm({ name: m.name, email: m.email, role: m.role });
    setMemberModalOpen(true);
  };
  const handleSaveMember = () => {
    if (!memberForm.name || !memberForm.email) {
      toast("Name and email are required.", "error");
      return;
    }
    if (editingMember) {
      setMembers((prev) => prev.map((m) => m.id === editingMember.id ? { ...m, ...memberForm } : m));
      toast("Member updated.", "success");
    } else {
      const newMember: Member = { id: `m-${Date.now()}`, ...memberForm };
      setMembers((prev) => [...prev, newMember]);
      toast("Member added.", "success");
    }
    setMemberModalOpen(false);
    setEditingMember(null);
  };
  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    toast("Member removed.", "info");
    setMemberModalOpen(false);
    setEditingMember(null);
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
  const handleDeleteAnnouncement = (_id: string) => {
    toast("Announcement deleted (local).", "info");
  };

  // ─── PROBLEM STATEMENT HANDLERS ───
  const handleSaveProblemStatement = () => {
    if (!psForm.title || !psForm.description) {
      toast("Title and description are required.", "error");
      return;
    }
    if (psEditId) {
      updateProblemStatement(psEditId, { title: psForm.title, description: psForm.description, trackId: psForm.trackId, status: psForm.status });
      toast("Problem statement updated.", "success");
      setPsEditId(null);
    } else {
      addProblemStatement({ title: psForm.title, description: psForm.description, trackId: psForm.trackId, status: psForm.status });
      toast("Problem statement created.", "success");
    }
    setPsForm({ title: "", description: "", trackId: "gen-ai", status: "draft" });
    setPsCreateOpen(false);
  };
  const handleEditPs = (ps: ProblemStatement) => {
    setPsEditId(ps.id);
    setPsForm({ title: ps.title, description: ps.description, trackId: ps.trackId, status: ps.status });
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

  // ─── QR SCANNER ───
  const handleSelectTeam = (team: Team) => {
    setDetailTeam(team);
    setTeamDetailOpen(true);
  };

  // ─── PROFILE ───
  const handleSaveProfile = () => {
    if (session.email) {
      updateProfile(session.email, {
        name: profileForm.name,
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
    members: "Members & Roles",
    participants: "Participants",
    announcements: "Announcements",
    problems: "Problem Statements",
    scanner: "QR Scanner",
    teams: "Approved Teams",
    profile: "Profile",
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "danger";
      case "organizer": return "warning";
      case "mentor": return "info";
      case "judge": return "primary";
      case "volunteer": return "success";
      default: return "primary";
    }
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <Sidebar activeTab={activeTab} onTabChange={(t) => setActiveTab(t as TabType)} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {(Object.keys(tabLabels) as TabType[]).map((id) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === id
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
            {activeTab === "scanner" && (
              <Button onClick={() => setScannerOpen(true)} className="text-xs">
                <QrCode className="h-4 w-4 mr-2" /> Open Scanner
              </Button>
            )}
            {(activeTab === "announcements" || activeTab === "problems") && (
              <Button
                onClick={() => {
                  if (activeTab === "announcements") {
                    setAnnEditId(null);
                    setAnnForm({ title: "", content: "", type: "info", scheduleDate: "" });
                    setAnnCreateOpen(true);
                  } else {
                    setPsEditId(null);
                    setPsForm({ title: "", description: "", trackId: "gen-ai", status: "draft" });
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

                {/* Recent Activity */}
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 shadow-sm flex flex-col gap-4 dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2 dark:text-gray-100 dark:border-gray-700">
                    <Activity className="h-4.5 w-4.5 text-primary-green" /> Recent Activity
                  </h3>
                  <div className="flex flex-col gap-3">
                    {recentActivity.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 bg-white text-xs dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex gap-3 items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            log.type === "warning" ? "bg-amber-500" : log.type === "success" ? "bg-emerald-500" : "bg-blue-500"
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
                <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 border-b border-gray-150 dark:border-gray-700 pb-3">All Participants</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700">
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Team</th>
                        <th className="text-center py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Leader</th>
                        <th className="text-left py-3 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.flatMap((t) =>
                        t.members.map((m) => ({
                          ...m,
                          teamName: t.name,
                          teamId: t.id,
                        }))
                      ).map((p, idx) => (
                        <tr key={`${p.teamId}-${p.email}-${idx}`} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <Avatar name={p.name} size="sm" />
                              <div>
                                <p className="font-bold text-primary-dark dark:text-gray-100">{p.name}</p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{p.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{p.teamName}</td>
                          <td className="py-3 px-3 text-center">
                            {p.isLeader ? (
                              <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant={p.isLeader ? "warning" : "info"}>
                              {p.isLeader ? "Leader" : "Member"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {teams.flatMap((t) => t.members).length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No participants yet.</td>
                        </tr>
                      )}
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
                          <span className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${
                            ann.type === "warning" ? "bg-amber-500" : ann.type === "success" ? "bg-emerald-500" : "bg-blue-500"
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
                {problemStatements.map((ps) => {
                  const track = HACK_TRACKS.find((t) => t.id === ps.trackId);
                  const isExpanded = expandedPs === ps.id;
                  return (
                    <div key={ps.id} className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
                      <button
                        onClick={() => setExpandedPs(isExpanded ? null : ps.id)}
                        className="w-full p-5 flex items-center justify-between text-left cursor-pointer bg-transparent border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={ps.status === "published" ? "success" : ps.status === "archived" ? "danger" : "warning"}>
                            {ps.status.toUpperCase()}
                          </Badge>
                          <div>
                            <h4 className="text-sm font-bold text-primary-dark dark:text-gray-100">{ps.title}</h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                              {track?.label || "—"} · Created {new Date(ps.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{ps.description}</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditPs(ps)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors flex items-center gap-1">
                              <Edit3 className="h-3 w-3" /> Edit
                            </button>
                            {ps.status !== "published" && (
                              <button onClick={() => handlePublishPs(ps.id)} className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold hover:bg-emerald-200 cursor-pointer transition-colors flex items-center gap-1">
                                <Send className="h-3 w-3" /> Publish
                              </button>
                            )}
                            {ps.status !== "archived" && (
                              <button onClick={() => handleArchivePs(ps.id)} className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-bold hover:bg-amber-200 cursor-pointer transition-colors flex items-center gap-1">
                                <Archive className="h-3 w-3" /> Archive
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {problemStatements.length === 0 && (
                  <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-10 text-center shadow-sm">
                    <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-gray-500 text-sm">No problem statements yet. Click &quot;Create&quot; to add one.</p>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════ QR SCANNER TAB ═══════════════════════════════════════════ */}
            {activeTab === "scanner" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-8 shadow-sm flex flex-col gap-6 items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary-green/10 flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-primary-green" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 mb-1">Global QR Scanner</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
                    Scan a team QR code or search by team name to look up any team and navigate to the appropriate workflow.
                  </p>
                </div>
                <Button onClick={() => setScannerOpen(true)} className="text-xs">
                  <QrCode className="h-4 w-4 mr-2" /> Launch Scanner
                </Button>
              </div>
            )}

            {/* ═══════════════════════════════════════════ APPROVED TEAMS TAB ═══════════════════════════════════════════ */}
            {activeTab === "teams" && (
              <div className="rounded-3xl border border-input-border/30 bg-white dark:bg-gray-900 p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 border-b border-gray-150 dark:border-gray-700 pb-3">Approved Teams</h3>
                <div className="flex flex-col gap-3">
                  {approvedTeams.map((team) => {
                    const track = HACK_TRACKS.find((t) => t.id === team.trackId);
                    return (
                      <button
                        key={team.id}
                        onClick={() => { setDetailTeam(team); setTeamDetailOpen(true); }}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs cursor-pointer hover:border-primary-green/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {team.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-primary-dark dark:text-gray-100">{team.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{team.size} members · {track?.label || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Created</p>
                            <p className="font-bold text-gray-600 dark:text-gray-300">{new Date(team.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={team.attendance?.checkedIn ? "success" : "warning"}>
                            {team.attendance?.checkedIn ? "Checked In" : "Not Arrived"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-300" />
                        </div>
                      </button>
                    );
                  })}
                  {approvedTeams.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">No approved teams yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════ PROFILE TAB ═══════════════════════════════════════════ */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-6 max-w-xl">
                {/* Profile sub-tabs */}
                <div className="flex gap-2">
                  {([
                    { id: "edit" as ProfileTabType, label: "Edit Profile" },
                    { id: "appearance" as ProfileTabType, label: "Appearance" },
                  ]).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setProfileTab(tab.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        profileTab === tab.id
                          ? "bg-primary-green text-white shadow-sm"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary-green/30"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {profileTab === "edit" && (
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
                )}

                {profileTab === "appearance" && (
                  <div className="rounded-3xl border border-input-border/30 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm flex flex-col gap-6 max-w-md">
                    <h3 className="text-base font-bold text-primary-dark dark:text-gray-100 border-b border-gray-150 dark:border-gray-700 pb-2">Appearance</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Dark Mode</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">Toggle between light and dark themes. Also available beside the notification bell.</p>
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>
                )}
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
            placeholder="email@college.edu"
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
              <option value="mentor">Mentor</option>
              <option value="judge">Judge</option>
              <option value="volunteer">Volunteer</option>
            </select>
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
      <Modal isOpen={psCreateOpen} onClose={() => { setPsCreateOpen(false); setPsEditId(null); }} title={psEditId ? "Edit Problem Statement" : "Create Problem Statement"}>
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
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Track</label>
            <select
              value={psForm.trackId}
              onChange={(e) => setPsForm((p) => ({ ...p, trackId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer"
            >
              {HACK_TRACKS.map((tr) => (
                <option key={tr.id} value={tr.id}>{tr.label}</option>
              ))}
            </select>
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
          <Button onClick={handleSaveProblemStatement} className="w-full text-xs">
            {psEditId ? "Update" : "Create Problem Statement"}
          </Button>
        </div>
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
                <p className="text-[11px] text-gray-400 dark:text-gray-500">{detailTeam.size} members · {HACK_TRACKS.find((t) => t.id === detailTeam.trackId)?.label || "—"}</p>
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
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{m.email} · {m.department}</p>
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

      {/* QR Scanner */}
      <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSelectTeam={handleSelectTeam} />
    </PageWrapper>
  );
}
