"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { QRScanner } from "@/components/ui/QRScanner";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ListChecks, Gavel, Trophy, Bell, User,
  Search, Filter, CheckCircle, Clock, X, ChevronRight,
  Github, Video, Globe, Star, ExternalLink, Users, Mail, Phone,
  TrendingUp, Award, Target
} from "lucide-react";
import { Team, Notification } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

type TabType = "dashboard" | "queue" | "evaluation" | "leaderboard" | "notifications" | "profile";
type ProfileTabType = "info" | "account" | "notifications" | "appearance" | "security";

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
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [profileTab, setProfileTab] = useState<ProfileTabType>("info");

  // Filters
  const [trackFilter, setTrackFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Team detail popup
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Evaluation scores
  const [scores, setScores] = useState({ innovation: 8, feasibility: 8, presentation: 8, technicalDepth: 7, aiUsage: 8 });
  const [feedback, setFeedback] = useState("");

  // QR Scanner
  const [scannerOpen, setScannerOpen] = useState(false);

  // Notification filter
  const [notifFilter, setNotifFilter] = useState<"all" | Notification["type"]>("all");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "judge")) router.push("/login");
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "judge") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading judge portal...</div>;
  }

  const assignedTeams = teams.filter((t) => t.status === "APPROVED");
  const reviewedTeams = assignedTeams.filter((t) => t.evaluations?.some((e) => e.judgeEmail === session.email));
  const pendingTeams = assignedTeams.filter((t) => !t.evaluations?.some((e) => e.judgeEmail === session.email));
  const avgScore = reviewedTeams.length > 0
    ? Math.round(reviewedTeams.reduce((acc, t) => {
        const ev = t.evaluations?.find((e) => e.judgeEmail === session.email);
        return acc + (ev ? (ev.innovation + ev.feasibility + ev.presentation) / 3 : 0);
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

  const handleOpenEval = (team: Team) => {
    setSelectedTeam(team);
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
    setActiveTab("evaluation");
  };

  const handleSubmitEval = () => {
    if (!selectedTeam) return;
    evaluateProject(selectedTeam.id, { ...scores, feedback, judgeEmail: session.email! });
    toast(`Evaluation submitted for ${selectedTeam.name}`, "success");
    setSelectedTeam(null);
    setActiveTab("queue");
  };

  const leaderboard = [...assignedTeams]
    .map((t) => {
      const evs = t.evaluations || [];
      const avg = evs.length > 0 ? evs.reduce((a, e) => a + (e.innovation + e.feasibility + e.presentation) / 3, 0) / evs.length : 0;
      return { team: t, avg: Math.round(avg * 10) / 10, count: evs.length };
    })
    .sort((a, b) => b.avg - a.avg);

  const notifTypeStyles: Record<string, { dot: string; label: string }> = {
    approval: { dot: "bg-emerald-500", label: "Approval" },
    deadline: { dot: "bg-amber-500", label: "Deadline" },
    mentor: { dot: "bg-purple-500", label: "Mentor" },
    judge: { dot: "bg-blue-500", label: "Judge" },
    action: { dot: "bg-red-500", label: "Action" },
    system: { dot: "bg-gray-400", label: "System" },
  };

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "queue" as TabType, label: "Review Queue", icon: <ListChecks className="h-4 w-4" /> },
    { id: "evaluation" as TabType, label: "Evaluation", icon: <Gavel className="h-4 w-4" /> },
    { id: "leaderboard" as TabType, label: "Leaderboard", icon: <Trophy className="h-4 w-4" /> },
    { id: "notifications" as TabType, label: "Notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "profile" as TabType, label: "Profile", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <PageWrapper>
      <div className="flex min-h-screen bg-[#f8fafb]">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8">
          {/* Tab Bar */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id ? "bg-blue-600 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600"}`}
              >
                {tab.icon}{tab.label}
                {tab.badge && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">{tab.badge}</span>}
              </button>
            ))}
            <button onClick={() => setScannerOpen(true)}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Gavel className="h-4 w-4" /> Scan QR
            </button>
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
                    <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-2">
                      <div className={`p-2 rounded-xl w-fit ${k.bg}`}>{k.icon}</div>
                      <div className="text-2xl font-extrabold text-primary-dark">{k.value}</div>
                      <div className="text-xs text-gray-400 font-semibold">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-bold text-primary-dark text-sm">Review Progress</div>
                    <div className="text-sm font-semibold text-blue-600">{reviewedTeams.length} / {assignedTeams.length}</div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${assignedTeams.length > 0 ? (reviewedTeams.length / assignedTeams.length) * 100 : 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                  </div>
                </div>

                {/* Pending */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="font-bold text-primary-dark text-sm mb-3">Pending Reviews</div>
                  <div className="flex flex-col gap-2">
                    {pendingTeams.slice(0, 3).map((t) => {
                      const track = HACK_TRACKS.find((tr) => tr.id === t.trackId);
                      return (
                        <button key={t.id} onClick={() => handleOpenEval(t)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors cursor-pointer group text-left">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-primary-dark">{t.name}</div>
                            <div className="text-xs text-gray-400">{track?.label || "—"}</div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                      );
                    })}
                    {pendingTeams.length === 0 && <div className="text-sm text-gray-400 text-center py-4">All teams reviewed! 🎉</div>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── REVIEW QUEUE ─── */}
            {activeTab === "queue" && (
              <motion.div key="queue" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Review Queue</h2>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
                  <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  </div>
                  <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                    <option value="all">All Tracks</option>
                    {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                  </select>
                  <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer">
                    <option value="all">All Departments</option>
                    {departments.map((d) => <option key={d} value={d}>{d.split("&")[0].trim()}</option>)}
                  </select>
                </div>

                <div className="text-xs text-gray-400 font-semibold">{filteredQueue.length} teams</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredQueue.map((team) => {
                    const track = HACK_TRACKS.find((tr) => tr.id === team.trackId);
                    const reviewed = team.evaluations?.some((e) => e.judgeEmail === session.email);
                    const myEval = team.evaluations?.find((e) => e.judgeEmail === session.email);
                    const avgScore = myEval ? Math.round((myEval.innovation + myEval.feasibility + myEval.presentation) / 3 * 10) / 10 : null;
                    return (
                      <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-primary-dark">{team.name}</div>
                            <div className="text-xs text-gray-400">{track?.label || "—"} · {team.members.length} members</div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${reviewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {reviewed ? "Reviewed" : "Pending"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2">{team.projectDescription}</p>

                        {reviewed && avgScore !== null && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-400" />
                            <span className="text-sm font-bold text-gray-700">Your Score: {avgScore}/10</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => setSelectedTeam(team)}
                            className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer">
                            View Details
                          </button>
                          <button onClick={() => handleOpenEval(team)}
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

            {/* ─── EVALUATION ─── */}
            {activeTab === "evaluation" && (
              <motion.div key="eval" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Evaluation</h2>
                {!selectedTeam ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <Target className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <div className="text-gray-400 text-sm mb-4">Select a team from the Review Queue to begin evaluation.</div>
                    <button onClick={() => setActiveTab("queue")} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 cursor-pointer">Go to Queue</button>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {selectedTeam.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-extrabold text-primary-dark">{selectedTeam.name}</div>
                        <div className="text-sm text-gray-400">{HACK_TRACKS.find(t => t.id === selectedTeam.trackId)?.label || "—"}</div>
                      </div>
                    </div>

                    {SCORE_CRITERIA.map(({ key, label, max }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-gray-700">{label}</label>
                          <span className="text-sm font-extrabold text-blue-600">{scores[key]}/{max}</span>
                        </div>
                        <input type="range" min={1} max={max} value={scores[key]}
                          onChange={(e) => setScores((p) => ({ ...p, [key]: parseInt(e.target.value) }))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-gray-300 mt-1"><span>1</span><span>{max}</span></div>
                      </div>
                    ))}

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Written Feedback</label>
                      <textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide detailed constructive feedback for the team..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => { setSelectedTeam(null); setActiveTab("queue"); }}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer">
                        Cancel
                      </button>
                      <button onClick={handleSubmitEval}
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 cursor-pointer">
                        Submit Evaluation
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── LEADERBOARD ─── */}
            {activeTab === "leaderboard" && (
              <motion.div key="lb" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Leaderboard</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">#</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Team</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Track</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Evaluations</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map(({ team, avg, count }, idx) => (
                        <tr key={team.id} className={`border-b border-gray-50 last:border-0 ${idx < 3 ? "bg-amber-50/30" : ""}`}>
                          <td className="px-5 py-3 font-bold text-gray-400">
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                          </td>
                          <td className="px-5 py-3 font-semibold text-primary-dark">{team.name}</td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{HACK_TRACKS.find(t => t.id === team.trackId)?.label || "—"}</td>
                          <td className="px-5 py-3 text-gray-500">{count}</td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-amber-400" />
                              <span className="font-extrabold text-primary-dark">{count > 0 ? avg : "—"}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── NOTIFICATIONS ─── */}
            {activeTab === "notifications" && (
              <motion.div key="notifs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-primary-dark text-xl">Notifications</h2>
                  {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="text-sm font-semibold text-blue-600 hover:underline cursor-pointer">Mark all read</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "approval", "deadline", "judge", "system"] as const).map((f) => (
                    <button key={f} onClick={() => setNotifFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-colors ${notifFilter === f ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
                    >{notifTypeStyles[f]?.label || "All"}</button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {(notifFilter === "all" ? notifications : notifications.filter((n) => n.type === notifFilter)).map((n) => (
                    <div key={n.id} onClick={() => markNotificationRead(n.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${!n.read ? "bg-blue-50 border-blue-100" : "bg-white border-gray-100"}`}>
                      <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${notifTypeStyles[n.type]?.dot || "bg-gray-400"}`} />
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${!n.read ? "text-primary-dark" : "text-gray-500"}`}>{n.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{n.body}</div>
                      </div>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── PROFILE ─── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Profile & Settings</h2>
                <div className="flex gap-2 flex-wrap">
                  {(["info", "account", "notifications", "appearance", "security"] as const).map((t) => (
                    <button key={t} onClick={() => setProfileTab(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize cursor-pointer transition-colors ${profileTab === t ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
                    >{t === "info" ? "Personal Info" : t}</button>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  {profileTab === "info" && (
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold">
                        {(session.name || "J").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-primary-dark text-lg">{session.name || "Judge"}</div>
                        <div className="text-gray-400 text-sm">{session.email}</div>
                        <div className="text-xs font-semibold text-blue-600 mt-0.5">Judge · SIET AI Hack Lab 2026</div>
                      </div>
                    </div>
                  )}
                  {profileTab === "account" && <div className="text-sm text-gray-500">Email: <span className="font-semibold text-gray-800">{session.email}</span></div>}
                  {profileTab === "notifications" && <div className="text-sm text-gray-400">Notification preferences coming soon.</div>}
                  {profileTab === "appearance" && <div className="text-sm text-gray-400">Theme settings coming soon.</div>}
                  {profileTab === "security" && <div className="text-sm text-gray-400">Password management coming soon.</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Scanner Modal */}
          <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSelectTeam={(team) => { handleOpenEval(team); }} />

          {/* Team Detail Popup */}
          <AnimatePresence>
            {selectedTeam && activeTab === "queue" && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setSelectedTeam(null)} className="absolute inset-0 bg-black" />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] overflow-y-auto"
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
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Members</div>
                      <div className="flex flex-col gap-2">
                        {selectedTeam.members.map((m) => (
                          <div key={m.email} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-primary-dark flex items-center gap-1">
                                {m.name} {m.isLeader && <span className="text-xs text-amber-600 bg-amber-50 px-1.5 rounded-full border border-amber-200">Leader</span>}
                              </div>
                              <div className="text-xs text-gray-400">{m.department} · {m.year}</div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{m.email}</div>
                              {m.phone && <div className="flex items-center gap-1 text-xs text-gray-400"><Phone className="h-3 w-3" />{m.phone}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Project */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Problem Statement & Abstract</div>
                      <div className="text-xs font-semibold text-blue-600 mb-1">{HACK_TRACKS.find(t => t.id === selectedTeam.trackId)?.label || "—"}</div>
                      <p className="text-sm text-gray-700">{selectedTeam.projectDescription || "Not provided."}</p>
                    </div>

                    {/* Links */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Links</div>
                      <div className="flex flex-col gap-2">
                        {selectedTeam.githubUrl && <a href={selectedTeam.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><Github className="h-4 w-4" /> Repository</a>}
                        {selectedTeam.videoUrl && <a href={selectedTeam.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><Video className="h-4 w-4" /> Demo Video</a>}
                        {selectedTeam.demoUrl && <a href={selectedTeam.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><Globe className="h-4 w-4" /> Live Demo</a>}
                        {!selectedTeam.githubUrl && !selectedTeam.videoUrl && !selectedTeam.demoUrl && <span className="text-sm text-gray-400">No links submitted yet.</span>}
                      </div>
                    </div>

                    {/* Previous Feedback */}
                    {(selectedTeam.evaluations || []).length > 0 && (
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Previous Feedback</div>
                        {selectedTeam.evaluations!.map((ev, i) => (
                          <div key={i} className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">{ev.feedback}</div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => { handleOpenEval(selectedTeam); setSelectedTeam(null); }}
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
