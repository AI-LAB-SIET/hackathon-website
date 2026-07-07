"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search, CheckCircle, Clock, X, ChevronRight,
  Github, Video, Globe, Star, Users, Mail, Phone,
  Eye, BookOpen, Upload, FileText, Trash2, Edit3, Archive, Download, Paperclip, Send
} from "lucide-react";
import { Team, FileAttachment, ProblemStatement } from "@/types";


type TabType = "dashboard" | "queue" | "leaderboard" | "problems" | "profile";

const SCORE_CRITERIA = [
  { key: "innovation" as const, label: "Innovation & Originality", max: 10 },
  { key: "feasibility" as const, label: "Feasibility & Impact", max: 10 },
  { key: "presentation" as const, label: "Presentation Quality", max: 10 },
  { key: "technicalDepth" as const, label: "Technical Depth", max: 10 },
  { key: "aiUsage" as const, label: "AI/ML Integration", max: 10 },
];

const PDFViewer = ({ dataUrl, title }: { dataUrl: string; title: string }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!dataUrl) return;
    try {
      const parts = dataUrl.split(',');
      if (parts.length !== 2) return;
      const contentTypeMatch = parts[0].match(/:(.*?);/);
      const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/pdf';
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error creating blob URL", e);
    }
  }, [dataUrl]);

  if (!blobUrl) {
    return (
      <div className="h-[400px] flex items-center justify-center text-gray-500 text-sm border border-gray-100 dark:border-gray-800 rounded-xl">
        Loading PDF...
      </div>
    );
  }

  return <iframe src={blobUrl} className="w-full h-[400px] border-0 rounded-xl bg-white" title={title} />;
};


