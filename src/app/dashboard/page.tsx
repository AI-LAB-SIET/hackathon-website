"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, FolderOpen, Bell, User,
  CheckCircle, Clock, ChevronRight,
  Github, Video, Globe, Plus, Trash2, Send, Download,
  AlertTriangle, Info, X,
  Layers, ChevronDown,
  BookOpen, LifeBuoy, MessageCircle, ExternalLink, Database, Code2, LogOut, QrCode,
} from "lucide-react";
import { FileAttachment, Participant, Notification, SupportTicket } from "@/types";
type SupportTicketCategory = SupportTicket["category"];
type SupportTicketPriority = SupportTicket["priority"];
import { HACK_TRACKS, INITIAL_FAQS } from "@/lib/mockData";
import {
  pptTemplates, datasets,
  type ResourceCard,
} from "@/lib/resources";

// ─────────────────────────────────────────────
// Journey stages
// ─────────────────────────────────────────────
const JOURNEY_STAGES = [
  { id: "registration", label: "Registration", desc: "Account created and team registered with the platform.", icon: "📋" },
  { id: "team_created", label: "Team Created", desc: "Team profile is set up with all members added.", icon: "👥" },
  { id: "payment", label: "Faculty Approval", desc: "Academic mentor or department head approved team participation.", icon: "👨‍🏫" },
  { id: "idea", label: "Idea Submission", desc: "2-page abstract PDF submitted before July 5, 11:59 PM.", icon: "💡" },
  { id: "shortlist", label: "Shortlisted", desc: "Team selected in top 20 — cloud GPU credits unlocked.", icon: "⭐" },
  { id: "hackathon", label: "Hackathon Day", desc: "24-hour physical sprint at AI Research Lab — July 18.", icon: "🚀" },
  { id: "evaluation", label: "Final Evaluation", desc: "Live demo presented to industry judges.", icon: "🎯" },
  { id: "results", label: "Results", desc: "Winners announced and certificates issued.", icon: "🏆" },
];

