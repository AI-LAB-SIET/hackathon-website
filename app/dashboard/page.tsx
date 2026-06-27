"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useTheme } from "@/components/layout/ThemeProvider";
import { useToast } from "@/components/ui/toast";
import { QRTeamPass } from "@/components/ui/QRTeamPass";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, FolderOpen, Bell, User,
  CheckCircle, Clock, ChevronRight,
  Github, Video, Globe, Plus, Trash2, Send, Download,
  AlertTriangle, Info, X,
  LayoutDashboard, Layers, ChevronDown,
  BookOpen, LifeBuoy, MessageCircle, ExternalLink, Database, Cloud, Code2, Brain, Terminal, LogOut, QrCode,
} from "lucide-react";
import { Participant, Notification, SupportTicket } from "@/types";
type SupportTicketCategory = SupportTicket["category"];
type SupportTicketPriority = SupportTicket["priority"];
import { HACK_TRACKS, INITIAL_FAQS } from "@/lib/mockData";
import {
  apis, datasets, tools, learning, templates, cloud,
  type ResourceCard,
} from "@/lib/resources";

// ─────────────────────────────────────────────
// Journey stages
// ─────────────────────────────────────────────
const JOURNEY_STAGES = [
  { id: "registration", label: "Registration", desc: "Account created and team registered with the platform.", icon: "📋" },
  { id: "team_created", label: "Team Created", desc: "Team profile is set up with all members added.", icon: "👥" },
  { id: "payment", label: "Payment Verified", desc: "Registration fee payment confirmed by organizers.", icon: "💳" },
  { id: "idea", label: "Idea Submission", desc: "2-page abstract PDF submitted before July 5, 11:59 PM.", icon: "💡" },
  { id: "shortlist", label: "Shortlisted", desc: "Team selected in top 20 — cloud GPU credits unlocked.", icon: "⭐" },
  { id: "hackathon", label: "Hackathon Day", desc: "24-hour physical sprint at SIET AI Lab — July 18.", icon: "🚀" },
  { id: "evaluation", label: "Final Evaluation", desc: "Live demo presented to industry judges.", icon: "🎯" },
  { id: "results", label: "Results", desc: "Winners announced and certificates issued.", icon: "🏆" },
];

type TabType = "home" | "team" | "project" | "notifications" | "resources" | "support" | "profile";

const DEPT_OPTIONS = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Biotechnology",
  "Civil Engineering",
];

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "PG 1st Year", "PG 2nd Year"];