export default function JudgeDashboard() {
  const router = useRouter();
  const { session, teams, notifications, problemStatements, evaluateProject, markNotificationRead, markAllNotificationsRead, addProblemStatement, updateProblemStatement, archiveProblemStatement, addAnnouncement, hackathons, activeHackathonId, setActiveHackathon } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Filters
  const [problemStatementFilter, setProblemStatementFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "reviewed">("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");

  // On-spot material form
  const [psForm, setPsForm] = useState({ title: "", description: "", status: "draft" as "draft" | "published" | "archived" });
  const [psEditId, setPsEditId] = useState<string | null>(null);
  const [psCreateOpen, setPsCreateOpen] = useState(false);
  const [expandedPs, setExpandedPs] = useState<string | null>(null);
  const [psAttachments, setPsAttachments] = useState<FileAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Team detail popup
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Evaluation modal
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalTeam, setEvalTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState({ innovation: 8, feasibility: 8, presentation: 8, technicalDepth: 7, aiUsage: 8 });
  const [feedback, setFeedback] = useState("");
  const [selectedFile, setSelectedFile] = useState<string>("abstract");

  // QR Scanner


  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "judge")) router.push("/login");
  }, [session, router, mounted]);

  const assignedTeams = useMemo(() => teams.filter((t) => t.status === "APPROVED"), [teams]);
  const reviewedTeams = useMemo(() => assignedTeams.filter((t) => t.evaluations?.some((e) => e.judgeEmail === session.email)), [assignedTeams, session.email]);
  const pendingTeams = useMemo(() => assignedTeams.filter((t) => !t.evaluations?.some((e) => e.judgeEmail === session.email)), [assignedTeams, session.email]);
  const avgScore = useMemo(() => {
    return reviewedTeams.length > 0
      ? Math.round(reviewedTeams.reduce((acc, t) => {
          const ev = t.evaluations?.find((e) => e.judgeEmail === session.email);
          return acc + (ev ? (ev.innovation + ev.feasibility + ev.presentation + (ev.technicalDepth ?? 0) + (ev.aiUsage ?? 0)) / 5 : 0);
        }, 0) / reviewedTeams.length * 10) / 10
      : 0;
  }, [reviewedTeams, session.email]);

  const leaderboardTeams = useMemo(() => {
    return [...teams]
      .filter((t) => t.status === "APPROVED")
      .map((t) => {
        const evals = t.evaluations || [];
        const score = evals.length > 0
          ? Math.round(evals.reduce((sum, ev) => {
              return sum + (ev.innovation + ev.feasibility + ev.presentation + (ev.technicalDepth ?? 0) + (ev.aiUsage ?? 0)) / 5;
            }, 0) / evals.length * 10) / 10
          : 0;
        return { ...t, avgScore: score };
      })
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [teams]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Apply filters to queue
  const departments = useMemo(() => Array.from(new Set(assignedTeams.flatMap((t) => t.members.map((m) => m.department)))), [assignedTeams]);
  const filteredQueue = useMemo(() => {
    return assignedTeams.filter((t) => {
      if (problemStatementFilter !== "all" && t.problemStatementId !== problemStatementFilter) return false;
      if (statusFilter === "pending" && t.evaluations?.some((e) => e.judgeEmail === session.email)) return false;
      if (statusFilter === "reviewed" && !t.evaluations?.some((e) => e.judgeEmail === session.email)) return false;
      if (deptFilter !== "all" && !t.members.some((m) => m.department === deptFilter)) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [assignedTeams, problemStatementFilter, statusFilter, deptFilter, search, session.email]);

  if (!mounted || !session.isLoggedIn || session.role !== "judge") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400 dark:text-gray-500">Loading judge portal...</div>;
  }

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
    setSelectedFile(team.attachments && team.attachments.length > 0 ? `file-${team.attachments[0].id}` : "links");
  };

  const handleSubmitEval = () => {
    if (!evalTeam) return;
    evaluateProject(evalTeam.id, { ...scores, feedback, judgeEmail: session.email! });
    toast(`Evaluation submitted for ${evalTeam.name}`, "success");
    setEvalModalOpen(false);
    setEvalTeam(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 10 * 1024 * 1024) {
      toast("File too large. Max 10MB allowed.", "error");
      e.target.value = "";
      return;
    }

    setUploadingFile(true);
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
      setUploadingFile(false);
      toast("Failed to read file.", "error");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
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

  const handleRemoveAttachment = (attachmentId: string) => {
    setPsAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    toast("Attachment removed.", "info");
  };

  const handleSaveProblemStatement = () => {
    if (!psForm.title || !psForm.description) {
      toast("Title and description are required.", "error");
      return;
    }

    const payload = {
      title: psForm.title,
      description: psForm.description,
      status: psForm.status,
      attachments: psAttachments,
    };

    if (psEditId) {
      updateProblemStatement(psEditId, payload);
      toast("Problem statement updated.", "success");
    } else {
      addProblemStatement(payload);
      addAnnouncement(
        `New Problem Statement: ${psForm.title}`, 
        `A new problem statement has been submitted by the judges.`,
        "info"
      );
      toast("Problem statement created.", "success");
    }

    setPsForm({ title: "", description: "", status: "draft" });
    setPsAttachments([]);
    setPsEditId(null);
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
    const ps = problemStatements.find(p => p.id === id);
    if (ps) {
        addAnnouncement(
            `Problem Statement Published: ${ps.title}`, 
            `A problem statement has been published by the judges.`,
            "info"
        );
    }
    toast("Published for participants.", "success");
  };

  const handleArchivePs = (id: string) => {
    archiveProblemStatement(id);
    const ps = problemStatements.find(p => p.id === id);
    if (ps) {
        addAnnouncement(
            `Problem Statement Removed: ${ps.title}`, 
            `A problem statement has been removed by the judges.`,
            "warning"
        );
    }
    toast("Problem statement archived.", "info");
  };

  return (
    <PageWrapper>
      <div className="flex min-h-screen bg-[#f8fafb] dark:bg-gray-950">
        <Sidebar activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabType)} />
        <main className="flex-1 min-w-0 p-6 lg:p-8 pt-20 md:pt-8">
          {/* Header Bar — utility actions only; navigation handled by Sidebar */}
          <div className="flex items-center justify-end gap-2 mb-8">
            <div className="flex items-center gap-2">
              {/* Hackathon Switcher */}
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:inline">
                  Active:
                </span>
                <select
                  value={activeHackathonId || ""}
                  onChange={(e) => setActiveHackathon(e.target.value || null)}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 font-bold focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                >
                  <option value="">No Active Hackathon</option>
                  {hackathons.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <ThemeToggle />
              {activeTab === "problems" && (
                <button
                  onClick={() => {
                    setPsEditId(null);
                    setPsForm({ title: "", description: "", status: "draft" });
                    setPsAttachments([]);
                    setPsCreateOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Upload className="h-4 w-4" /> Upload Material
                </button>
              )}

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
                <div className="bg-linear-to-br from-blue-800 to-indigo-700 rounded-2xl p-6 text-white">
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
                    <motion.div initial={{ width: 0 }} animate={{ width: `${assignedTeams.length > 0 ? (reviewedTeams.length / assignedTeams.length) * 100 : 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-2 rounded-full bg-linear-to-r from-blue-500 to-indigo-500" />
                  </div>
                </div>

                {/* Pending */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                  <div className="font-bold text-primary-dark dark:text-gray-100 text-sm mb-3">Pending Reviews</div>
                  <div className="flex flex-col gap-2">
                    {pendingTeams.slice(0, 3).map((t) => {
                      return (
                        <button key={t.id} onClick={() => openEvalModal(t)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer group text-left">
                          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {t.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-primary-dark dark:text-gray-100 flex items-center gap-2">
                              <span className="truncate">{t.name}</span>
                              {t.submitted ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" title="Project Submitted" />
                              ) : t.ideaSubmitted ? (
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" title="Idea Submitted" />
                              ) : null}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{problemStatements.find((ps) => ps.id === t.problemStatementId)?.title || "—"}</div>
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
                  <select value={problemStatementFilter} onChange={(e) => setProblemStatementFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                    <option value="all">All Problem Statements</option>
                    {problemStatements.map((ps) => <option key={ps.id} value={ps.id}>{ps.title}</option>)}
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
                    const reviewed = team.evaluations?.some((e) => e.judgeEmail === session.email);
                    const myEval = team.evaluations?.find((e) => e.judgeEmail === session.email);
                    const teamAvgScore = myEval ? Math.round((myEval.innovation + myEval.feasibility + myEval.presentation + (myEval.technicalDepth ?? 0) + (myEval.aiUsage ?? 0)) / 5 * 10) / 10 : null;
                    return (
                      <div key={team.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow dark:bg-gray-900 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-primary-dark dark:text-gray-100">{team.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{problemStatements.find(ps => ps.id === team.problemStatementId)?.title || "—"} · {team.members.length} members</div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${reviewed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                            {reviewed ? "Reviewed" : "Pending"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">{team.projectDescription || "No description provided."}</p>

                        {/* Submissions Indicator */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center">Submissions:</span>
                          {team.ideaSubmitted ? (
                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-sm">Idea</span>
                          ) : null}
                          {team.submitted ? (
                            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-sm">Project</span>
                          ) : null}
                          {team.attachments && team.attachments.length > 0 ? (
                            <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 text-[10px] font-bold px-2 py-0.5 rounded-sm">{team.attachments.length} Attachments</span>
                          ) : null}
                          {(!team.ideaSubmitted && !team.submitted && (!team.attachments || team.attachments.length === 0)) && (
                            <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold px-2 py-0.5">None yet</span>
                          )}
                        </div>

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

            {/* ─── LEADERBOARD ─── */}
            {activeTab === "leaderboard" && (
              <motion.div key="leaderboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Live Leaderboard</h2>
                  <span className="text-xs text-gray-400 font-semibold dark:text-gray-500">Read-Only View</span>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Rank</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Team</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Problem Statement</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Average Score</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Reviews</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardTeams.map((team, index) => {
                        const evals = team.evaluations || [];
                        return (
                          <tr key={team.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${
                                index === 0 ? "bg-amber-100 text-amber-700" :
                                index === 1 ? "bg-gray-100 text-gray-600" :
                                index === 2 ? "bg-orange-100 text-orange-700" :
                                "text-gray-500 dark:text-gray-400"
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-5 py-3 font-semibold text-primary-dark dark:text-gray-100">
                              {team.name}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                              {problemStatements.find((ps) => ps.id === team.problemStatementId)?.title || "—"}
                            </td>
                            <td className="px-5 py-3 font-extrabold text-blue-600 dark:text-blue-400">
                              {team.avgScore > 0 ? `${team.avgScore} / 10` : "Not evaluated"}
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500">
                              {evals.length} review{evals.length !== 1 ? "s" : ""}
                            </td>
                          </tr>
                        );
                      })}
                      {leaderboardTeams.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                            No approved teams found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ─── PROBLEMS ─── */}
            {activeTab === "problems" && (
              <motion.div key="problems" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Problem Statements</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload and manage problem statements for participants.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPsEditId(null);
                      setPsForm({ title: "", description: "", status: "draft" });
                      setPsAttachments([]);
                      setPsCreateOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" /> Add Problem Statement
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {problemStatements.map((ps) => {
                    const isExpanded = expandedPs === ps.id;
                    return (
                      <div key={ps.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPs(isExpanded ? null : ps.id)}
                          className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-extrabold text-primary-dark dark:text-gray-100 text-sm">{ps.title}</h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  ps.status === "published" ? "bg-emerald-100 text-emerald-700" :
                                  ps.status === "archived" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
                                }`}>
                                  {ps.status.toUpperCase()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {ps.attachments?.length || 0} files - Created {new Date(ps.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className={`h-4 w-4 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{ps.description}</p>

                            {ps.attachments && ps.attachments.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                  <Paperclip className="h-3.5 w-3.5" /> Attachments
                                </div>
                                {ps.attachments.map((att) => (
                                  <div key={att.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="h-9 w-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{att.name}</div>
                                        <div className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(att.size)}</div>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => downloadAttachment(att)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 cursor-pointer shrink-0"
                                    >
                                      <Download className="h-3.5 w-3.5" /> Download
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => handleEditPs(ps)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                                <Edit3 className="h-3.5 w-3.5" /> Edit
                              </button>
                              {ps.status !== "published" && (
                                <button onClick={() => handlePublishPs(ps.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold hover:bg-emerald-200 cursor-pointer">
                                  <Send className="h-3.5 w-3.5" /> Publish
                                </button>
                              )}
                              {ps.status !== "archived" && (
                                <button onClick={() => handleArchivePs(ps.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 cursor-pointer">
                                  <Archive className="h-3.5 w-3.5" /> Archive
                                </button>
                              )}
                              {ps.status === "archived" && (
                                <button onClick={() => {
                                  if (confirm("Are you sure you want to permanently delete this problem statement?")) {
                                    // You can use a delete function here, but currently only archive is provided by state provider.
                                    toast("To fully delete, an admin needs to remove it from the database.", "info");
                                  }
                                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 cursor-pointer">
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {problemStatements.length === 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
                      <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">No problem statements uploaded yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── PROFILE ─── */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Profile & Settings</h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
                        {(session.name || "J").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-primary-dark dark:text-gray-100 text-lg">{session.name || "Judge"}</div>
                        <div className="text-gray-400 dark:text-gray-500 text-sm">{session.email}</div>
                        <div className="text-xs font-semibold text-blue-600 mt-0.5">Judge · AI Hackathon 2026</div>
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
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800 text-gray-550 dark:text-gray-400 cursor-not-allowed" />
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Scanner Modal */}
          

          {/* ─── EVALUATION MODAL ─── */}
          <Modal isOpen={evalModalOpen} onClose={() => setEvalModalOpen(false)} title="Evaluate Team" maxWidth="max-w-6xl">
            {evalTeam && (
              <div className="flex flex-col lg:flex-row gap-6 max-h-[75vh] overflow-hidden">
                {/* LEFT COLUMN: Interactive File Viewer & Submission Material */}
                <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden min-h-[450px]">
                  {/* File Tabs */}
                  <div className="flex bg-gray-100 dark:bg-gray-850 p-2 gap-1 border-b border-gray-150 dark:border-gray-800 flex-wrap">
                    {(() => {
                      const fileTabs = (evalTeam.attachments || []).map(a => {
                        let icon = "📄";
                        if (a.type.startsWith("image/")) icon = "🖼️";
                        else if (a.name.endsWith(".pdf")) icon = "📑";
                        else if (a.name.endsWith(".md") || a.name.endsWith(".txt")) icon = "📝";
                        else if (a.name.endsWith(".py") || a.name.endsWith(".js") || a.name.endsWith(".tsx")) icon = "💻";
                        
                        return { id: `file-${a.id}`, name: a.name, icon, type: "file", attachment: a };
                      });
                      
                      const allTabs = [
                        ...fileTabs,
                        { id: "links", name: "Project Links", icon: "🔗", type: "metadata" },
                        { id: "aidisclosure", name: "AI Disclosure", icon: "🤖", type: "metadata" },
                      ];

                      return allTabs.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFile(f.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            selectedFile === f.id
                              ? "bg-white dark:bg-gray-700 text-blue-605 dark:text-blue-400 shadow-sm"
                              : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                          }`}
                        >
                          <span>{f.icon}</span>
                          <span className="max-w-[150px] truncate">{f.name}</span>
                        </button>
                      ));
                    })()}
                  </div>

                  {/* Viewer Workspace Area */}
                  <div className="flex-1 p-5 overflow-y-auto max-h-[58vh] bg-white dark:bg-gray-950">
                     {(() => {
                      if (selectedFile.startsWith("file-")) {
                        const fileId = selectedFile.replace("file-", "");
                        const attachment = evalTeam.attachments?.find(a => a.id === fileId);
                        
                        if (!attachment) {
                           return <div className="p-4 text-center text-gray-500">File not found.</div>;
                        }
                        
                        const isImage = attachment.type.startsWith("image/");
                        const isPdf = attachment.name.endsWith(".pdf");
                        
                        return (
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{attachment.name}</h4>
                              <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase">
                                {isImage ? "Image Preview" : isPdf ? "PDF Preview" : "File Viewer"}
                              </span>
                            </div>
                            
                            {isImage ? (
                              <img
                                src={attachment.dataUrl}
                                className="max-h-[400px] mx-auto object-contain rounded-xl border border-gray-200 dark:border-gray-850"
                                alt={attachment.name}
                              />
                            ) : isPdf ? (
                              <PDFViewer dataUrl={attachment.dataUrl} title={attachment.name} />
                            ) : (
                              <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-gray-50/50 dark:bg-gray-900 flex flex-col items-center justify-center text-center space-y-4 shadow-inner min-h-[300px]">
                                <FileText className="h-12 w-12 text-gray-400" />
                                <div>
                                  <div className="font-extrabold text-base text-primary-dark dark:text-gray-100">{attachment.name}</div>
                                  <div className="text-xs text-gray-500 mt-1">{(attachment.size / 1024).toFixed(2)} KB</div>
                                </div>
                                <a
                                  href={attachment.dataUrl}
                                  download={attachment.name}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4" /> Download File
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {selectedFile === "links" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Project Workspace URLs</h4>
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">Resource Links</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {[
                            { label: "GitHub Code Repository", url: evalTeam.githubUrl, icon: <Github className="h-4 w-4 text-gray-700 dark:text-gray-300" />, placeholder: "No GitHub link submitted" },
                            { label: "Interactive Demo Workspace", url: evalTeam.demoUrl, icon: <Globe className="h-4 w-4 text-blue-500" />, placeholder: "No Live Demo link submitted" },
                            { label: "Pitch Video Presentation", url: evalTeam.videoUrl, icon: <Video className="h-4 w-4 text-red-500" />, placeholder: "No Video link submitted" },
                          ].map((l, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-705">
                                  {l.icon}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-gray-850 dark:text-gray-200">{l.label}</h5>
                                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5 max-w-[280px]">
                                    {l.url || l.placeholder}
                                  </p>
                                </div>
                              </div>
                              {l.url ? (
                                <a
                                  href={l.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Open Link
                                </a>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-bold bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg">Pending</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedFile === "aidisclosure" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                          <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">AI Coding Help Disclosure</h4>
                          <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase">AI Declaration</span>
                        </div>
                        <div className="border border-purple-100 dark:border-purple-900/30 rounded-xl p-5 bg-purple-50/5 dark:bg-purple-950/5 space-y-3">
                          <h5 className="text-xs font-bold text-purple-800 dark:text-purple-400 flex items-center gap-1.5">
                            <span>🤖</span> Declarations & Copilot Telemetry
                          </h5>
                          <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed font-semibold">
                            {evalTeam.aiDisclosure || "No artificial intelligence tools or code generation models were declared in the submission. The team registers that all code lines were fully authored by the team members during the official hacking timeline."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>


                {/* RIGHT COLUMN: Scoring panel & Details */}
                <div className="w-full lg:w-[380px] flex flex-col justify-between overflow-y-auto max-h-[70vh] pr-2 shrink-0">
                  <div className="space-y-5">
                    {/* Team Info */}
                    <div className="pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded w-fit mb-1">Evaluating Team</div>
                      <div className="font-extrabold text-primary-dark text-base dark:text-gray-100">{evalTeam.name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{problemStatements.find(ps => ps.id === evalTeam.problemStatementId)?.title || "General Track"}</div>
                    </div>

                    {/* Members */}
                    <div>
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> Team Members ({evalTeam.members.length})
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {evalTeam.members.map((m) => (
                          <div key={m.email} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-150/50 dark:border-gray-800">
                            <div className="h-6 w-6 rounded-full bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                              {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-medium truncate">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Score Sliders */}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Scoring Rubric</div>
                      {SCORE_CRITERIA.map(({ key, label, max }) => (
                        <div key={key} className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-gray-750 dark:text-gray-300">{label}</label>
                            <span className="text-xs font-extrabold text-blue-605">{scores[key]}/{max}</span>
                          </div>
                          <input type="range" min={1} max={max} value={scores[key]}
                            onChange={(e) => setScores((p) => ({ ...p, [key]: parseInt(e.target.value) }))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Written Feedback */}
                    <div>
                      <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-1.5">Written Feedback</label>
                      <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Provide detailed constructive feedback for the team..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800 mt-2 bg-white dark:bg-gray-950 sticky bottom-0 z-10 py-2">
                    <button onClick={() => setEvalModalOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                      Cancel
                    </button>
                    <button onClick={handleSubmitEval}
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-blue-500/10">
                      Submit Score
                    </button>
                  </div>
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
                  <div className="bg-linear-to-r from-blue-700 to-indigo-600 px-5 py-4 flex items-center justify-between sticky top-0 z-10">
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
                            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
                      <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{problemStatements.find(ps => ps.id === selectedTeam.problemStatementId)?.title || "—"}</div>
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

          {/* ─── PROBLEM STATEMENT MODAL ─── */}
          <Modal
            isOpen={psCreateOpen}
            onClose={() => {
              setPsCreateOpen(false);
              setPsEditId(null);
              setPsAttachments([]);
            }}
            title={psEditId ? "Edit Problem Statement" : "Add Problem Statement"}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={psForm.title}
                  onChange={(e) => setPsForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Problem statement title"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Description *</label>
                <textarea
                  rows={5}
                  value={psForm.description}
                  onChange={(e) => setPsForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the problem statement..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Status</label>
                  <select
                    value={psForm.status}
                    onChange={(e) => setPsForm((p) => ({ ...p, status: e.target.value as typeof psForm.status }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Attachments</label>
                <label className={`flex flex-col items-center justify-center w-full px-4 py-5 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
                  uploadingFile
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
                }`}>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  {uploadingFile ? (
                    <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      Uploading...
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-gray-400 dark:text-gray-500 mb-2" />
                      <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload file</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">PDF, DOC, ZIP up to 10MB</div>
                    </>
                  )}
                </label>

                {psAttachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {psAttachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{att.name}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">({formatFileSize(att.size)})</span>
                        </div>
                        <button onClick={() => handleRemoveAttachment(att.id)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setPsCreateOpen(false); setPsEditId(null); setPsAttachments([]); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProblemStatement}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 cursor-pointer"
                >
                  {psEditId ? "Save Changes" : "Create Material"}
                </button>
              </div>
            </div>
          </Modal>
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
