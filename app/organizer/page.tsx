"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { QRScanner } from "@/components/ui/QRScanner";
import { AttendancePanel } from "@/components/ui/AttendancePanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ClipboardCheck, FolderOpen, Bell, BarChart3, User,
  CheckCircle, Clock, XCircle, AlertTriangle, Search, QrCode,
  Mail, Phone, ChevronRight, TrendingUp, Activity, Ticket, X
} from "lucide-react";
import { Team, Notification } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

type TabType = "dashboard" | "teams" | "approval" | "projects" | "notifications" | "reports" | "profile";
type ApprovalFilter = "all" | "pending" | "approved" | "rejected";

export default function OrganizerDashboard() {
  const router = useRouter();
  const { session, teams, notifications, approveTeam, rejectTeam, addAnnouncement, markNotificationRead, markAllNotificationsRead } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Filters
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  // QR + Attendance
  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceTeam, setAttendanceTeam] = useState<Team | null>(null);

  // Announcement form
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "info" as "info" | "warning" | "success" });

  // Notification filter
  const [notifFilter, setNotifFilter] = useState<"all" | Notification["type"]>("all");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "organizer")) router.push("/login");
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "organizer") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading organizer portal...</div>;
  }

  const totalTeams = teams.length;
  const approvedTeams = teams.filter((t) => t.status === "APPROVED");
  const pendingTeams = teams.filter((t) => t.status === "PENDING");
  const rejectedTeams = teams.filter((t) => t.status === "REJECTED");
  const submittedProjects = teams.filter((t) => t.submitted);
  const checkedIn = teams.filter((t) => t.attendance?.checkedIn);
  const openTickets = teams.flatMap((t) => t.supportTickets || []).filter((tk) => tk.status === "Open");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const departments = Array.from(new Set(teams.flatMap((t) => t.members.map((m) => m.department))));

  // Approval queue filtered
  const filteredApproval = teams.filter((t) => {
    if (approvalFilter !== "all" && t.status !== approvalFilter.toUpperCase()) return false;
    if (trackFilter !== "all" && t.trackId !== trackFilter) return false;
    if (deptFilter !== "all" && !t.members.some((m) => m.department === deptFilter)) return false;
    if (sizeFilter === "2" && t.size !== 2) return false;
    if (sizeFilter === "3" && t.size !== 3) return false;
    if (sizeFilter === "4" && t.size !== 4) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleApprove = (teamId: string, teamName: string) => {
    approveTeam(teamId);
    toast(`${teamName} approved.`, "success");
  };

  const handleReject = (teamId: string, teamName: string) => {
    rejectTeam(teamId);
    toast(`${teamName} rejected.`, "error");
  };

  const handleSendAnnouncement = () => {
    if (!annForm.title || !annForm.content) return;
    addAnnouncement(annForm.title, annForm.content, annForm.type);
    setAnnForm({ title: "", content: "", type: "info" });
    toast("Announcement sent to all participants.", "success");
  };

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
    { id: "teams" as TabType, label: "Teams", icon: <Users className="h-4 w-4" /> },
    { id: "approval" as TabType, label: "Approval Queue", icon: <ClipboardCheck className="h-4 w-4" />, badge: pendingTeams.length > 0 ? pendingTeams.length : undefined },
    { id: "projects" as TabType, label: "Projects", icon: <FolderOpen className="h-4 w-4" /> },
    { id: "notifications" as TabType, label: "Notifications", icon: <Bell className="h-4 w-4" />, badge: unreadCount > 0 ? unreadCount : undefined },
    { id: "reports" as TabType, label: "Reports", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "profile" as TabType, label: "Profile", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <PageWrapper>
      <div className="flex min-h-screen bg-[#f8fafb]">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8">
          {/* Tab bar */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeTab === tab.id ? "bg-amber-500 text-white shadow-md" : "bg-white border border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-600"}`}
              >
                {tab.icon}{tab.label}
                {tab.badge && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">{tab.badge}</span>}
              </button>
            ))}
            <button onClick={() => setScannerOpen(true)}
              className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
            ><QrCode className="h-4 w-4" /> Scan QR</button>
          </div>

          <AnimatePresence mode="wait">
            {/* ─── DASHBOARD ─── */}
            {activeTab === "dashboard" && (
              <motion.div key="dash" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-gradient-to-br from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
                  <div className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-1">Organizer Control</div>
                  <h1 className="text-2xl font-extrabold mb-1">Welcome, {session.name || "Organizer"}</h1>
                  <p className="text-amber-100 text-sm">{pendingTeams.length} teams awaiting approval · {openTickets.length} open support tickets</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Teams Registered", value: totalTeams, icon: <Users className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
                    { label: "Approved Teams", value: approvedTeams.length, icon: <CheckCircle className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
                    { label: "Pending Approval", value: pendingTeams.length, icon: <Clock className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
                    { label: "Projects Submitted", value: submittedProjects.length, icon: <FolderOpen className="h-5 w-5 text-purple-500" />, bg: "bg-purple-50" },
                    { label: "Checked In", value: checkedIn.length, icon: <Activity className="h-5 w-5 text-teal-500" />, bg: "bg-teal-50" },
                    { label: "Judges Active", value: 1, icon: <TrendingUp className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
                    { label: "Mentors Active", value: 1, icon: <User className="h-5 w-5 text-rose-500" />, bg: "bg-rose-50" },
                    { label: "Open Tickets", value: openTickets.length, icon: <Ticket className="h-5 w-5 text-orange-500" />, bg: "bg-orange-50" },
                  ].map((k) => (
                    <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
                      <div className={`p-2 rounded-xl w-fit ${k.bg}`}>{k.icon}</div>
                      <div className="text-2xl font-extrabold text-primary-dark">{k.value}</div>
                      <div className="text-xs text-gray-400 font-semibold">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Broadcast Announcement */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="font-bold text-primary-dark text-sm">Broadcast Announcement</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Title..." className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
                    <input type="text" value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))}
                      placeholder="Message..." className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
                    <select value={annForm.type} onChange={(e) => setAnnForm((p) => ({ ...p, type: e.target.value as typeof annForm.type }))}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer">
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                  <button onClick={handleSendAnnouncement} className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 cursor-pointer">Send to All</button>
                </div>
              </motion.div>
            )}

            {/* ─── TEAMS ─── */}
            {activeTab === "teams" && (
              <motion.div key="teams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">All Teams</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Team</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Track</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Size</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Attendance</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase())).map((t) => {
                        const track = HACK_TRACKS.find((tr) => tr.id === t.trackId);
                        return (
                          <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-semibold text-primary-dark">{t.name}</div>
                              <div className="text-xs text-gray-400 font-mono">{t.qrToken?.split("-").slice(0, 3).join("-")}</div>
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-500">{track?.label || "—"}</td>
                            <td className="px-5 py-3 text-gray-600">{t.size}</td>
                            <td className="px-5 py-3">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : t.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{t.status}</span>
                            </td>
                            <td className="px-5 py-3">
                              {t.attendance?.checkedIn
                                ? <span className="text-xs font-semibold text-emerald-600">✓ {t.attendance.checkInTime}</span>
                                : <span className="text-xs text-gray-400">—</span>}
                            </td>
                            <td className="px-5 py-3">
                              <button onClick={() => setAttendanceTeam(t)} className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer flex items-center gap-1">
                                <QrCode className="h-3 w-3" /> Manage
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── APPROVAL QUEUE ─── */}
            {activeTab === "approval" && (
              <motion.div key="approval" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Approval Queue</h2>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                      <button key={f} onClick={() => setApprovalFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-colors ${approvalFilter === f ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-amber-100"}`}
                      >
                        {f} {f === "pending" ? `(${pendingTeams.length})` : f === "approved" ? `(${approvedTeams.length})` : f === "rejected" ? `(${rejectedTeams.length})` : `(${totalTeams})`}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 ml-auto">
                    <select value={trackFilter} onChange={(e) => setTrackFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer focus:outline-none">
                      <option value="all">All Tracks</option>
                      {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                    </select>
                    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer focus:outline-none">
                      <option value="all">All Departments</option>
                      {departments.map((d) => <option key={d} value={d}>{d.split("&")[0].trim()}</option>)}
                    </select>
                    <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer focus:outline-none">
                      <option value="all">Any Size</option>
                      <option value="2">2 Members</option>
                      <option value="3">3 Members</option>
                      <option value="4">4 Members</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {filteredApproval.map((team) => {
                    const track = HACK_TRACKS.find((tr) => tr.id === team.trackId);
                    const leader = team.members.find((m) => m.isLeader) || team.members[0];
                    const regChecklist = [
                      { label: "Team Created", done: true },
                      { label: "Members", done: team.size >= 2 },
                      { label: "Payment", done: !!team.paymentVerified },
                      { label: "Faculty Approval", done: !!team.facultyApproved },
                    ];
                    const regPct = Math.round((regChecklist.filter((c) => c.done).length / regChecklist.length) * 100);
                    return (
                      <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                            {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-primary-dark">{team.name}</div>
                            <div className="text-xs text-gray-400">{track?.label || "—"} · {team.size} members · Leader: {leader?.name}</div>
                            <div className="text-xs text-gray-500 mt-1 line-clamp-1">{team.projectDescription}</div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${team.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : team.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {team.status}
                          </span>
                        </div>

                        {/* Registration checklist */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${regPct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 shrink-0">{regPct}%</span>
                          <div className="flex gap-2">
                            {regChecklist.map((item) => (
                              <div key={item.label} title={item.label}>
                                {item.done ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-gray-300" />}
                              </div>
                            ))}
                          </div>
                        </div>

                        {team.status === "PENDING" && (
                          <div className="flex gap-2 mt-4">
                            <button onClick={() => handleApprove(team.id, team.name)}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 cursor-pointer flex items-center justify-center gap-1">
                              <CheckCircle className="h-4 w-4" /> Approve
                            </button>
                            <button onClick={() => handleReject(team.id, team.name)}
                              className="flex-1 py-2 rounded-xl bg-red-100 text-red-600 font-bold text-xs hover:bg-red-200 cursor-pointer flex items-center justify-center gap-1 border border-red-200">
                              <XCircle className="h-4 w-4" /> Reject
                            </button>
                            <button onClick={() => setAttendanceTeam(team)}
                              className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs hover:border-amber-300 hover:text-amber-600 cursor-pointer">
                              <QrCode className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredApproval.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">No teams match your filters.</div>}
                </div>
              </motion.div>
            )}

            {/* ─── PROJECTS ─── */}
            {activeTab === "projects" && (
              <motion.div key="proj" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Project Submissions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.filter((t) => t.status === "APPROVED").map((team) => {
                    const track = HACK_TRACKS.find((tr) => tr.id === team.trackId);
                    const milestonesDone = (team.milestonesProgress || []).filter((m) => m.completed).length;
                    const milestonesTotal = (team.milestonesProgress || []).length;
                    return (
                      <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-primary-dark">{team.name}</div>
                            <div className="text-xs text-gray-400">{track?.label || "—"}</div>
                          </div>
                          {team.submitted && <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">Submitted</span>}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{team.projectDescription}</p>
                        <div>
                          <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Milestones</span><span>{milestonesDone}/{milestonesTotal}</span></div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-amber-400" style={{ width: `${milestonesTotal > 0 ? (milestonesDone / milestonesTotal) * 100 : 0}%` }} />
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          {team.githubUrl && <a href={team.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">GitHub</a>}
                          {team.demoUrl && <a href={team.demoUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Live Demo</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── NOTIFICATIONS ─── */}
            {activeTab === "notifications" && (
              <motion.div key="notifs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-primary-dark text-xl">Notifications</h2>
                  {unreadCount > 0 && <button onClick={markAllNotificationsRead} className="text-sm font-semibold text-amber-600 hover:underline cursor-pointer">Mark all read</button>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "approval", "deadline", "action", "system"] as const).map((f) => (
                    <button key={f} onClick={() => setNotifFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-colors ${notifFilter === f ? "bg-amber-500 text-white" : "bg-white border border-gray-200 text-gray-600"}`}
                    >{notifTypeStyles[f]?.label || "All"}</button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {(notifFilter === "all" ? notifications : notifications.filter((n) => n.type === notifFilter)).map((n) => (
                    <div key={n.id} onClick={() => markNotificationRead(n.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${!n.read ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100"}`}>
                      <div className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${notifTypeStyles[n.type]?.dot || "bg-gray-400"}`} />
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${!n.read ? "text-primary-dark" : "text-gray-500"}`}>{n.title}</div>
                        <div className="text-xs text-gray-400">{n.body}</div>
                      </div>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── REPORTS ─── */}
            {activeTab === "reports" && (
              <motion.div key="reports" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Reports & Analytics</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Approval Rate", value: `${totalTeams > 0 ? Math.round((approvedTeams.length / totalTeams) * 100) : 0}%`, color: "text-emerald-600" },
                    { label: "Submission Rate", value: `${approvedTeams.length > 0 ? Math.round((submittedProjects.length / approvedTeams.length) * 100) : 0}%`, color: "text-blue-600" },
                    { label: "Check-In Rate", value: `${approvedTeams.length > 0 ? Math.round((checkedIn.length / approvedTeams.length) * 100) : 0}%`, color: "text-purple-600" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                      <div className={`text-4xl font-extrabold ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-gray-400 mt-2 font-semibold">{s.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                  <div className="text-gray-400 text-sm mb-4">Export team data and evaluation reports</div>
                  <button className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 cursor-pointer">Export CSV (Mock)</button>
                </div>
              </motion.div>
            )}

            {/* ─── PROFILE ─── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl">Profile & Settings</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-extrabold">
                      {(session.name || "O").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-primary-dark text-lg">{session.name || "Organizer"}</div>
                      <div className="text-gray-400 text-sm">{session.email}</div>
                      <div className="text-xs font-semibold text-amber-600 mt-0.5">Organizer · SIET AI Hack Lab 2026</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Scanner */}
          <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSelectTeam={(team) => setAttendanceTeam(team)} />

          {/* Attendance Panel */}
          {attendanceTeam && (
            <AttendancePanel
              team={attendanceTeam}
              open={!!attendanceTeam}
              onClose={() => setAttendanceTeam(null)}
              scannerName={session.name || session.email || "Organizer"}
            />
          )}
        </main>
      </div>
    </PageWrapper>
  );
}