export default function ParticipantDashboard() {
  const router = useRouter();
  const {
    session, teams, notifications,
    updateProjectDetails, updateTeamMembers,
    markNotificationRead, markAllNotificationsRead,
    logout, raiseTicket, getProfile, updateProfile,
  } = useAppState();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [activeJourneyStage, setActiveJourneyStage] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<"overview" | "repo" | "submission">("overview");
  const [profileTab, setProfileTab] = useState<"edit" | "appearance">("edit");
  const [notifFilter, setNotifFilter] = useState<"all" | Notification["type"]>("all");
  const [showAddMember, setShowAddMember] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [resourceTab, setResourceTab] = useState<"templates" | "datasets" | "apis" | "tools" | "cloud">("templates");
  const [ticketCategory, setTicketCategory] = useState<SupportTicketCategory>("Other");
  const [ticketPriority, setTicketPriority] = useState<SupportTicketPriority>("Medium");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketFaqOpen, setTicketFaqOpen] = useState<string | null>(null);
  const [profileNewSkill, setProfileNewSkill] = useState("");
  const [memberNewSkill, setMemberNewSkill] = useState("");
  const [participantQrDataUrl, setParticipantQrDataUrl] = useState<string>("");
  const [profileEdit, setProfileEdit] = useState({
    bio: "", skills: [] as string[], socialLinks: [] as { platform: string; url: string }[], profilePicture: "",
  });
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [newMember, setNewMember] = useState<Participant>({
    name: "", registerNumber: "", email: "", phone: "",
    department: DEPT_OPTIONS[0], year: YEAR_OPTIONS[2],
    skills: [], isLeader: false,
  });
  const [projectEdit, setProjectEdit] = useState({
    projectDescription: "", githubUrl: "", videoUrl: "", demoUrl: "", aiDisclosure: "", trackId: "",
  });

  useEffect(() => { setMounted(true); }, []);

  // Generate individual participant QR code
  useEffect(() => {
    if (session.email) {
      QRCode.toDataURL(JSON.stringify({ type: "participant", email: session.email, name: session.name }), {
        width: 180,
        margin: 2,
        color: { dark: "#064e3b", light: "#ffffff" },
      }).then(setParticipantQrDataUrl);
    }
  }, [session.email]);

  // Sync profile edit data from state
  useEffect(() => {
    if (session.email) {
      const profile = getProfile(session.email);
      if (profile) {
        setProfileEdit({
          bio: profile.bio || "",
          skills: profile.skills || [],
          socialLinks: profile.socialLinks || [],
          profilePicture: profile.profilePicture || "",
        });
      }
    }
  }, [session.email]);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "participant")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  const team = teams.find((t) => t.id === session.teamId);

  // Keep project edit in sync with team data — must be before any early returns
  useEffect(() => {
    if (team) {
      setProjectEdit({
        projectDescription: team.projectDescription || "",
        githubUrl: team.githubUrl || "",
        videoUrl: team.videoUrl || "",
        demoUrl: team.demoUrl || "",
        aiDisclosure: team.aiDisclosure || "",
        trackId: team.trackId || "",
      });
    }
  }, [team]);

  if (!mounted || !session.isLoggedIn || session.role !== "participant") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400 dark:text-gray-500">Loading your workspace...</div>;
  }

  if (!team) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-gray-400 text-sm dark:text-gray-500">No team found. Please register a team first.</div>
        <button onClick={() => router.push("/register")} className="px-4 py-2 bg-primary-green text-white rounded-xl text-sm font-semibold cursor-pointer">Register Team</button>
      </div>
    );
  }

  const leader = team.members.find((m) => m.isLeader) || team.members[0];
  const currentUser = team.members.find((m) => m.email === session.email) || leader;
  const track = HACK_TRACKS.find((t) => t.id === team.trackId);
  const avgScore = team.evaluations && team.evaluations.length > 0
    ? Math.round(team.evaluations.reduce((acc, e) => acc + (e.innovation + e.feasibility + e.presentation) / 3, 0) / team.evaluations.length)
    : null;

  // Journey status calculation
  const getStageStatus = useMemo(() => {
    return (stageId: string) => {
      switch (stageId) {
        case "registration": return "completed";
        case "team_created": return team.members.length >= 2 ? "completed" : "current";
        case "payment": return team.paymentVerified ? "completed" : team.members.length >= 2 ? "current" : "locked";
        case "idea": return team.ideaSubmitted ? "completed" : team.paymentVerified ? "current" : "locked";
        case "shortlist": return team.shortlisted ? "completed" : team.ideaSubmitted ? "upcoming" : "locked";
        case "hackathon": return team.shortlisted ? "upcoming" : "locked";
        case "evaluation": return "locked";
        case "results": return "locked";
        default: return "locked";
      }
    };
  }, [team]);

  // Registration progress
  const regChecklist = useMemo(() => {
    return [
      { label: "Account Created", done: true },
      { label: "Team Registered", done: team.status !== "PENDING" },
      { label: "Members Added (2+)", done: team.members.length >= 2 },
      { label: "Payment Verified", done: !!team.paymentVerified },
      { label: "Faculty Approval", done: !!team.facultyApproved },
      { label: "Idea Submitted", done: !!team.ideaSubmitted },
    ];
  }, [team]);
  const regPercent = Math.round((regChecklist.filter((c) => c.done).length / regChecklist.length) * 100);

  // Notifications
  const filteredNotifs = notifFilter === "all" ? notifications : notifications.filter((n) => n.type === notifFilter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifTypeStyles: Record<string, { bg: string; dot: string; label: string }> = {
    approval: { bg: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500", label: "Approval" },
    deadline: { bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500", label: "Deadline" },
    mentor: { bg: "bg-purple-50 border-purple-100", dot: "bg-purple-500", label: "Mentor" },
    judge: { bg: "bg-blue-50 border-blue-100", dot: "bg-blue-500", label: "Judge" },
    action: { bg: "bg-red-50 border-red-100", dot: "bg-red-500", label: "Action" },
    system: { bg: "bg-gray-50 border-gray-100", dot: "bg-gray-400", label: "System" },
  };

  const handleLogout = () => {
    logout();
    toast("Logged out successfully.", "info");
    router.push("/");
  };

  // Resources sub-category data (derived from shared lib/resources.ts)
  const resourceData: Record<typeof resourceTab, { label: string; items: ResourceCard[]; desc: string }> = {
    templates: { label: "Templates & Starter Kits", items: [...templates, ...learning], desc: "Starter codebases and GitHub repos to fork and build on — plus learning resources." },
    datasets: { label: "Datasets", items: datasets, desc: "Curated open datasets across all hackathon tracks." },
    apis: { label: "API Docs", items: apis, desc: "Pre-approved AI APIs with free tiers." },
    tools: { label: "Dev Tools", items: tools, desc: "Frameworks and libraries recommended by the organizing team." },
    cloud: { label: "GPU & Cloud Credits", items: cloud, desc: "Free cloud compute, hosting, and credits for participants." },
  };

  const handleRaiseTicket = () => {
    if (!ticketDescription.trim()) {
      toast("Please describe your issue.", "error");
      return;
    }
    raiseTicket({
      teamId: team.id,
      category: ticketCategory,
      priority: ticketPriority,
      raisedBy: session.name || session.email || "Participant",
      description: ticketDescription.trim(),
    });
    setTicketDescription("");
    setTicketCategory("Other");
    setTicketPriority("Medium");
    toast("Support ticket raised. The team has been notified.", "success");
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email || !newMember.registerNumber) {
      toast("Please fill in Name, Email, and Register Number.", "error");
      return;
    }
    if (team.members.length >= 4) {
      toast("Maximum 4 members per team.", "error");
      return;
    }
    updateTeamMembers(team.id, [...team.members, { ...newMember, skills: newMember.skills }]);
    setNewMember({ name: "", registerNumber: "", email: "", phone: "", department: DEPT_OPTIONS[0], year: YEAR_OPTIONS[2], skills: [], isLeader: false });
    setShowAddMember(false);
    toast("Member added successfully.", "success");
  };

  const handleRemoveMember = (email: string) => {
    if (team.members.length <= 2) { toast("Team must have at least 2 members.", "error"); return; }
    updateTeamMembers(team.id, team.members.filter((m) => m.email !== email));
    toast("Member removed.", "info");
  };

  const handleSaveProject = () => {
    updateProjectDetails(team.id, {
      projectDescription: projectEdit.projectDescription || team.projectDescription,
      githubUrl: projectEdit.githubUrl || team.githubUrl,
      videoUrl: projectEdit.videoUrl || team.videoUrl,
      demoUrl: projectEdit.demoUrl || team.demoUrl,
      aiDisclosure: projectEdit.aiDisclosure || team.aiDisclosure,
      trackId: projectEdit.trackId || team.trackId,
    });
    toast("Project details saved.", "success");
  };

  const handleSaveProfile = () => {
    if (session.email) {
      updateProfile(session.email, {
        bio: profileEdit.bio,
        skills: profileEdit.skills,
        socialLinks: profileEdit.socialLinks,
        profilePicture: profileEdit.profilePicture,
      });
      toast("Profile saved.", "success");
    }
  };

  const handleDownloadParticipantQR = () => {
    if (!participantQrDataUrl) return;
    const link = document.createElement("a");
    link.href = participantQrDataUrl;
    link.download = `${(session.name || session.email || "participant").replace(/\s+/g, "_")}_QR.png`;
    link.click();
  };

  // (projectEdit sync useEffect moved above early returns)

  return (
    <PageWrapper>
      <div className="flex min-h-screen bg-[#f8fafb] dark:bg-gray-950">
        {/* Sidebar — the single source of navigation */}
        <Sidebar activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabType)} />

        <main className="flex-1 min-w-0 p-6 lg:p-8">
          {/* Utility Header — replaces the duplicate top pills.
              Navigation is now handled SOLELY by the Sidebar; this header
              holds utility actions (search, notifications, profile menu). */}
          <div className="flex items-center justify-end gap-4 mb-8">
            <div className="flex items-center gap-3 shrink-0">
              {/* Theme toggle */}
              <ThemeToggle />

              {/* Notifications bell */}
              <button
                onClick={() => setActiveTab("notifications")}
                className="relative p-2.5 rounded-xl bg-card-bg dark:bg-gray-800 border border-input-border/30 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-primary-green hover:border-primary-green/30 transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4.5 w-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile menu */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-card-bg dark:bg-gray-800 border border-input-border/30 dark:border-gray-700 text-primary-dark dark:text-gray-100 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
                    {(session.name || session.email || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold hidden sm:inline">{session.name?.split(" ")[0] || "Profile"}</span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 dark:bg-gray-900 dark:border-gray-700"
                    >
                      <button
                        onClick={() => { setProfileTab("edit"); setActiveTab("profile"); setProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
                      >
                        <User className="h-4 w-4 text-primary-green" /> My Profile
                      </button>
                      <button
                        onClick={() => { setProfileTab("appearance"); setActiveTab("profile"); setProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
                      >
                        <LayoutDashboard className="h-4 w-4 text-primary-green" /> Theme
                      </button>
                      <div className="border-t border-gray-100 dark:border-gray-800" />
                      <button
                        onClick={() => { setProfileMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer text-left"
                      >
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* ─── HOME TAB ─── */}
            {activeTab === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
                {/* Welcome */}
                <div className="bg-gradient-to-br from-primary-dark to-emerald-700 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Mission Control</div>
                      <h1 className="text-2xl font-extrabold mb-1">Welcome back, {session.name?.split(" ")[0] || "Participant"} 👋</h1>
                      <div className="text-emerald-200 text-sm">{team.name} · {track?.label || "Track not set"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {team.status === "APPROVED" && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-xs font-bold text-emerald-100"><CheckCircle className="h-3.5 w-3.5" /> Approved</span>}
                      {team.status === "PENDING" && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-100"><Clock className="h-3.5 w-3.5" /> Pending Approval</span>}
                      {avgScore !== null && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-100">Score: {avgScore}/10</span>}
                    </div>
                  </div>
                </div>

                {/* Animated Journey Timeline */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700">
                  <h2 className="font-bold text-primary-dark mb-6 flex items-center gap-2 dark:text-gray-100"><Layers className="h-5 w-5 text-primary-green" /> Hackathon Journey</h2>
                  <div className="relative">
                    {/* Connecting line */}
                    <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-700" />
                    <div className="flex flex-col gap-1">
                      {JOURNEY_STAGES.map((stage, idx) => {
                        const status = getStageStatus(stage.id);
                        const isActive = activeJourneyStage === stage.id;
                        return (
                          <div key={stage.id}>
                            <button
                              onClick={() => setActiveJourneyStage(isActive ? null : stage.id)}
                              className="relative w-full flex items-center gap-4 py-3 pl-2 pr-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group text-left"
                            >
                              {/* Icon */}
                              <div className={`relative z-10 h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
                                status === "completed" ? "bg-emerald-100 dark:bg-emerald-900/50" :
                                status === "current" ? "bg-amber-100 dark:bg-amber-900/50 ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-gray-900" :
                                status === "upcoming" ? "bg-blue-50 dark:bg-blue-900/30" : "bg-gray-50 dark:bg-gray-800"
                              }`}>
                                {status === "completed" ? "✅" : status === "current" ? "🟡" : status === "upcoming" ? "⚪" : "🔒"}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm ${status === "locked" ? "text-gray-400 dark:text-gray-500" : "text-primary-dark dark:text-gray-100"}`}>{stage.label}</div>
                                <div className={`text-xs ${status === "current" ? "text-amber-600 font-semibold" : status === "completed" ? "text-emerald-600" : "text-gray-400"}`}>
                                  {status === "completed" ? "Completed" : status === "current" ? "In Progress" : status === "upcoming" ? "Up Next" : "Locked"}
                                </div>
                              </div>

                              <ChevronRight className={`h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-transform ${isActive ? "rotate-90" : ""}`} />
                            </button>

                            {/* Expandable detail */}
                            <AnimatePresence>
                              {isActive && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-14 mr-4 mb-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{stage.desc}</p>
                                    {status === "current" && (
                                      <button
                                        onClick={() => setActiveTab(stage.id === "idea" ? "project" : "team")}
                                        className="mt-2 text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                                      >
                                        Take action →
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick cards row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 dark:text-gray-500">Latest Notifications</div>
                    <div className="flex flex-col gap-2">
                      {notifications.filter((n) => !n.read).slice(0, 3).map((n) => (
                        <div key={n.id} className="flex items-start gap-2">
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${notifTypeStyles[n.type]?.dot || "bg-gray-400"}`} />
                          <div className="text-xs text-gray-600 dark:text-gray-400 leading-tight">{n.title}</div>
                        </div>
                      ))}
                      {notifications.filter((n) => !n.read).length === 0 && <div className="text-xs text-gray-400 dark:text-gray-500">All caught up ✓</div>}
                    </div>
                    <button onClick={() => setActiveTab("notifications")} className="mt-3 text-xs font-semibold text-primary-green hover:underline cursor-pointer">View all →</button>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 dark:text-gray-500">Upcoming Deadlines</div>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-red-400 shrink-0" />
                        <div><div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Idea Submission</div><div className="text-xs text-gray-400 dark:text-gray-500">July 5, 2026</div></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                        <div><div className="text-xs font-semibold text-gray-700 dark:text-gray-300">Hackathon Day</div><div className="text-xs text-gray-400 dark:text-gray-500">July 18, 2026</div></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 dark:text-gray-500">Quick Actions</div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => { setActiveTab("project"); setProjectTab("submission"); }} className="text-xs font-semibold text-left text-primary-green hover:underline cursor-pointer flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" /> Submit Idea Abstract
                      </button>
                      <button onClick={() => setActiveTab("team")} className="text-xs font-semibold text-left text-primary-green hover:underline cursor-pointer flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> View Team QR
                      </button>
                      <button onClick={() => setActiveTab("project")} className="text-xs font-semibold text-left text-primary-green hover:underline cursor-pointer flex items-center gap-1.5">
                        <Github className="h-3.5 w-3.5" /> Update Repository
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── MY TEAM TAB ─── */}
            {activeTab === "team" && (
              <motion.div key="team" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><Users className="h-5 w-5 text-primary-green" /> My Team</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* QR Team Pass */}
                  <div className="space-y-4">
                    <QRTeamPass team={team} />

                    {/* Individual Participant QR */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-primary-dark text-sm dark:text-gray-100">Your Personal QR</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">For attendance & identity</div>
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="flex flex-col items-center gap-2">
                          {participantQrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={participantQrDataUrl} alt="Your QR Code" className="w-32 h-32 rounded-xl border-2 border-gray-100 dark:border-gray-700" />
                          ) : (
                            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                              <QrCode className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="font-semibold text-primary-dark dark:text-gray-100">{currentUser.name}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{currentUser.email}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{currentUser.department} · {currentUser.year}</div>
                          <button
                            onClick={handleDownloadParticipantQR}
                            className="mt-1 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer w-fit"
                          >
                            <Download className="h-4 w-4" /> Download QR
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Registration Progress */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-bold text-primary-dark text-sm dark:text-gray-100">Registration Progress</div>
                        <div className="text-2xl font-extrabold text-primary-green">{regPercent}%</div>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${regPercent}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-2 rounded-full bg-gradient-to-r from-primary-green to-teal-400" />
                      </div>
                      <div className="flex flex-col gap-2">
                        {regChecklist.map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            {item.done ? <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />}
                            <span className={`text-sm ${item.done ? "text-gray-700 dark:text-gray-300" : "text-amber-600 dark:text-amber-400 font-medium"}`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Members */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="font-bold text-primary-dark text-sm dark:text-gray-100">Members ({team.members.length}/4)</div>
                        {team.members.length < 4 && (
                          <button onClick={() => setShowAddMember(!showAddMember)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer">
                            <Plus className="h-3.5 w-3.5" /> Add Member
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        {team.members.map((m) => (
                          <div key={m.email} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-primary-dark text-sm flex items-center gap-2 dark:text-gray-100">
                                {m.name}
                                {m.isLeader && <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-1.5 rounded-full">Leader</span>}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">{m.department} · {m.year}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">{m.email}</div>
                            </div>
                            {!m.isLeader && (
                              <button onClick={() => handleRemoveMember(m.email)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add Member Form */}
                    <AnimatePresence>
                      {showAddMember && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-5 space-y-4 dark:bg-gray-900 dark:border-emerald-800">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-primary-dark text-sm dark:text-gray-100">Register New Member</div>
                              <button onClick={() => setShowAddMember(false)} className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 cursor-pointer"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {[
                                { label: "Full Name*", field: "name" as const, placeholder: "Ravi Kumar" },
                                { label: "Register Number*", field: "registerNumber" as const, placeholder: "2022CSE0101" },
                                { label: "College Email*", field: "email" as const, placeholder: "ravi@college.edu" },
                                { label: "Phone", field: "phone" as const, placeholder: "98765..." },
                              ].map(({ label, field, placeholder }) => (
                                <div key={field}>
                                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
                                  <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={newMember[field]}
                                    onChange={(e) => setNewMember((p) => ({ ...p, [field]: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Department</label>
                                <select value={newMember.department} onChange={(e) => setNewMember((p) => ({ ...p, department: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                  {DEPT_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Year</label>
                                <select value={newMember.year} onChange={(e) => setNewMember((p) => ({ ...p, year: e.target.value }))}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                  {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Skills (press Enter to add)</label>
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {newMember.skills.map((s) => (
                                  <span key={s} className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                    {s}
                                    <button onClick={() => setNewMember((p) => ({ ...p, skills: p.skills.filter((sk) => sk !== s) }))} className="cursor-pointer"><X className="h-3 w-3" /></button>
                                  </span>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Add skill..."
                                  value={memberNewSkill}
                                  onChange={(e) => setMemberNewSkill(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && memberNewSkill.trim()) {
                                      setNewMember((p) => ({ ...p, skills: [...p.skills, memberNewSkill.trim()] }));
                                      setMemberNewSkill("");
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                              </div>
                            </div>
                            <button onClick={handleAddMember} className="w-full py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">
                              Add Member to Team
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PROJECT TAB ─── */}
            {activeTab === "project" && (
              <motion.div key="project" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><FolderOpen className="h-5 w-5 text-primary-green" /> Project Workspace</h2>
                {/* Sub tabs */}
                <div className="flex gap-2 flex-wrap">
                  {(["overview", "repo", "submission"] as const).map((t) => (
                    <button key={t} onClick={() => setProjectTab(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer capitalize ${projectTab === t ? "bg-primary-green text-white" : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-green/40"}`}
                    >{t}</button>
                  ))}
                </div>

                {projectTab === "overview" && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 dark:bg-gray-900 dark:border-gray-700">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Track</label>
                      <select value={projectEdit.trackId} onChange={(e) => setProjectEdit((p) => ({ ...p, trackId: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        <option value="">Select a track...</option>
                        {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Project Description</label>
                      <textarea rows={4} value={projectEdit.projectDescription}
                        onChange={(e) => setProjectEdit((p) => ({ ...p, projectDescription: e.target.value }))}
                        placeholder="Describe your AI project..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">AI Tool Disclosure</label>
                      <textarea rows={2} value={projectEdit.aiDisclosure}
                        onChange={(e) => setProjectEdit((p) => ({ ...p, aiDisclosure: e.target.value }))}
                        placeholder="List any AI tools used (Copilot, ChatGPT, etc.)..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <button onClick={handleSaveProject} className="px-6 py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">Save Changes</button>

                    {/* Judge Feedback */}
                    {(team.evaluations || []).length > 0 && (
                      <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4">
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Judge Evaluations</div>
                        {team.evaluations!.map((ev, i) => {
                          const avg = Math.round((ev.innovation + ev.feasibility + ev.presentation) / 3);
                          return (
                            <div key={i} className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-400">{avg}/10</span>
                                <div className="text-xs text-blue-600 dark:text-blue-300">Innovation: {ev.innovation} · Feasibility: {ev.feasibility} · Presentation: {ev.presentation}</div>
                              </div>
                              <p className="text-sm text-blue-800 dark:text-blue-200">{ev.feedback}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {projectTab === "repo" && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
                    {[
                      { label: "GitHub Repository URL", field: "githubUrl" as const, icon: <Github className="h-4 w-4" />, placeholder: "https://github.com/your-team/project" },
                      { label: "Demo Video URL", field: "videoUrl" as const, icon: <Video className="h-4 w-4" />, placeholder: "https://youtube.com/..." },
                      { label: "Live Demo URL", field: "demoUrl" as const, icon: <Globe className="h-4 w-4" />, placeholder: "https://your-demo.vercel.app" },
                    ].map(({ label, field, icon, placeholder }) => (
                      <div key={field}>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">{label}</label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{icon}</div>
                          <input type="text" value={projectEdit[field]} placeholder={placeholder}
                            onChange={(e) => setProjectEdit((p) => ({ ...p, [field]: e.target.value }))}
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    ))}
                    <button onClick={handleSaveProject} className="px-6 py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">Save Links</button>
                  </div>
                )}

                {projectTab === "submission" && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
                    <div className={`p-4 rounded-xl ${team.ideaSubmitted ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        {team.ideaSubmitted ? <><CheckCircle className="h-4 w-4 text-emerald-600" /><span className="text-emerald-700">Idea Submitted</span></> : <><Clock className="h-4 w-4 text-amber-600" /><span className="text-amber-700">Submission Pending</span></>}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Upload your 2-page idea abstract PDF. Deadline: July 5, 2026 at 11:59 PM.</p>
                    </div>
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
                      <div className="text-4xl mb-3">📄</div>
                      <div className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Drop your PDF here</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">Maximum 10 MB · PDF format only</div>
                      <button
                        onClick={() => { updateProjectDetails(team.id, { ideaSubmitted: true }); toast("Idea abstract submitted!", "success"); }}
                        className="px-5 py-2 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer"
                      >Submit Abstract</button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── NOTIFICATIONS TAB ─── */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><Bell className="h-5 w-5 text-primary-green" /> Notifications</h2>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsRead} className="text-sm font-semibold text-primary-green hover:underline cursor-pointer">Mark all as read</button>
                  )}
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2">
                  {(["all", "approval", "deadline", "mentor", "judge", "action", "system"] as const).map((f) => (
                    <button key={f} onClick={() => setNotifFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer capitalize ${notifFilter === f ? "bg-primary-green text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-green/40"}`}
                    >
                      {f === "all" ? "All" : notifTypeStyles[f]?.label || f}
                      {f === "all" && unreadCount > 0 && <span className="ml-1 px-1 bg-red-500 text-white rounded-full text-[10px]">{unreadCount}</span>}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  {filteredNotifs.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">No notifications in this category.</div>}
                  {filteredNotifs.map((n) => {
                    const style = notifTypeStyles[n.type] || notifTypeStyles.system;
                    return (
                      <motion.div key={n.id} layout
                        className={`flex items-start gap-3 p-4 rounded-xl border ${!n.read ? style.bg : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700"} transition-colors`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-semibold ${!n.read ? "text-primary-dark dark:text-gray-100" : "text-gray-600 dark:text-gray-300"}`}>{n.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                        {n.priority === "high" && !n.read && <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full shrink-0">Urgent</span>}
                        {n.read && <span className="text-xs text-gray-300 dark:text-gray-600 shrink-0">Read</span>}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── RESOURCES TAB ─── */}
            {activeTab === "resources" && (
              <motion.div key="resources" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary-green" /> Resources</h2>
                {/* Sub-category pills */}
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(resourceData) as (keyof typeof resourceData)[]).map((k) => (
                    <button key={k} onClick={() => setResourceTab(k)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${resourceTab === k ? "bg-primary-green text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-green/40 hover:text-primary-green"}`}
                    >
                      {k === "templates" && <Code2 className="h-4 w-4" />}
                      {k === "datasets" && <Database className="h-4 w-4" />}
                      {k === "apis" && <Brain className="h-4 w-4" />}
                      {k === "tools" && <Terminal className="h-4 w-4" />}
                      {k === "cloud" && <Cloud className="h-4 w-4" />}
                      {resourceData[k].label.split(" ")[0]}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{resourceData[resourceTab].desc}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {resourceData[resourceTab].items.map((item, i) => (
                    <motion.a
                      key={item.title}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.3 }}
                      className="group flex flex-col gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:shadow-lg hover:border-primary-green/30 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-primary-dark dark:text-gray-100 text-sm leading-tight group-hover:text-primary-green transition-colors">{item.title}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>{item.badge}</span>}
                          <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-green transition-colors" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1">{item.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {item.tags.map((tag) => (
                          <span key={tag} className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{tag}</span>
                        ))}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── SUPPORT TAB ─── */}
            {activeTab === "support" && (
              <motion.div key="support" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><LifeBuoy className="h-5 w-5 text-primary-green" /> Support</h2>

                {/* Raise Ticket + Track Tickets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Raise Ticket form */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 dark:bg-gray-900 dark:border-gray-700">
                    <div className="font-bold text-primary-dark text-sm dark:text-gray-100">Raise a Ticket</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                        <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value as SupportTicketCategory)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {(["Internet", "Power", "Mentor Needed", "Hardware", "Food", "Venue", "Other"] as SupportTicketCategory[]).map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Priority</label>
                        <select value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value as SupportTicketPriority)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {(["Low", "Medium", "High", "Critical"] as SupportTicketPriority[]).map((p) => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Describe your issue</label>
                      <textarea rows={3} value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)}
                        placeholder="Tell us what's wrong..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </div>
                    <button onClick={handleRaiseTicket} className="w-full py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">Submit Ticket</button>
                  </div>

                  {/* Track Tickets */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-3">
                    <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">Your Tickets</div>
                    {(team.supportTickets || []).length === 0 ? (
                      <div className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No tickets raised yet.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(team.supportTickets || []).map((tk) => (
                          <div key={tk.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-primary-dark dark:text-gray-100">{tk.category}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tk.status === "Resolved" || tk.status === "Closed" ? "bg-emerald-100 text-emerald-700" : tk.status === "Open" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{tk.status}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tk.description}</p>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{tk.priority} · {new Date(tk.createdAt).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* FAQs */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-3">
                  <div className="font-bold text-primary-dark dark:text-gray-100 text-sm flex items-center gap-2"><Info className="h-4 w-4 text-primary-green" /> FAQs</div>
                  <div className="flex flex-col gap-2">
                    {INITIAL_FAQS.map((faq) => {
                      const open = ticketFaqOpen === faq.id;
                      return (
                        <div key={faq.id} className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                          <button onClick={() => setTicketFaqOpen(open ? null : faq.id)}
                            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{faq.question}</span>
                            <ChevronDown className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                          </button>
                          <AnimatePresence>
                            {open && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <p className="px-4 pb-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Discord + Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="https://discord.gg/siet-ai-lab" target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:border-primary-green/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"><MessageCircle className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">Discord Community</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Get instant help from mentors & organizers</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-green transition-colors" />
                  </a>
                  <div className="group flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"><AlertTriangle className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">Emergency Contact</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Help Desk: +91 98765 43210 · helpdesk@ai-lab.in</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PROFILE TAB ─── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><User className="h-5 w-5 text-primary-green" /> Profile & Settings</h2>
                <div className="flex gap-2 flex-wrap mb-4">
                  {(["edit", "appearance"] as const).map((t) => (
                    <button key={t} onClick={() => setProfileTab(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors cursor-pointer ${profileTab === t ? "bg-primary-green text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-green/40"}`}
                    >{t === "edit" ? "Edit Profile" : "Appearance"}</button>
                  ))}
                </div>

                {profileTab === "edit" && (
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-6">
                    {/* Profile Header */}
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shrink-0">
                        {profileEdit.profilePicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profileEdit.profilePicture} alt="Profile" className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          currentUser.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-primary-dark text-lg">{currentUser.name}</div>
                        <div className="text-gray-400 dark:text-gray-500 text-sm">{currentUser.email}</div>
                        <div className="text-xs font-semibold text-primary-green mt-0.5">{team.name} · {currentUser.isLeader ? "Team Leader" : "Team Member"}</div>
                      </div>
                    </div>

                    {/* Email (Immutable) */}
                    <div>
                      <label className="text-xs font-semibold text-gray-400 dark:text-gray-500 block mb-1">Email (immutable)</label>
                      <div className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">{session.email}</div>
                    </div>

                    {/* Profile Picture URL */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Profile Picture URL</label>
                      <input type="text" value={profileEdit.profilePicture}
                        onChange={(e) => setProfileEdit((p) => ({ ...p, profilePicture: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Bio</label>
                      <textarea rows={3} value={profileEdit.bio}
                        onChange={(e) => setProfileEdit((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Skills (press Enter to add)</label>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {profileEdit.skills.map((s) => (
                          <span key={s} className="inline-flex items-center gap-1 text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            {s}
                            <button onClick={() => setProfileEdit((p) => ({ ...p, skills: p.skills.filter((sk) => sk !== s) }))} className="cursor-pointer"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                      <input type="text" placeholder="Add skill..." value={profileNewSkill}
                        onChange={(e) => setProfileNewSkill(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && profileNewSkill.trim()) {
                            setProfileEdit((p) => ({ ...p, skills: [...p.skills, profileNewSkill.trim()] }));
                            setProfileNewSkill("");
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    {/* Social Links */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Social Links</label>
                      <div className="flex flex-col gap-2 mb-2">
                        {profileEdit.socialLinks.map((link, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-20 shrink-0">{link.platform}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{link.url}</span>
                            <button onClick={() => setProfileEdit((p) => ({ ...p, socialLinks: p.socialLinks.filter((_, idx) => idx !== i) }))} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" placeholder="Platform" value={newSocialPlatform}
                          onChange={(e) => setNewSocialPlatform(e.target.value)}
                          className="w-28 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <input type="text" placeholder="URL" value={newSocialUrl}
                          onChange={(e) => setNewSocialUrl(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <button onClick={() => {
                          if (newSocialPlatform.trim() && newSocialUrl.trim()) {
                            setProfileEdit((p) => ({ ...p, socialLinks: [...p.socialLinks, { platform: newSocialPlatform.trim(), url: newSocialUrl.trim() }] }));
                            setNewSocialPlatform("");
                            setNewSocialUrl("");
                          }
                        }} className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer"><Plus className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <button onClick={handleSaveProfile} className="px-6 py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">Save Profile</button>
                  </div>
                )}

                {profileTab === "appearance" && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-4">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Theme</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Toggle between light and dark mode. You can also switch anytime using the icon beside the notification bell.</p>
                    <ThemeToggle />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageWrapper>
  );
}