type TabType = "home" | "team" | "foodWallet" | "project" | "notifications" | "resources" | "support" | "profile";

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
    session, teams, notifications, problemStatements,
    updateProjectDetails, updateTeamMembers,
    markNotificationRead, markAllNotificationsRead,
    logout, raiseTicket, getProfile, updateProfile,
    registerTeam, deleteTeam, leaveTeam, sendJoinRequest, sendTeamInvite, respondToRequest, cancelRequest, teamRequests, activeHackathonId,
    foodTokens, foodMeals, userProfiles
  } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [activeJourneyStage, setActiveJourneyStage] = useState<string | null>(null);
  const [projectTab, setProjectTab] = useState<"overview" | "repo" | "submission">("overview");
  const [notifFilter, setNotifFilter] = useState<"all" | Notification["type"]>("all");
  const [showAddMember, setShowAddMember] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [resourceTab, setResourceTab] = useState<"templates" | "datasets">("templates");
  const [ticketCategory, setTicketCategory] = useState<SupportTicketCategory>("Other");
  const [ticketPriority, setTicketPriority] = useState<SupportTicketPriority>("Medium");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketFaqOpen, setTicketFaqOpen] = useState<string | null>(null);
  const [profileNewSkill, setProfileNewSkill] = useState("");
  const [memberNewSkill, setMemberNewSkill] = useState("");
  const [profileEdit, setProfileEdit] = useState({
    bio: "", skills: [] as string[], socialLinks: [] as { platform: string; url: string }[], profilePicture: "",
  });
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [createTeamName, setCreateTeamName] = useState("");
  const [createTeamDescription, setCreateTeamDescription] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [newMember, setNewMember] = useState<Participant>({
    name: "", registerNumber: "", email: "", phone: "",
    department: DEPT_OPTIONS[0], year: YEAR_OPTIONS[2],
    skills: [], isLeader: false,
  });
  const [projectEdit, setProjectEdit] = useState({
    projectDescription: "", githubUrl: "", videoUrl: "", demoUrl: "", aiDisclosure: "", trackId: "",
  });
  const [regTeamName, setRegTeamName] = useState("");
  const [regProblemStatementId, setRegProblemStatementId] = useState("");
  const [regProjectBrief, setRegProjectBrief] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Read URL hash to set active tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "") as TabType;
      if (["home", "team", "project", "notifications", "resources", "support", "profile"].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, []);

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
  }, [session.email, getProfile]);
  useEffect(() => {
    if (mounted) {
      if (!session.isLoggedIn || session.role !== "participant") {
        router.push("/login");
      } else if (session.onboarded === false) {
        router.push("/onboarding");
      }
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

  // Registration state sync
  useEffect(() => {
    if (team) {
      setRegTeamName(team.name || "");
      setRegProblemStatementId(team.problemStatementId || team.trackId || "");
      setRegProjectBrief(team.projectDescription || "");
    }
  }, [team]);

  // Journey status calculation — must be before early returns
  const getStageStatus = useMemo(() => {
    return (stageId: string) => {
      if (!team) {
        if (stageId === "registration") return "current";
        return "locked";
      }
      switch (stageId) {
        case "registration": return "completed";
        case "team_created": return team.members.length >= 2 ? "completed" : "current";
        case "payment": return team.facultyApproved ? "completed" : team.members.length >= 2 ? "current" : "locked";
        case "idea": return team.ideaSubmitted ? "completed" : team.facultyApproved ? "current" : "locked";
        case "shortlist": return team.shortlisted ? "completed" : team.ideaSubmitted ? "upcoming" : "locked";
        case "hackathon": return team.shortlisted ? "upcoming" : "locked";
        case "evaluation": return "locked";
        case "results": return "locked";
        default: return "locked";
      }
    };
  }, [team]);

  // Registration progress — must be before early returns
  const regChecklist = useMemo(() => {
    return [
      { label: "Account Created", done: true },
      { label: "Team Registered", done: team ? team.status !== "PENDING" : false },
      { label: "Members Added (2+)", done: team ? team.members.length >= 2 : false },
      { label: "Faculty Approval", done: team ? !!team.facultyApproved : false },
      { label: "Idea Submitted", done: team ? !!team.ideaSubmitted : false },
    ];
  }, [team]);

  if (!mounted || !session.isLoggedIn || session.role !== "participant") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400 dark:text-gray-500">Loading your workspace...</div>;
  }

  const leader = team ? (team.members.find((m) => m.isLeader) || team.members[0]) : null;
  const currentUser = team ? (team.members.find((m) => m.email === session.email) || leader) : null;
  const track = team ? HACK_TRACKS.find((t) => t.id === team.trackId) : null;
  const avgScore = team && team.evaluations && team.evaluations.length > 0
    ? Math.round(team.evaluations.reduce((acc, e) => acc + (e.innovation + e.feasibility + e.presentation) / 3, 0) / team.evaluations.length)
    : null;
  const regPercent = regChecklist.length > 0
    ? Math.round((regChecklist.filter((c) => c.done).length / regChecklist.length) * 100)
    : 0;

  // Notifications
  const filteredNotifs = notifFilter === "all" ? notifications : notifications.filter((n) => n.type === notifFilter);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const notifTypeStyles: Record<string, { bg: string; dot: string; label: string }> = {
    approval: { bg: "bg-emerald-50 border-emerald-100", dot: "bg-emerald-500", label: "Approval" },
    deadline: { bg: "bg-amber-50 border-amber-100", dot: "bg-amber-500", label: "Deadline" },
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
    templates: { label: "PPT Templates", items: pptTemplates, desc: "Official presentation guidelines and pitch deck templates." },
    datasets: { label: "Datasets", items: datasets, desc: "Curated open datasets across all hackathon tracks." },
  };

  const publishedProblemStatements = problemStatements.filter((ps) => ps.status === "published");

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

  const handleRaiseTicket = () => {
    if (!team) return;
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
    if (!team) return;
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
    if (!team) return;
    if (team.members.length <= 2) { toast("Team must have at least 2 members.", "error"); return; }
    updateTeamMembers(team.id, team.members.filter((m) => m.email !== email));
    toast("Member removed.", "info");
  };

  const handleSaveProject = () => {
    if (!team) return;
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

  const handleAddSocialLink = () => {
    if (newSocialPlatform && newSocialUrl) {
      setProfileEdit((p) => ({ ...p, socialLinks: [...p.socialLinks, { platform: newSocialPlatform, url: newSocialUrl }] }));
      setNewSocialPlatform("");
      setNewSocialUrl("");
    }
  };

  const needsRegistration = team ? (team.status === "PENDING" || (!team.trackId && !team.problemStatementId)) : false;

  const handleSaveRegistration = () => {
    if (!team) return;
    if (!regTeamName.trim()) { toast("Please enter a team name.", "error"); return; }
    if (!regProblemStatementId) { toast("Please select a problem statement.", "error"); return; }
    updateProjectDetails(team.id, {
      name: regTeamName.trim(),
      problemStatementId: regProblemStatementId,
      projectDescription: regProjectBrief.trim(),
    });
    toast("Registration details saved.", "success");
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTeamName.trim()) {
      toast("Please enter a team name.", "error");
      return;
    }
    const profile = getProfile(session.email || "");
    const leader: Participant = {
      name: session.name || "Leader",
      email: session.email || "",
      registerNumber: profile?.registerNumber || "",
      phone: profile?.phone || "",
      department: profile?.department || "",
      year: profile?.year || "",
      skills: profile?.skills || [],
      isLeader: true,
    };
    const hackathonId = session.currentHackathonId || activeHackathonId || "";
    if (!hackathonId) {
      toast("No active hackathon selected for team registration.", "error");
      return;
    }

    try {
      await registerTeam({
        name: createTeamName.trim(),
        projectDescription: createTeamDescription.trim(),
        members: [leader],
        hackathonId,
      });
      toast("Team created successfully!", "success");
      setCreateTeamName("");
      setCreateTeamDescription("");
    } catch (err: unknown) {
      toast("Failed to create team.", "error");
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    if (confirm("Are you sure you want to leave this team?")) {
      try {
        await leaveTeam(team.id, session.email || "");
        toast("You have left the team.", "info");
      } catch (err: unknown) {
        toast("Failed to leave team.", "error");
      }
    }
  };

  const handleSendInviteToUser = async (userEmail: string, userName: string) => {
    if (!team) return;
    try {
      await sendTeamInvite(userEmail, userName, team.id, "Please join my team!");
      toast(`Invite sent to ${userName}`, "success");
    } catch (err: unknown) {
      toast("Failed to send invite.", "error");
    }
  };

  const handleJoinRequest = async (teamId: string) => {
    try {
      await sendJoinRequest(teamId, "I'd love to join your team!");
      toast("Join request sent successfully!", "success");
    } catch (err: unknown) {
      toast("Failed to send join request.", "error");
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    try {
      await cancelRequest(reqId);
      toast("Request cancelled.", "info");
    } catch (err: unknown) {
      toast("Failed to cancel request.", "error");
    }
  };

  const handleRespondInvite = async (reqId: string, accept: boolean) => {
    try {
      await respondToRequest(reqId, accept);
      toast(accept ? "Accepted team invitation!" : "Declined team invitation.", accept ? "success" : "info");
    } catch (err: unknown) {
      toast("Failed to respond to invitation.", "error");
    }
  };

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
                  <div className="h-7 w-7 rounded-lg bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs">
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
                        onClick={() => { setActiveTab("profile"); setProfileMenuOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-left"
                      >
                        <User className="h-4 w-4 text-primary-green" /> My Profile
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
                <div className="bg-linear-to-br from-primary-dark to-emerald-700 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <div className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Mission Control</div>
                      <h1 className="text-2xl font-extrabold mb-1">Welcome back, {session.name?.split(" ")[0] || "Participant"} 👋</h1>
                      <div className="text-emerald-200 text-sm">{team ? `${team.name} · ${track?.label || "Track not set"}` : "No Team Setup Yet"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {team && team.status === "APPROVED" && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-xs font-bold text-emerald-100"><CheckCircle className="h-3.5 w-3.5" /> Approved</span>}
                      {team && team.status === "PENDING" && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-100"><Clock className="h-3.5 w-3.5" /> Pending Approval</span>}
                      {avgScore !== null && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-bold text-blue-100">Score: {avgScore}/10</span>}
                      {!team && <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/30 text-xs font-bold text-red-100"><Info className="h-3.5 w-3.5" /> No Team</span>}
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
                      {JOURNEY_STAGES.map((stage) => {
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
            {/* ─── MY TEAM TAB ─── */}
            {activeTab === "team" && (
              <motion.div key="team" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2 dark:text-gray-100"><Users className="h-5 w-5 text-primary-green" /> My Team Workspace</h2>

                {team ? (
                  /* TEAMED VIEW */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Team Profile & Milestones */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2.5 py-1 rounded-md bg-emerald-550 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                              {HACK_TRACKS.find(t => t.id === team.trackId)?.label || "No Track Assigned"}
                            </span>
                            <h3 className="font-extrabold text-primary-dark text-2xl dark:text-gray-100 mt-2">{team.name}</h3>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${team.status === "APPROVED" ? "bg-emerald-105 text-emerald-700 bg-emerald-50" : "bg-amber-100 text-amber-700"}`}>
                            {team.status}
                          </span>
                        </div>

                        <p className="text-sm text-gray-650 dark:text-gray-400">{team.projectDescription || "No project description provided yet."}</p>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between items-center text-xs text-gray-450">
                          <span>Team Size: {team.members.length}/4 Members</span>
                          <span>Created: {new Date(team.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Registration Section — shown when team needs registration work */}
                      {needsRegistration && (
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 shadow-sm p-6 space-y-5 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800 animate-pulse-subtle">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                              <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-primary-dark text-lg dark:text-gray-100">Complete Your Registration</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Finish setting up your team to get approved by organizers.</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Team Name</label>
                              <input type="text" value={regTeamName} onChange={(e) => setRegTeamName(e.target.value)}
                                placeholder="e.g. Neural Knights"
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Problem Statement</label>
                              <select value={regProblemStatementId} onChange={(e) => setRegProblemStatementId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <option value="">Select a problem statement...</option>
                                {publishedProblemStatements.map((ps) => <option key={ps.id} value={ps.id}>{ps.title}</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Project Brief</label>
                            <textarea rows={3} value={regProjectBrief}
                              onChange={(e) => setRegProjectBrief(e.target.value)}
                              placeholder="Briefly describe your AI project idea..."
                              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                          </div>

                          <button onClick={handleSaveRegistration}
                            className="px-6 py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">
                            Save Registration Details
                          </button>
                        </div>
                      )}

                      {/* Milestone Progress */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Milestone Progress</h4>
                          <span className="text-xl font-extrabold text-primary-green">{regPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${regPercent}%` }} transition={{ duration: 0.8 }} className="h-2 rounded-full bg-linear-to-r from-primary-green to-teal-400" />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {regChecklist.map((item) => (
                            <div key={item.label} className="flex items-center gap-2">
                              {item.done ? <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" /> : <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0" />}
                              <span className={`text-xs ${item.done ? "text-gray-700 dark:text-gray-300" : "text-amber-600 dark:text-amber-400 font-medium"}`}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Members & Actions */}
                    <div className="space-y-6">
                      {/* Members list */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                        <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Team Members ({team.members.length}/4)</h4>
                        <div className="flex flex-col gap-3">
                          {team.members.map((m) => {
                            const isLeaderMember = m.isLeader;
                            return (
                              <div key={m.email} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                                <div className="h-9 w-9 rounded-xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                  {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0 text-xs">
                                  <div className="font-bold text-primary-dark dark:text-gray-100 flex items-center gap-1.5 truncate">
                                    {m.name}
                                    {isLeaderMember && <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-1 rounded-full shrink-0">Leader</span>}
                                  </div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{m.email}</div>
                                </div>
                                {!isLeaderMember && team.members.find(memb => memb.email === session.email)?.isLeader && (
                                  <button onClick={() => handleRemoveMember(m.email)} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Invite form (only for leaders) */}
                      {team.members.find(m => m.email === session.email)?.isLeader && team.members.length < 4 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-3">
                          <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Invite Teammate</h4>
                          <input
                            type="text"
                            placeholder="Search participants by name or email..."
                            value={userSearchQuery}
                            onChange={(e) => setUserSearchQuery(e.target.value)}
                            className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
                          />
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {userProfiles
                              .filter((u) => u.role === "participant" && u.email !== session.email)
                              .filter((u, index, self) => self.findIndex((t) => t.email === u.email) === index)
                              .filter((u) => !userSearchQuery || u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) || u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()))
                              .map((u) => {
                                const isAlreadyInTeam = teams.some(t => t.members.some(m => m.email === u.email));
                                const isInvitePending = teamRequests.some(r => r.direction === "invite" && r.toEmail === u.email && r.teamId === team.id && r.status === "pending");
                                return (
                                  <div key={u.email} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-750">
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-primary-dark dark:text-gray-100 truncate">{u.name || "Unknown"}</p>
                                      <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                                    </div>
                                    <button
                                      onClick={() => handleSendInviteToUser(u.email, u.name || "Participant")}
                                      disabled={isAlreadyInTeam || isInvitePending}
                                      className={`shrink-0 px-2.5 py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 ${
                                        isAlreadyInTeam ? "bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400" :
                                        isInvitePending ? "bg-amber-100 text-amber-700 cursor-not-allowed dark:bg-amber-900/30" :
                                        "bg-primary-green text-white hover:bg-primary-dark cursor-pointer"
                                      }`}
                                    >
                                      {isAlreadyInTeam ? "In Team" : isInvitePending ? "Pending" : <><Send className="h-3 w-3" /> Invite</>}
                                    </button>
                                  </div>
                                );
                              })}
                            {userProfiles.filter((u) => u.role === "participant" && u.email !== session.email).length === 0 && (
                              <p className="text-[10px] text-gray-400 text-center py-2">No other participants found.</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Sent Invites Status */}
                      {team.members.find(m => m.email === session.email)?.isLeader && teamRequests.filter(r => r.direction === "invite" && r.teamId === team.id && r.status === "pending").length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-3">
                          <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Pending Sent Invites</h4>
                          <div className="space-y-2">
                            {teamRequests
                              .filter(r => r.direction === "invite" && r.teamId === team.id && r.status === "pending")
                              .map((r) => (
                                <div key={r.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl">
                                  <div className="text-xs">
                                    <span className="font-bold block">{r.toEmail}</span>
                                    <span className="text-[10px] text-gray-400">Waiting for response</span>
                                  </div>
                                  <button
                                    onClick={() => handleCancelRequest(r.id)}
                                    className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Manage incoming requests for leaders */}
                      {team.members.find(m => m.email === session.email)?.isLeader && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-3">
                          <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Join Requests</h4>
                          <div className="space-y-2">
                            {teamRequests
                              .filter(r => r.direction === "join" && r.teamId === team.id && r.status === "pending")
                              .map((r) => (
                                <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-xl space-y-2">
                                  <div className="text-xs">
                                    <span className="font-bold">{r.fromName}</span> wants to join.
                                    <span className="text-[10px] text-gray-400 block font-mono">{r.fromEmail}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleRespondInvite(r.id, true)}
                                      className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRespondInvite(r.id, false)}
                                      className="flex-1 py-1.5 bg-red-50 dark:bg-red-950/20 text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              ))}
                            {teamRequests.filter(r => r.direction === "join" && r.teamId === team.id && r.status === "pending").length === 0 && (
                              <p className="text-[10px] text-gray-400 text-center py-2">No pending join requests.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Dangerous Actions */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-3">
                        <h4 className="font-bold text-sm text-red-650">Actions</h4>
                        {team.members.find(m => m.email === session.email)?.isLeader ? (
                          <button
                            onClick={() => {
                              if (confirm("Are you sure you want to disband the team? This action is permanent!")) {
                                deleteTeam(team.id);
                                toast("Team disbanded successfully.", "info");
                              }
                            }}
                            className="w-full py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Disband Team
                          </button>
                        ) : (
                          <button
                            onClick={handleLeaveTeam}
                            className="w-full py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <LogOut className="h-3.5 w-3.5" /> Leave Team
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TEAMLESS VIEW */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Create Team Form */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                        <h3 className="font-extrabold text-primary-dark text-lg dark:text-gray-100 flex items-center gap-1.5">
                          <Plus className="h-5 w-5 text-primary-green" /> Create a New Team
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Create a team to begin participating. You will automatically become the Team Leader.
                        </p>

                        <form onSubmit={handleCreateTeam} className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Team Name</label>
                            <input
                              type="text"
                              placeholder="e.g. Cyber Ninjas"
                              value={createTeamName}
                              onChange={(e) => setCreateTeamName(e.target.value)}
                              className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Project Idea Description</label>
                            <textarea
                              rows={3}
                              placeholder="Describe your solution brief..."
                              value={createTeamDescription}
                              onChange={(e) => setCreateTeamDescription(e.target.value)}
                              className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-805 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30 resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 bg-primary-green text-white font-bold text-xs rounded-xl hover:bg-primary-dark transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            Create Team
                          </button>
                        </form>
                      </div>

                      {/* Requests Status */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                        <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Pending Invitations ({
                          teamRequests.filter(r => r.direction === "invite" && r.toEmail === session.email && r.status === "pending").length
                        })</h4>
                        <div className="space-y-2.5">
                          {teamRequests
                            .filter(r => r.direction === "invite" && r.toEmail === session.email && r.status === "pending")
                            .map((r) => (
                              <div key={r.id} className="p-3.5 bg-gray-550 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl space-y-3">
                                <div className="text-xs text-gray-700 dark:text-gray-300">
                                  You are invited to join <strong>{r.teamName}</strong>.
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleRespondInvite(r.id, true)}
                                    className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleRespondInvite(r.id, false)}
                                    className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-655 dark:text-gray-300 text-[10px] font-bold rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                                  >
                                    Ignore
                                  </button>
                                </div>
                              </div>
                            ))}
                          {teamRequests.filter(r => r.direction === "invite" && r.toEmail === session.email && r.status === "pending").length === 0 && (
                            <p className="text-xs text-gray-405 text-center py-2">No pending invitations.</p>
                          )}
                        </div>

                        <hr className="border-gray-100 dark:border-gray-800" />

                        <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Sent Requests ({
                          teamRequests.filter(r => r.direction === "join" && r.fromEmail === session.email && r.status === "pending").length
                        })</h4>
                        <div className="space-y-2">
                          {teamRequests
                            .filter(r => r.direction === "join" && r.fromEmail === session.email && r.status === "pending")
                            .map((r) => (
                              <div key={r.id} className="flex justify-between items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs">
                                <div className="truncate">
                                  Request to join <strong>{r.teamName}</strong>
                                </div>
                                <button
                                  onClick={() => handleCancelRequest(r.id)}
                                  className="text-[10px] text-red-500 font-semibold hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ))}
                          {teamRequests.filter(r => r.direction === "join" && r.fromEmail === session.email && r.status === "pending").length === 0 && (
                            <p className="text-xs text-gray-405 text-center py-1">No sent requests.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Browse Teams List */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-extrabold text-primary-dark text-lg dark:text-gray-100">Browse Teams</h3>
                          <span className="text-xs text-gray-405">Join a team to hack together</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {teams
                            .filter(t => t.hackathonId === (session.currentHackathonId || activeHackathonId) && t.size < 4)
                            .map((t) => {
                              const alreadyRequested = teamRequests.some(r => r.direction === "join" && r.teamId === t.id && r.fromEmail === session.email && r.status === "pending");
                              const isMember = t.members.some(m => m.email === session.email);
                              const trackLabel = HACK_TRACKS.find(tr => tr.id === t.trackId)?.label || "General";

                              return (
                                <div key={t.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-750 bg-gray-50/50 dark:bg-gray-800/40 hover:border-primary-green/30 transition-all flex flex-col justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start gap-2">
                                      <h4 className="font-extrabold text-sm text-primary-dark dark:text-gray-100 truncate">{t.name}</h4>
                                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-505 px-2 py-0.5 rounded-full shrink-0">
                                        {t.size}/4 members
                                      </span>
                                    </div>
                                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wide block w-fit rounded px-1.5 py-0.5">
                                      {trackLabel}
                                    </span>
                                    <p className="text-xs text-gray-655 dark:text-gray-400 line-clamp-2">{t.projectDescription || "No brief solution provided yet."}</p>
                                  </div>

                                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-750 pt-3">
                                    <div className="flex -space-x-2">
                                      {t.members.map((m) => (
                                        <div
                                          key={m.email}
                                          className="h-6 w-6 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white font-extrabold text-[8px] cursor-help"
                                          title={`${m.name} (${m.email})`}
                                        >
                                          {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                                        </div>
                                      ))}
                                    </div>

                                    {isMember ? (
                                      <span className="text-[10px] text-emerald-600 font-bold">Joined</span>
                                    ) : alreadyRequested ? (
                                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md">Pending Approval</span>
                                    ) : (
                                      <button
                                        onClick={() => handleJoinRequest(t.id)}
                                        className="px-3.5 py-1.5 bg-primary-green hover:bg-primary-dark text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                                      >
                                        Request to Join
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {teams.filter(t => t.hackathonId === (session.currentHackathonId || activeHackathonId) && t.size < 4).length === 0 && (
                            <p className="text-xs text-gray-405 text-center col-span-2 py-8">No other teams with open slots found in this hackathon.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── FOOD TOKEN WALLET TAB ─── */}
            {activeTab === "foodWallet" && (
              <motion.div key="foodWallet" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2 dark:text-gray-100"><QrCode className="h-5 w-5 text-primary-green" /> My Food Wallet</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Active / Unused Food Tokens */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-sm text-primary-dark dark:text-gray-150">Available Meal Tokens</h3>
                        <span className="text-xs text-gray-400">Scan at the food counter to redeem</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {foodTokens
                          .filter((t) => t.participantEmail === session.email && t.status === "issued")
                          .map((t) => {
                            const meal = foodMeals.find(m => m.id === t.mealId);
                            const isPast = meal ? new Date(meal.scheduledAt).getTime() + meal.windowMinutes * 60000 < Date.now() : false;
                            const isFuture = meal ? new Date(meal.scheduledAt).getTime() > Date.now() : false;
                            const isServing = !isPast && !isFuture;

                            return (
                              <div
                                key={t.id}
                                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all ${
                                  isServing
                                    ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900 hover:shadow-md"
                                    : "bg-white border-gray-150 dark:bg-gray-800 dark:border-gray-700 hover:shadow-sm"
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
                                      {t.mealType}
                                    </span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${isServing ? "bg-emerald-550 text-white animate-pulse" : "bg-gray-150 text-gray-500"}`}>
                                      {isServing ? "Serving Now" : isFuture ? "Upcoming" : "Expired"}
                                    </span>
                                  </div>
                                  <h4 className="font-extrabold text-base text-primary-dark dark:text-gray-100">{t.mealName}</h4>
                                  {meal && (
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                      Serving: {new Date(meal.scheduledAt).toLocaleTimeString()} ({meal.windowMinutes} mins)
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-750">
                                  <div className="h-14 w-14 rounded-lg border border-gray-200 dark:border-gray-700 bg-white p-1 flex items-center justify-center relative overflow-hidden group shrink-0">
                                    {/* Mock SVG QR Code representation */}
                                    <svg className="h-12 w-12 text-gray-800 dark:text-gray-900" viewBox="0 0 100 100">
                                      <rect x="5" y="5" width="25" height="25" fill="currentColor" />
                                      <rect x="10" y="10" width="15" height="15" fill="white" />
                                      <rect x="70" y="5" width="25" height="25" fill="currentColor" />
                                      <rect x="75" y="10" width="15" height="15" fill="white" />
                                      <rect x="5" y="70" width="25" height="25" fill="currentColor" />
                                      <rect x="10" y="75" width="15" height="15" fill="white" />
                                      {/* Random matrix blocks */}
                                      <rect x="40" y="5" width="10" height="15" fill="currentColor" />
                                      <rect x="50" y="20" width="15" height="10" fill="currentColor" />
                                      <rect x="40" y="40" width="20" height="20" fill="currentColor" />
                                      <rect x="5" y="45" width="15" height="10" fill="currentColor" />
                                      <rect x="70" y="45" width="15" height="15" fill="currentColor" />
                                      <rect x="45" y="75" width="15" height="20" fill="currentColor" />
                                      <rect x="75" y="75" width="10" height="10" fill="currentColor" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] text-gray-400 block font-semibold">Token Code</span>
                                    <span className="text-xs font-mono font-extrabold text-primary-dark dark:text-gray-150 truncate block">{t.tokenCode}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        {foodTokens.filter((t) => t.participantEmail === session.email && t.status === "issued").length === 0 && (
                          <div className="text-center py-12 text-sm text-gray-450 col-span-2">
                            <Info className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            No active meal tokens in your wallet.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Redemption History */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                      <h3 className="font-bold text-sm text-primary-dark dark:text-gray-150">Redemption History</h3>
                      <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">Meal</th>
                              <th className="px-4 py-2.5">Token Code</th>
                              <th className="px-4 py-2.5">Redeemed At</th>
                              <th className="px-4 py-2.5">Redeemed By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {foodTokens
                              .filter((t) => t.participantEmail === session.email && t.status === "redeemed")
                              .map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                                  <td className="px-4 py-3 font-semibold text-primary-dark dark:text-gray-200">{t.mealName}</td>
                                  <td className="px-4 py-3 font-mono">{t.tokenCode}</td>
                                  <td className="px-4 py-3 text-gray-400">
                                    {t.redeemedAt ? new Date(t.redeemedAt).toLocaleString() : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-gray-400">{t.redeemedBy || "Self-check"}</td>
                                </tr>
                              ))}
                            {foodTokens.filter((t) => t.participantEmail === session.email && t.status === "redeemed").length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-gray-405 text-center text-gray-400 text-[10px]">
                                  No redemption history yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Food Schedule / Instructions */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-4">
                      <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Active Meal Menu</h4>
                      <div className="space-y-3">
                        {foodMeals.map((m) => {
                          const isPast = new Date(m.scheduledAt).getTime() + m.windowMinutes * 60000 < Date.now();
                          const isFuture = new Date(m.scheduledAt).getTime() > Date.now();
                          const isServing = !isPast && !isFuture;

                          return (
                            <div
                              key={m.id}
                              className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${
                                isServing
                                  ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900"
                                  : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-xs text-primary-dark dark:text-gray-150">{m.name}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${isServing ? "bg-emerald-100 text-emerald-805 bg-emerald-50/50" : "bg-gray-100 text-gray-500"}`}>
                                  {isServing ? "Serving Now" : isFuture ? "Upcoming" : "Ended"}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400">
                                Time: {new Date(m.scheduledAt).toLocaleTimeString()} ({m.windowMinutes}m validity)
                              </span>
                            </div>
                          );
                        })}
                        {foodMeals.length === 0 && (
                          <div className="text-center py-4 text-xs text-gray-400">No meals scheduled yet.</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 dark:bg-gray-900 dark:border-gray-700 space-y-3 text-xs text-gray-600 dark:text-gray-400">
                      <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Redemption Rules</h4>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">1</span>
                        <p>Tokens are active only during the meal window shown.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">2</span>
                        <p>Present the QR code at the counter for scanning.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-[10px] shrink-0">3</span>
                        <p>Each token can be scanned and redeemed exactly once.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── PROJECT TAB ─── */}
            {activeTab === "project" && (
              <motion.div key="project" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2 dark:text-gray-100"><FolderOpen className="h-5 w-5 text-primary-green" /> Project Workspace</h2>

                {!team ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 dark:bg-gray-900 dark:border-gray-700 text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center text-amber-500 mx-auto text-xl font-bold">!</div>
                    <h3 className="font-bold text-primary-dark dark:text-gray-100 text-lg">No Team Setup Found</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">You must join or create a team to access project repositories, submission gates, and track-specific resources.</p>
                    <button onClick={() => setActiveTab("team")} className="px-5 py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark cursor-pointer transition-colors">Go to My Team tab</button>
                  </div>
                ) : (
                  <>
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
                          <div className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {track?.label || "Not set"}
                          </div>
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
                  </>
                )}
              </motion.div>
            )}

            {/* ─── NOTIFICATIONS TAB ─── */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2 dark:text-gray-100"><Bell className="h-5 w-5 text-primary-green" /> Notifications</h2>
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsRead} className="text-sm font-semibold text-primary-green hover:underline cursor-pointer">Mark all as read</button>
                  )}
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-2">
                  {(["all", "approval", "deadline", "judge", "action", "system"] as const).map((f) => (
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
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2 dark:text-gray-100"><BookOpen className="h-5 w-5 text-primary-green" /> Resources</h2>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-extrabold text-primary-dark dark:text-gray-100 text-sm">On-Spot Problem Materials</div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Official problem statements, PPT templates, and datasets uploaded by the organizing team.</p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      {publishedProblemStatements.length} published
                    </span>
                  </div>

                  {publishedProblemStatements.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-5 text-center text-sm text-gray-400 dark:text-gray-500">
                      On-spot materials will appear here after organizers publish them.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {publishedProblemStatements.map((ps) => {
                        const track = HACK_TRACKS.find((t) => t.id === ps.trackId);
                        return (
                          <div key={ps.id} className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-primary-dark dark:text-gray-100 text-sm">{ps.title}</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  {track?.label || "General"}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{ps.description}</p>
                            </div>

                            {ps.attachments && ps.attachments.length > 0 ? (
                              <div className="space-y-2">
                                {ps.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 p-3">
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-gray-800 dark:text-gray-100 truncate">{att.name}</div>
                                      <div className="text-[10px] text-gray-400 dark:text-gray-500">{formatFileSize(att.size)}</div>
                                    </div>
                                    <button
                                      onClick={() => downloadAttachment(att)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer shrink-0"
                                    >
                                      <Download className="h-3.5 w-3.5" /> Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 dark:text-gray-500">No files attached yet.</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sub-category pills */}
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(resourceData) as (keyof typeof resourceData)[]).map((k) => (
                    <button key={k} onClick={() => setResourceTab(k)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${resourceTab === k ? "bg-primary-green text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-green/40 hover:text-primary-green"}`}
                    >
                      {k === "templates" && <Code2 className="h-4 w-4" />}
                      {k === "datasets" && <Database className="h-4 w-4" />}
                      {resourceData[k].label}
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
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2 dark:text-gray-100"><LifeBuoy className="h-5 w-5 text-primary-green" /> Support</h2>

                {/* Raise Ticket + Track Tickets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Raise Ticket form */}
                  {!team ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700 text-center flex flex-col justify-center items-center gap-3">
                      <Info className="h-8 w-8 text-amber-500" />
                      <h4 className="font-bold text-sm text-primary-dark dark:text-gray-150">Team Support Gated</h4>
                      <p className="text-xs text-gray-500">You must be in a team to raise support tickets to mentors and venue crew.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 dark:bg-gray-900 dark:border-gray-700">
                      <div className="font-bold text-primary-dark text-sm dark:text-gray-100">Raise a Ticket</div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Category</label>
                        <select value={ticketCategory} onChange={(e) => setTicketCategory(e.target.value as SupportTicketCategory)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {(["Internet", "Power", "Mentor Needed", "Hardware", "Food", "Venue", "Other"] as SupportTicketCategory[]).map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Describe your issue</label>
                        <textarea rows={3} value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)}
                          placeholder="Tell us what's wrong..."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                      </div>
                      <button onClick={handleRaiseTicket} className="w-full py-2.5 rounded-xl bg-primary-green text-white font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer">Submit Ticket</button>
                    </div>
                  )}

                  {/* Track Tickets */}
                  <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-3">
                    <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">Your Tickets</div>
                    {(!team || (team.supportTickets || []).length === 0) ? (
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
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(tk.createdAt).toLocaleString()}</div>
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

                {/* WhatsApp + Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="https://chat.whatsapp.com/ai-lab-hackathon" target="_blank" rel="noopener noreferrer"
                    className="group flex items-center gap-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm hover:border-primary-green/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"><MessageCircle className="h-5 w-5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">WhatsApp Group</div>
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

            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><User className="h-5 w-5 text-primary-green" /> Profile & Settings</h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-extrabold text-xl shrink-0">
                      {profileEdit.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileEdit.profilePicture} alt="Profile" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        (session.name || session.email || "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-primary-dark text-lg">{session.name || "Participant"}</div>
                      <div className="text-gray-400 dark:text-gray-500 text-sm">{session.email}</div>
                      <div className="text-xs font-semibold text-primary-green mt-0.5">
                        {team ? `${team.name} · ${currentUser?.isLeader ? "Team Leader" : "Team Member"}` : "No Team Setup Yet"}
                      </div>
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
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageWrapper>
  );
}
