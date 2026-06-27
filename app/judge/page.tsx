"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Modal } from "@/components/ui/modal";
import { QRScanner } from "@/components/ui/QRScanner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Sun, Moon,
  Search, CheckCircle, Clock, X, ChevronRight,
  Github, Video, Globe, Star, Users, Mail, Phone,
  Eye
} from "lucide-react";
import { Team } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

type TabType = "dashboard" | "queue" | "profile";
type ProfileTabType = "edit" | "appearance";

const SCORE_CRITERIA = [
  { key: "innovation" as const, label: "Innovation & Originality", max: 10 },
  { key: "feasibility" as const, label: "Feasibility & Impact", max: 10 },
  { key: "presentation" as const, label: "Presentation Quality", max: 10 },
  { key: "technicalDepth" as const, label: "Technical Depth", max: 10 },
  { key: "aiUsage" as const, label: "AI/ML Integration", max: 10 },
];

export default function JudgeDashboard() {
  const router = useRouter();
  const { session, teams, notifications, evaluateProject, markNotificationRead, markAllNotificationsRead } = useAppState();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [profileTab, setProfileTab] = useState<ProfileTabType>("edit");

  // Filters
  const [trackFilter, setTrackFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Team detail popup
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Evaluation modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalTeam, setEvalTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState({ innovation: 8, feasibility: 8, presentation: 8, technicalDepth: 7, aiUsage: 8 });
  const [feedback, setFeedback] = useState("");

  // QR Scanner
  const [scannerOpen, setScannerOpen] = useState(false);

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "judge")) router.push("/login");
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "judge") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400 dark:text-gray-500">Loading judge portal...</div>;
  }

  const assignedTeams = teams.filter((t) => t.status === "APPROVED");
  const reviewedTeams = assignedTeams.filter((t) => t.evaluations?.some((e) => e.judgeEmail === session.email));
  const pendingTeams = assignedTeams.filter((t) => !t.evaluations?.some((e) => e.judgeEmail === session.email));
  const avgScore = reviewedTeams.length > 0
    ? Math.round(reviewedTeams.reduce((acc, t) => {
        const ev = t.evaluations?.find((e) => e.judgeEmail === session.email);
        return acc + (ev ? (ev.innovation + ev.feasibility + ev.presentation + (ev.technicalDepth ?? 0) + (ev.aiUsage ?? 0)) / 5 : 0);
      }, 0) / reviewedTeams.length * 10) / 10
    : 0;

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Apply filters to queue
  const departments = Array.from(new Set(assignedTeams.flatMap((t) => t.members.map((m) => m.department))));
  const filteredQueue = assignedTeams.filter((t) => {
    if (trackFilter !== "all" && t.trackId !== trackFilter) return false;
    if (statusFilter === "pending" && t.evaluations?.some((e) => e.judgeEmail === session.email)) return false;
    if (statusFilter === "reviewed" && !t.evaluations?.some((e) => e.judgeEmail === session.email)) return false;
    if (deptFilter !== "all" && !t.members.some((m) => m.department === deptFilter)) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openEvalModal = (team: Team) => {
    setEvalTeam(team);
    const existing = team.evaluations?.find((e) => e.judgeEmail === session.email);
    if (existing) {
      setScores({
        innovation: existing.innovation,
        feasibility: existing.feasibility,
        presentation: existing.presentation,
        technicalDepth: existing.technicalDepth || 7,
        aiUsage: existing.aiUsage || 8,
      });
      setFeedback(existing.feedback);
    } else {
      setScores({ innovation: 8, feasibility: 8, presentation: 8, technicalDepth: 7, aiUsage: 8 });
      setFeedback("");
    }
    setEvalModalOpen(true);
    setSelectedTeam(null);
  };

  const handleSubmitEval = () => {
    if (!evalTeam) return;
    evaluateProject(evalTeam.id, { ...scores, feedback, judgeEmail: session.email! });
    toast(`Evaluation submitted for ${evalTeam.name}`, "success");
    setEvalModalOpen(false);
    setEvalTeam(null);
  };

  return (
    <PageWrapper>
      <div className="flex min-h-screen bg-[#f8fafb] dark:bg-gray-950">
        <Sidebar activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabType)} />
        <main className="flex-1 min-w-0 p-6 lg:p-8">
          {/* Header Bar — utility actions only; navigation handled by Sidebar */}
          <div className="flex items-center justify-end gap-2 mb-8">
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <button onClick={() => setScannerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <GavelIcon className="h-4 w-4" /> Scan QR
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
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
                            className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                          >Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications</div>}
                        {notifications.slice(0, 10).map((n) => (
                          <div key={n.id} onClick={() => markNotificationRead(n.id)}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.read ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                          >
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"}`} />
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
            {/* ─── DASHBOARD ─── */}
            {activeTab === "dashboard" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-gradient-to-br from-blue-800 to-indigo-700 rounded-2xl p-6 text-white">
                  <div className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Judge Portal</div>
                  <h1 className="text-2xl font-extrabold mb-1">Welcome, {session.name || "Judge"}</h1>
                  <p className="text-blue-200 text-sm">You have {pendingTeams.length} teams remaining to evaluate.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Assigned", value: assignedTeams.length, icon: <Users className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
                    { label: "Completed", value: reviewedTeams.length, icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
                    { label: "Remaining", value: pendingTeams.length, icon: <Clock className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
                    { label: "Avg Score", value: `${avgScore}/10`, icon: <Star className="h-5 w-5 text-purple-500" />, bg: "bg-purple-50" },
                  ].map((k) => (
                    <div key={k.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-2">
                      <div className={`p-2 rounded-xl w-fit ${k.bg}`}>{k.icon}</div>
                      <div className="text-2xl font-extrabold text-primary-dark dark:text-gray-100">{k.value}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">Review Progress</div>
                    <div className="text-sm font-semibold text-blue-600">{reviewedTeams.length} / {assignedTeams.length}</div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${assignedTeams.length > 0 ? (reviewedTeams.length / assignedTeams.length) * 100 : 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>
                </div>

                {/* Pending */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                  <div className="font-bold text-primary-dark dark:text-gray-100 text-sm mb-3">Pending Reviews</div>
                  <div className="flex flex-col gap-2">
                    {pendingTeams.slice(0, 3).map((t) => {
                      const track = HACK_TRACKS.find((tr) => tr.id === t.trackId);
                      return (
                        <button key={t.id} onClick={() => openEvalModal(t)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group text-left">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-primary-dark dark:text-gray-100">{t.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{track?.label || "—"}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      );
                    })}
                    {pendingTeams.length === 0 && <div className="text-sm text-gray-400 text-center py-4">All teams reviewed!</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── REVIEW QUEUE ─── */}
            {activeTab === "queue" && (
              <motion.div key="queue" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Review Queue</h2>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center dark:bg-gray-900 dark:border-gray-700">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <option value="all">All Tracks</option>
                    {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <option value="all">All Departments</option>
                    {departments.map((d) => <option key={d} value={d}>{d.split("&")[0].trim()}</option>)}
                  </select>
                </div>

                <div className="text-xs text-gray-400 font-semibold dark:text-gray-500">{filteredQueue.length} teams</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQueue.map((team) => {
                    const track = HACK_TRACKS.find((tr) => tr.id === team.trackId);
                    const reviewed = team.evaluations?.some((e) => e.judgeEmail === session.email);
                    const myEval = team.evaluations?.find((e) => e.judgeEmail === session.email);
                    const teamAvgScore = myEval ? Math.round((myEval.innovation + myEval.feasibility + myEval.presentation + (myEval.technicalDepth ?? 0) + (myEval.aiUsage ?? 0)) / 5 * 10) / 10 : null;
                    return (
                      <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-primary-dark dark:text-gray-100">{team.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{track?.label || "—"} · {team.members.length} members</div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${reviewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {reviewed ? "Reviewed" : "Pending"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{team.projectDescription}</p>

                        {reviewed && teamAvgScore !== null && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Your Score: {teamAvgScore}/10</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => setSelectedTeam(team)}
                            className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer inline-flex items-center justify-center gap-1 dark:border-gray-700 dark:text-gray-300">
                            <Eye className="h-3.5 w-3.5" /> View Details
                          </button>
                          <button onClick={() => openEvalModal(team)}
                            className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer">
                            {reviewed ? "Update Score" : "Evaluate"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {filteredQueue.length === 0 && <div className="col-span-2 text-center text-gray-400 py-12 text-sm">No teams match your filters.</div>}
                </div>
              </motion.div>
            )}

            {/* ─── PROFILE ─── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Profile & Settings</h2>
                <div className="flex gap-2 flex-wrap">
                  {(["edit", "appearance"] as const).map((t) => (
                    <button key={t} onClick={() => setProfileTab(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize cursor-pointer transition-colors ${profileTab === t ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"}`}
                    >{t === "edit" ? "Edit Profile" : "Appearance"}</button>
                  ))}
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                  {profileTab === "edit" && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
                          {(session.name || "J").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-primary-dark dark:text-gray-100 text-lg">{session.name || "Judge"}</div>
                          <div className="text-gray-400 dark:text-gray-500 text-sm">{session.email}</div>
                          <div className="text-xs font-semibold text-blue-600 mt-0.5">Judge · SIET AI Hack Lab 2026</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Full Name</label>
                          <input type="text" defaultValue={session.name || ""} readOnly
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Email</label>
                          <input type="email" value={session.email || ""} readOnly
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Bio</label>
                        <textarea rows={3} defaultValue="" placeholder="Tell us about yourself..."
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Skills</label>
                        <input type="text" defaultValue="" placeholder="e.g. AI/ML, Web Dev, Cloud"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Social Links</label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 dark:text-gray-500"><Github className="h-4 w-4" /></span>
                          <input type="url" defaultValue="" placeholder="GitHub profile URL"
                            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                        </div>
                      </div>
                      <button onClick={() => toast("Profile updated successfully", "success")}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors cursor-pointer">
                        Save Changes
                      </button>
                    </div>
                  )}

                  {profileTab === "appearance" && (
                    <div className="space-y-6">
                      <div>
                        <div className="font-bold text-primary-dark text-sm mb-3 dark:text-gray-100">Theme</div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Toggle between light and dark mode. You can also switch anytime using the icon beside the notification bell.</p>
                        <ThemeToggle />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Scanner Modal */}
          <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSelectTeam={(team) => { openEvalModal(team); }} />

          {/* ─── EVALUATION MODAL ─── */}
          <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Evaluate Team">
            {evalTeam && (
              <div className="space-y-5">
                {/* Team Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0">
                    {evalTeam.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-extrabold text-primary-dark dark:text-gray-100">{evalTeam.name}</div>
                    <div className="text-sm text-gray-400 dark:text-gray-500">{HACK_TRACKS.find(t => t.id === evalTeam.trackId)?.label || "—"}</div>
                  </div>
                </div>

                {/* Members */}
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Members</div>
                  <div className="flex flex-col gap-1.5">
                    {evalTeam.members.map((m) => (
                      <div key={m.email} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                          {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-medium">{m.name}</span>
                        {m.isLeader && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 rounded-full border border-amber-200">Leader</span>}
                        <span className="text-xs text-gray-400">· {m.department}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Description */}
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Project</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{evalTeam.projectDescription || "Not provided."}</p>
                </div>

                {/* Links */}
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Links</div>
                  <div className="flex flex-wrap gap-2">
                    {evalTeam.githubUrl && (
                      <a href={evalTeam.githubUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Github className="h-3.5 w-3.5" /> GitHub
                      </a>
                    )}
                    {evalTeam.demoUrl && (
                      <a href={evalTeam.demoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Globe className="h-3.5 w-3.5" /> Demo
                      </a>
                    )}
                    {evalTeam.videoUrl && (
                      <a href={evalTeam.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                        <Video className="h-3.5 w-3.5" /> Video
                      </a>
                    )}
                    {!evalTeam.githubUrl && !evalTeam.demoUrl && !evalTeam.videoUrl && (
                      <span className="text-xs text-gray-400">No links submitted</span>
                    )}
                  </div>
                </div>

                {/* Score Sliders */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Scoring Rubric</div>
                  {SCORE_CRITERIA.map(({ key, label, max }) => (
                    <div key={key} className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</label>
                        <span className="text-xs font-extrabold text-blue-600">{scores[key]}/{max}</span>
                      </div>
                      <input type="range" min={1} max={max} value={scores[key]}
                        onChange={(e) => setScores((p) => ({ ...p, [key]: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5"><span>1</span><span>{max}</span></div>
                    </div>
                  ))}
                </div>

                {/* Written Feedback */}
                <div>
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-1.5">Written Feedback</label>
                  <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide detailed constructive feedback for the team..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setEvalModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                    Cancel
                  </button>
                  <button onClick={handleSubmitEval}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 cursor-pointer">
                    Submit Score
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Team Detail Popup (for View Details button) */}
          <AnimatePresence>
            {selectedTeam && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setSelectedTeam(null)} className="absolute inset-0 bg-black" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] overflow-y-auto"
                >
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-600 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
                    <div>
                      <div className="text-blue-200 text-xs font-bold uppercase tracking-wide">Team Details</div>
                      <div className="text-white font-extrabold text-lg">{selectedTeam.name}</div>
                    </div>
                    <button onClick={() => setSelectedTeam(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-white cursor-pointer"><X className="h-5 w-5" /></button>
                  </div>
                  <div className="p-5 space-y-5">
                    {/* Members */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Members</div>
                      <div className="flex flex-col gap-2">
                        {selectedTeam.members.map((m) => (
                          <div key={m.email} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-primary-dark dark:text-gray-100 flex items-center gap-1">
                                {m.name} {m.isLeader && <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 rounded-full border border-amber-200 dark:border-amber-800">Leader</span>}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500">{m.department} · {m.year}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"><Mail className="h-3 w-3" />{m.email}</div>
                              {m.phone && <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500"><Phone className="h-3 w-3" />{m.phone}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Project */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Problem Statement & Abstract</div>
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{HACK_TRACKS.find(t => t.id === selectedTeam.trackId)?.label || "—"}</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedTeam.projectDescription || "Not provided."}</p>
                    </div>

                    {/* Links */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Links</div>
                      <div className="flex flex-col gap-2">
                        {selectedTeam.githubUrl && <a href={selectedTeam.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"><Github className="h-4 w-4" /> Repository</a>}
                        {selectedTeam.videoUrl && <a href={selectedTeam.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"><Video className="h-4 w-4" /> Demo Video</a>}
                        {selectedTeam.demoUrl && <a href={selectedTeam.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"><Globe className="h-4 w-4" /> Live Demo</a>}
                        {!selectedTeam.githubUrl && !selectedTeam.videoUrl && !selectedTeam.demoUrl && <span className="text-sm text-gray-400 dark:text-gray-500">No links submitted yet.</span>}
                      </div>
                    </div>

                    {/* Previous Feedback */}
                    {(selectedTeam.evaluations || []).length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Previous Feedback</div>
                        {selectedTeam.evaluations!.map((ev, i) => (
                          <div key={i} className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">{ev.feedback}</div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => { openEvalModal(selectedTeam); }}
                      className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer">
                      Start Evaluation
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </PageWrapper>
  );
}

function GavelIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" />
      <path d="m16 16 6-6" />
      <path d="m8 8 6-6" />
      <path d="m9 7 8 8" />
      <path d="m21 11-8-8" />
    </svg>
  );
}
