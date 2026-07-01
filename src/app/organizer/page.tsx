"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { AttendancePanel } from "@/components/ui/AttendancePanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, ClipboardCheck, Bell,
  CheckCircle, Clock, XCircle, Search,
  Mail, Phone, ChevronRight, Activity, Ticket,
  Download, UserPlus, Trash2, UserCheck,
  Github, Video, Globe, BookOpen, Upload, FileText, Paperclip,
  Archive, Send, Edit3, X, QrCode, Info
} from "lucide-react";
import { FileAttachment, ProblemStatement, Team, Volunteer, SupportTicket, FoodToken } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

type TabType = "dashboard" | "scanner" | "teams" | "approval" | "problems" | "volunteers" | "tickets" | "profile";
type ApprovalFilter = "all" | "pending" | "approved" | "rejected";
type TicketFilter = "all" | "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed";

export default function OrganizerDashboard() {
  const router = useRouter();
  const {
    session, teams, notifications, volunteers, tickets, problemStatements,
    approveTeam, rejectTeam, addAnnouncement, markNotificationRead, markAllNotificationsRead,
    addVolunteer, updateVolunteer, removeVolunteer, assignTicket, updateTicketStatus,
    addProblemStatement, updateProblemStatement, archiveProblemStatement,
    foodMeals, foodTokens, redeemToken, lookupToken, activeHackathonId
  } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  // Food token lookup states
  const [lookupQuery, setLookupQuery] = useState("");
  const [scannedToken, setScannedToken] = useState<FoodToken | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);

  // Filters
  const [approvalFilter, setApprovalFilter] = useState<ApprovalFilter>("all");
  const [trackFilter, setTrackFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");

  // Attendance
  const [attendanceTeam, setAttendanceTeam] = useState<Team | null>(null);

  // Announcement form
  const [annForm, setAnnForm] = useState({ title: "", content: "", type: "info" as "info" | "warning" | "success" });

  // On-spot material form
  const [psForm, setPsForm] = useState({ title: "", description: "", trackId: "gen-ai", status: "draft" as "draft" | "published" | "archived" });
  const [psEditId, setPsEditId] = useState<string | null>(null);
  const [psCreateOpen, setPsCreateOpen] = useState(false);
  const [expandedPs, setExpandedPs] = useState<string | null>(null);
  const [psAttachments, setPsAttachments] = useState<FileAttachment[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Team detail modal
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);

  // Volunteer modal
  const [volModalOpen, setVolModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [volForm, setVolForm] = useState({ name: "", phone: "", email: "", assignedArea: "", assignedResponsibilities: "" });

  // Ticket assignment modal
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [assignVolEmail, setAssignVolEmail] = useState("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && (!session.isLoggedIn || session.role !== "organizer")) router.push("/login");
  }, [session, router, mounted]);

  const totalTeams = teams.length;
  const approvedTeams = teams.filter((t) => t.status === "APPROVED");
  const pendingTeams = teams.filter((t) => t.status === "PENDING");
  const rejectedTeams = teams.filter((t) => t.status === "REJECTED");
  const submittedProjects = teams.filter((t) => t.submitted);
  const checkedIn = teams.filter((t) => t.attendance?.checkedIn);
  const openTickets = teams.flatMap((t) => t.supportTickets || []).filter((tk) => tk.status === "Open");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const departments = useMemo(() => Array.from(new Set(teams.flatMap((t) => t.members.map((m) => m.department)))), [teams]);

  // Approval queue filtered
  const filteredApproval = useMemo(() => {
    return teams.filter((t) => {
      if (approvalFilter !== "all" && t.status !== approvalFilter.toUpperCase()) return false;
      if (trackFilter !== "all" && t.trackId !== trackFilter) return false;
      if (deptFilter !== "all" && !t.members.some((m) => m.department === deptFilter)) return false;
      if (sizeFilter === "2" && t.size !== 2) return false;
      if (sizeFilter === "3" && t.size !== 3) return false;
      if (sizeFilter === "4" && t.size !== 4) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [teams, approvalFilter, trackFilter, deptFilter, sizeFilter, search]);

  // All tickets aggregated
  const allTickets = useMemo(() => {
    return tickets.length > 0
      ? tickets
      : teams.flatMap((t) => (t.supportTickets || []).map((tk) => ({ ...tk, teamName: t.name })));
  }, [tickets, teams]);

  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => ticketFilter === "all" || t.status === ticketFilter);
  }, [allTickets, ticketFilter]);

  if (!mounted || !session.isLoggedIn || session.role !== "organizer") {
    return <div className="flex h-screen items-center justify-center text-sm text-gray-400 dark:text-gray-500">Loading organizer portal...</div>;
  }

  const handleApprove = (teamId: string, teamName: string) => {
    approveTeam(teamId);
    toast(`${teamName} approved.`, "success");
    setSelectedTeam(null);
  };

  const handleReject = (teamId: string, teamName: string) => {
    rejectTeam(teamId);
    toast(`${teamName} rejected.`, "error");
    setSelectedTeam(null);
    setRejectReason("");
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setLookupError("");
    setScannedToken(null);
    try {
      const token = await lookupToken(lookupQuery.trim());
      if (token) {
        setScannedToken(token);
      } else {
        setLookupError("No valid token found for this code or registration number.");
      }
    } catch (err: unknown) {
      setLookupError("Failed to lookup token.");
    }
  };

  const handleRedeem = async () => {
    if (!scannedToken) return;
    if (scannedToken.status !== "issued") {
      toast("This token has already been redeemed or is invalid.", "error");
      return;
    }
    setRedeeming(true);
    try {
      await redeemToken(scannedToken.id);
      toast("Food token redeemed successfully!", "success");
      setScannedToken({ ...scannedToken, status: "redeemed" });
    } catch (err: unknown) {
      toast("Failed to redeem token.", "error");
    } finally {
      setRedeeming(false);
    }
  };

  const handleSendAnnouncement = () => {
    if (!annForm.title || !annForm.content) return;
    addAnnouncement(annForm.title, annForm.content, annForm.type);
    setAnnForm({ title: "", content: "", type: "info" });
    toast("Announcement sent to all participants.", "success");
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
      trackId: psForm.trackId,
      status: psForm.status,
      attachments: psAttachments,
    };

    if (psEditId) {
      updateProblemStatement(psEditId, payload);
      toast("On-spot material updated.", "success");
    } else {
      addProblemStatement(payload);
      toast("On-spot material created.", "success");
    }

    setPsForm({ title: "", description: "", trackId: "gen-ai", status: "draft" });
    setPsAttachments([]);
    setPsEditId(null);
    setPsCreateOpen(false);
  };

  const handleEditPs = (ps: ProblemStatement) => {
    setPsEditId(ps.id);
    setPsForm({ title: ps.title, description: ps.description, trackId: ps.trackId, status: ps.status });
    setPsAttachments(ps.attachments || []);
    setPsCreateOpen(true);
  };

  const handlePublishPs = (id: string) => {
    updateProblemStatement(id, { status: "published" });
    toast("Published for participants.", "success");
  };

  const handleArchivePs = (id: string) => {
    archiveProblemStatement(id);
    toast("Material archived.", "info");
  };

  const handleExportCSV = () => {
    const headers = ["Team Name", "Status", "Members", "Track", "Attendance", "Checked In"];
    const rows = teams.map((t) => {
      const track = HACK_TRACKS.find((tr) => tr.id === t.trackId);
      return [
        t.name,
        t.status,
        t.size.toString(),
        track?.label || "—",
        t.attendance?.checkedIn ? "Yes" : "No",
        t.attendance?.checkInTime || "—",
      ];
    });
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teams_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported successfully.", "success");
  };

  const openVolunteerModal = (vol?: Volunteer) => {
    if (vol) {
      setEditingVolunteer(vol);
      setVolForm({ name: vol.name, phone: vol.phone ?? "", email: vol.email, assignedArea: vol.assignedArea ?? "", assignedResponsibilities: vol.assignedResponsibilities ?? "" });
    } else {
      setEditingVolunteer(null);
      setVolForm({ name: "", phone: "", email: "", assignedArea: "", assignedResponsibilities: "" });
    }
    setVolModalOpen(true);
  };

  const handleSaveVolunteer = () => {
    if (!volForm.name || !volForm.email) { toast("Name and email are required.", "error"); return; }
    if (editingVolunteer) {
      updateVolunteer(editingVolunteer.id, volForm);
      toast("Volunteer updated.", "success");
    } else {
      addVolunteer(volForm);
      toast("Volunteer added.", "success");
    }
    setVolModalOpen(false);
    setEditingVolunteer(null);
    setVolForm({ name: "", phone: "", email: "", assignedArea: "", assignedResponsibilities: "" });
  };

  const handleRemoveVolunteer = (id: string) => {
    removeVolunteer(id);
    toast("Volunteer removed.", "success");
  };

  const handleAssignTicket = () => {
    if (!selectedTicket || !assignVolEmail) return;
    assignTicket(selectedTicket.id, assignVolEmail);
    toast("Ticket assigned.", "success");
    setTicketModalOpen(false);
    setSelectedTicket(null);
    setAssignVolEmail("");
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
              <button onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
              ><Download className="h-4 w-4" /> Export CSV</button>
              {activeTab === "problems" && (
                <button
                  onClick={() => {
                    setPsEditId(null);
                    setPsForm({ title: "", description: "", trackId: "gen-ai", status: "draft" });
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
                  className="relative p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-amber-300 hover:text-amber-600 transition-colors cursor-pointer"
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
                            className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
                          >Mark all read</button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">No notifications</div>}
                        {notifications.slice(0, 10).map((n) => (
                          <div key={n.id} onClick={() => markNotificationRead(n.id)}
                            className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!n.read ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                          >
                            <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"}`} />
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
                <div className="bg-linear-to-br from-amber-600 to-orange-500 rounded-2xl p-6 text-white">
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
                    { label: "Projects Submitted", value: submittedProjects.length, icon: <ClipboardCheck className="h-5 w-5 text-purple-500" />, bg: "bg-purple-50" },
                    { label: "Checked In", value: checkedIn.length, icon: <Activity className="h-5 w-5 text-teal-500" />, bg: "bg-teal-50" },
                    { label: "Volunteers", value: volunteers.length, icon: <UserCheck className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
                    { label: "Open Tickets", value: openTickets.length, icon: <Ticket className="h-5 w-5 text-orange-500" />, bg: "bg-orange-50" },
                    { label: "Rejected", value: rejectedTeams.length, icon: <XCircle className="h-5 w-5 text-red-500" />, bg: "bg-red-50" },
                  ].map((k) => (
                    <div key={k.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-2">
                      <div className={`p-2 rounded-xl w-fit ${k.bg}`}>{k.icon}</div>
                      <div className="text-2xl font-extrabold text-primary-dark dark:text-gray-100">{k.value}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold">{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Broadcast Announcement */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 space-y-3">
                  <div className="font-bold text-primary-dark dark:text-gray-100 text-sm">Broadcast Announcement</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input type="text" value={annForm.title} onChange={(e) => setAnnForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Title..." className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    <input type="text" value={annForm.content} onChange={(e) => setAnnForm((p) => ({ ...p, content: e.target.value }))}
                      placeholder="Message..." className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    <select value={annForm.type} onChange={(e) => setAnnForm((p) => ({ ...p, type: e.target.value as typeof annForm.type }))}
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer">
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                    </select>
                  </div>
                  <button onClick={handleSendAnnouncement} className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 cursor-pointer">Send to All</button>
                </div>
              </motion.div>
            )}


            {/* ==================== SCANNER TAB (Food Token Redemption) ==================== */}
            {activeTab === "scanner" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lookup & Redemption Panel */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700 space-y-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2 dark:text-gray-100">
                      <QrCode className="h-4.5 w-4.5 text-primary-green" /> Scan or Lookup Token
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Enter the token code (e.g., FT-ABCD-1234) or the student&apos;s registration number to verify food tokens.
                    </p>

                    <form onSubmit={handleLookup} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Token Code or Register Number"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        className="flex-1 text-sm border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
                      />
                      <Button type="submit">
                        Look Up
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setScanModalOpen(true)}>
                        Scan Token
                      </Button>
                    </form>

                    {lookupError && (
                      <p className="text-xs text-red-500 font-bold">{lookupError}</p>
                    )}

                    {/* Scanned Token Card */}
                    <AnimatePresence mode="wait">
                      {scannedToken && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 space-y-4"
                        >
                          <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700/50 pb-3">
                            <div>
                              <h4 className="font-extrabold text-sm text-primary-dark dark:text-gray-100">
                                {scannedToken.participantName}
                              </h4>
                              <span className="text-[10px] text-gray-400 font-mono">Reg No: {scannedToken.registerNumber || "N/A"}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${scannedToken.status === "redeemed" ? "bg-red-50 text-red-650" : "bg-emerald-50 text-emerald-700"}`}>
                              {scannedToken.status === "redeemed" ? "Redeemed" : "Valid"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 block">Meal</span>
                              <span className="font-bold text-primary-dark dark:text-gray-150">{scannedToken.mealName}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">Type</span>
                              <span className="font-bold text-primary-dark dark:text-gray-150 capitalize">{scannedToken.mealType}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">Email Address</span>
                              <span className="font-semibold text-gray-650 dark:text-gray-300">{scannedToken.participantEmail}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">Token Code</span>
                              <span className="font-mono text-gray-650 dark:text-gray-300 font-bold">{scannedToken.tokenCode}</span>
                            </div>
                          </div>

                          {scannedToken.status === "issued" ? (
                            <Button
                              onClick={handleRedeem}
                              isLoading={redeeming}
                              className="w-full py-3 mt-2"
                            >
                              Confirm &amp; Redeem Token
                            </Button>
                          ) : (
                            <div className="p-3 text-center rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400 font-bold">
                              Token already redeemed at {scannedToken.redeemedAt ? new Date(scannedToken.redeemedAt).toLocaleString() : "an earlier time"}.
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Redemptions Log */}
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700 space-y-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2 dark:text-gray-100">
                      <Clock className="h-4.5 w-4.5 text-primary-green" /> Your Redemption Log
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-750">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Participant</th>
                            <th className="px-3 py-2">Meal</th>
                            <th className="px-3 py-2">Code</th>
                            <th className="px-3 py-2">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {foodTokens
                            .filter((t) => t.status === "redeemed" && t.redeemedBy === session.email)
                            .slice(0, 10)
                            .map((t) => (
                              <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                                <td className="px-3 py-2">
                                  <div className="font-semibold">{t.participantName}</div>
                                  <div className="text-[9px] text-gray-400">{t.registerNumber}</div>
                                </td>
                                <td className="px-3 py-2">{t.mealName}</td>
                                <td className="px-3 py-2 font-mono text-[10px]">{t.tokenCode}</td>
                                <td className="px-3 py-2 text-[10px] text-gray-400">
                                  {t.redeemedAt ? new Date(t.redeemedAt).toLocaleTimeString() : "-"}
                                </td>
                              </tr>
                            ))}
                          {foodTokens.filter((t) => t.status === "redeemed" && t.redeemedBy === session.email).length === 0 && (
                            <tr>
                              <td colSpan={4} className="text-center py-4 text-gray-400 text-[10px]">
                                No redemptions logged at this station yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Serving Station Info */}
                <div className="space-y-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700 space-y-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2 dark:text-gray-100">
                      <Info className="h-4.5 w-4.5 text-primary-green" /> Active Meals
                    </h3>
                    <div className="space-y-3">
                      {foodMeals.map((m) => {
                        const isPast = new Date(m.scheduledAt).getTime() + m.windowMinutes * 60000 < Date.now();
                        const isFuture = new Date(m.scheduledAt).getTime() > Date.now();
                        const isServing = !isPast && !isFuture;

                        return (
                          <div
                            key={m.id}
                            className={`p-3.5 rounded-xl border flex flex-col gap-1.5 ${isServing ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/10 dark:border-emerald-900" : "bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700"}`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-xs text-primary-dark dark:text-gray-150">{m.name}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${isServing ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-500"}`}>
                                {isServing ? "Serving Now" : isFuture ? "Upcoming" : "Ended"}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400">Scheduled: {new Date(m.scheduledAt).toLocaleTimeString()} ({m.windowMinutes}m validity)</span>
                          </div>
                        );
                      })}
                      {foodMeals.length === 0 && (
                        <div className="text-center py-4 text-xs text-gray-400">No scheduled meals found.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TEAMS ─── */}
            {activeTab === "teams" && (
              <motion.div key="teams" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">All Teams</h2>
                  <button onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                  ><Download className="h-4 w-4" /> Export CSV</button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden dark:bg-gray-900 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Team</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Track</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Size</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Attendance</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teams.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase())).map((t) => {
                        const track = HACK_TRACKS.find((tr) => tr.id === t.trackId);
                        return (
                          <tr key={t.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <td className="px-5 py-3">
                              <div className="font-semibold text-primary-dark dark:text-gray-100">{t.name}</div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{t.qrToken?.split("-").slice(0, 3).join("-")}</div>
                            </td>
                            <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">{track?.label || "—"}</td>
                            <td className="px-5 py-3 text-gray-600 dark:text-gray-300">{t.size}</td>
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
                                <UserCheck className="h-3 w-3" /> Manage
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
                <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Approval Queue</h2>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 dark:bg-gray-900 dark:border-gray-700">
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
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                      <option value="all">All Tracks</option>
                      {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                    </select>
                    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                      <option value="all">All Departments</option>
                      {departments.map((d) => <option key={d} value={d}>{d.split("&")[0].trim()}</option>)}
                    </select>
                    <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white cursor-pointer focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
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
                      { label: "Faculty Approval", done: !!team.facultyApproved },
                    ];
                    const regPct = Math.round((regChecklist.filter((c) => c.done).length / regChecklist.length) * 100);
                    return (
                      <div key={team.id} onClick={() => setSelectedTeam(team)}
                        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="h-12 w-12 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                            {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-extrabold text-primary-dark dark:text-gray-100">{team.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{track?.label || "—"} · {team.size} members · Leader: {leader?.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">{team.projectDescription}</div>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${team.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : team.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                            {team.status}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-1" />
                        </div>

                        {/* Registration checklist */}
                        <div className="mt-4 flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${regPct}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">{regPct}%</span>
                          <div className="flex gap-2">
                            {regChecklist.map((item) => (
                              <div key={item.label} title={item.label}>
                                {item.done ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-gray-300" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredApproval.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">No teams match your filters.</div>}
                </div>
              </motion.div>
            )}

            {/* On-spot materials */}
            {activeTab === "problems" && (
              <motion.div key="problems" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">On-Spot Problem Materials</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Upload the problem statement, PPT template, datasets, and supporting files when the offline round begins.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setPsEditId(null);
                      setPsForm({ title: "", description: "", trackId: "gen-ai", status: "draft" });
                      setPsAttachments([]);
                      setPsCreateOpen(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                  >
                    <Upload className="h-4 w-4" /> Upload Material
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  {problemStatements.map((ps) => {
                    const track = HACK_TRACKS.find((t) => t.id === ps.trackId);
                    const isExpanded = expandedPs === ps.id;
                    return (
                      <div key={ps.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                        <button
                          onClick={() => setExpandedPs(isExpanded ? null : ps.id)}
                          className="w-full p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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
                                {track?.label || "General"} - {ps.attachments?.length || 0} files - Created {new Date(ps.createdAt).toLocaleDateString()}
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
                                      <div className="h-9 w-9 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {problemStatements.length === 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-10 text-center">
                      <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">No on-spot materials uploaded yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "volunteers" && (
              <motion.div key="volunteers" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Volunteers ({volunteers.length})</h2>
                  <button onClick={() => openVolunteerModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                  ><UserPlus className="h-4 w-4" /> Add Volunteer</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {volunteers.map((vol) => (
                    <div key={vol.id} onClick={() => openVolunteerModal(vol)}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 cursor-pointer hover:border-amber-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {vol.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-primary-dark dark:text-gray-100 text-sm truncate">{vol.name}</div>
                          <div className="text-xs text-amber-600 font-semibold">{vol.assignedArea || "Unassigned"}</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{vol.email}</span></div>
                        <div className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" /> {vol.phone || "—"}</div>
                      </div>
                    </div>
                  ))}
                  {volunteers.length === 0 && (
                    <div className="col-span-full text-center text-gray-400 py-12 text-sm">No volunteers added yet. Click &quot;Add Volunteer&quot; to get started.</div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── TICKETS ─── */}
            {activeTab === "tickets" && (
              <motion.div key="tickets" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Support Tickets</h2>

                {/* Status Filters */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-2 dark:bg-gray-900 dark:border-gray-700">
                  {(["all", "Open", "Assigned", "In Progress", "Resolved", "Closed"] as const).map((f) => (
                    <button key={f} onClick={() => setTicketFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${ticketFilter === f ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-amber-100"}`}
                    >
                      {f === "all" ? `All (${allTickets.length})` : `${f} (${allTickets.filter((t) => t.status === f).length})`}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3">
                  {filteredTickets.map((ticket) => {
                    const team = teams.find((t) => t.id === ticket.teamId);
                    const statusColors: Record<string, string> = {
                      Open: "bg-blue-100 text-blue-700",
                      Assigned: "bg-purple-100 text-purple-700",
                      "In Progress": "bg-amber-100 text-amber-700",
                      Resolved: "bg-emerald-100 text-emerald-700",
                      Closed: "bg-gray-100 text-gray-500",
                    };
                    return (
                      <div key={ticket.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                        <div className="flex items-start gap-4 flex-wrap">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-primary-dark dark:text-gray-100 text-sm">{team?.name || "Unknown Team"}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[ticket.status]}`}>{ticket.status}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{ticket.description}</div>
                            <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
                              <span>Category: {ticket.category}</span>
                              <span>Raised by: {ticket.raisedBy}</span>
                              {ticket.assignedTo && <span>Assigned: {ticket.assignedTo}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            {ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                              <>
                                <button onClick={() => { setSelectedTicket(ticket); setTicketModalOpen(true); }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 cursor-pointer">
                                  Assign
                                </button>
                                <select value={ticket.status} onChange={(e) => updateTicketStatus(ticket.id, e.target.value as SupportTicket["status"])}
                                  className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none">
                                  <option value="Open">Open</option>
                                  <option value="Assigned">Assigned</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Resolved">Resolved</option>
                                  <option value="Closed">Closed</option>
                                </select>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredTickets.length === 0 && <div className="text-center text-gray-400 py-12 text-sm">No tickets match this filter.</div>}
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
                      <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
                        {(session.name || "O").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-primary-dark dark:text-gray-100 text-lg">{session.name || "Organizer"}</div>
                        <div className="text-gray-400 dark:text-gray-500 text-sm">{session.email}</div>
                        <div className="text-xs font-semibold text-amber-600 mt-0.5">Organizer · AI Hackathon 2026</div>
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
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
                    </div>
                    <button onClick={() => toast("Profile updated successfully", "success")}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors cursor-pointer">
                      Save Changes
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QR Scanner */}
          

          {/* Attendance Panel */}
          {attendanceTeam && (
            <AttendancePanel
              team={attendanceTeam}
              open={!!attendanceTeam}
              onClose={() => setAttendanceTeam(null)}
              scannerName={session.name || session.email || "Organizer"}
            />
          )}

          {/* ─── TEAM DETAIL MODAL ─── */}
          <Modal
            isOpen={psCreateOpen}
            onClose={() => {
              setPsCreateOpen(false);
              setPsEditId(null);
              setPsAttachments([]);
            }}
            title={psEditId ? "Edit On-Spot Material" : "Upload On-Spot Material"}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={psForm.title}
                  onChange={(e) => setPsForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Problem statement title"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Description *</label>
                <textarea
                  rows={5}
                  value={psForm.description}
                  onChange={(e) => setPsForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the on-spot problem statement..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Track</label>
                  <select
                    value={psForm.trackId}
                    onChange={(e) => setPsForm((p) => ({ ...p, trackId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
                  >
                    {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Status</label>
                  <select
                    value={psForm.status}
                    onChange={(e) => setPsForm((p) => ({ ...p, status: e.target.value as typeof psForm.status }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer"
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
                    : "border-gray-300 dark:border-gray-700 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-900/10"
                }`}>
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
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Click to upload PPT, dataset, or support files</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">PPT, PDF, CSV, XLSX, ZIP, DOCX, JSON, notebooks - Max 10MB each</span>
                    </>
                  )}
                </label>

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

              <button
                onClick={handleSaveProblemStatement}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors cursor-pointer"
              >
                {psEditId ? "Update Material" : "Create Material"}
              </button>
            </div>
          </Modal>

          <Modal isOpen={!!selectedTeam} onClose={() => { setSelectedTeam(null); setRejectReason(""); }} title="Team Details">
            {selectedTeam && (
              <div className="space-y-5">
                {/* Team Header */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="h-14 w-14 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {selectedTeam.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-extrabold text-primary-dark text-lg dark:text-gray-100">{selectedTeam.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {HACK_TRACKS.find((tr) => tr.id === selectedTeam.trackId)?.label || "—"} · {selectedTeam.size} members
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${selectedTeam.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : selectedTeam.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                    {selectedTeam.status}
                  </span>
                </div>

                {/* Team Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Created</div>
                    <div className="text-primary-dark dark:text-gray-100 font-semibold">{new Date(selectedTeam.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase">QR Token</div>
                    <div className="text-primary-dark dark:text-gray-100 font-semibold font-mono text-xs">{selectedTeam.qrToken || "—"}</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Faculty Approval</div>
                    <div className={`font-semibold ${selectedTeam.facultyApproved ? "text-emerald-600" : "text-gray-500"}`}>{selectedTeam.facultyApproved ? "Approved" : "Pending"}</div>
                  </div>
                </div>

                {/* Members */}
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Members</div>
                  <div className="flex flex-col gap-2">
                    {selectedTeam.members.map((m) => (
                      <div key={m.email} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="h-8 w-8 rounded-lg bg-linear-to-br from-amber-300 to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {m.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-primary-dark dark:text-gray-100">{m.name} {m.isLeader && <span className="text-[10px] text-amber-600 font-bold">(Leader)</span>}</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{m.email} · {m.department} · {m.year}</div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                          <Mail className="h-3 w-3" />
                          <Phone className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Registration Progress */}
                <div>
                  <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Registration Progress</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Team Created", done: true },
                      { label: "Members Added", done: selectedTeam.size >= 2 },
                      { label: "Faculty Approved", done: !!selectedTeam.facultyApproved },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        {item.done ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4 text-gray-300" />}
                        <span className={item.done ? "text-primary-dark" : "text-gray-400"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project Info */}
                {selectedTeam.projectDescription && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Project</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">{selectedTeam.projectDescription}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                      {selectedTeam.githubUrl && <a href={selectedTeam.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline"><Github className="h-3 w-3" /> GitHub</a>}
                      {selectedTeam.demoUrl && <a href={selectedTeam.demoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-500 hover:underline"><Globe className="h-3 w-3" /> Demo</a>}
                      {selectedTeam.videoUrl && <a href={selectedTeam.videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-500 hover:underline"><Video className="h-3 w-3" /> Video</a>}
                    </div>
                  </div>
                )}

                {/* Approval Controls */}
                {selectedTeam.status === "PENDING" && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Approval Action</div>
                    <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200" />
                    <div className="flex gap-3">
                      <button onClick={() => handleApprove(selectedTeam.id, selectedTeam.name)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 cursor-pointer flex items-center justify-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Approve Team
                      </button>
                      <button onClick={() => handleReject(selectedTeam.id, selectedTeam.name)}
                        className="flex-1 py-2.5 rounded-xl bg-red-100 text-red-600 font-bold text-sm hover:bg-red-200 cursor-pointer flex items-center justify-center gap-1 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50">
                        <XCircle className="h-4 w-4" /> Reject Team
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>

          {/* ─── VOLUNTEER MODAL ─── */}
          <Modal isOpen={volModalOpen} onClose={() => { setVolModalOpen(false); setEditingVolunteer(null); }} title={editingVolunteer ? "Edit Volunteer" : "Add Volunteer"}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Name *</label>
                <input type="text" value={volForm.name} onChange={(e) => setVolForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Email *</label>
                <input type="email" value={volForm.email} onChange={(e) => setVolForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Phone</label>
                <input type="tel" value={volForm.phone} onChange={(e) => setVolForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Phone number" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Assigned Area</label>
                <input type="text" value={volForm.assignedArea} onChange={(e) => setVolForm((p) => ({ ...p, assignedArea: e.target.value }))}
                  placeholder="e.g. Registration Desk, Venue" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Assigned Responsibilities</label>
                <textarea rows={3} value={volForm.assignedResponsibilities} onChange={(e) => setVolForm((p) => ({ ...p, assignedResponsibilities: e.target.value }))}
                  placeholder="Describe responsibilities..." className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSaveVolunteer}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 cursor-pointer">
                  {editingVolunteer ? "Update" : "Add Volunteer"}
                </button>
                {editingVolunteer && (
                  <button onClick={() => { handleRemoveVolunteer(editingVolunteer.id); setVolModalOpen(false); setEditingVolunteer(null); }}
                    className="px-4 py-2.5 rounded-xl bg-red-100 text-red-600 font-bold text-sm hover:bg-red-200 cursor-pointer border border-red-200">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </Modal>

          {/* ─── TICKET ASSIGN MODAL ─── */}
          <Modal isOpen={ticketModalOpen} onClose={() => { setTicketModalOpen(false); setSelectedTicket(null); setAssignVolEmail(""); }} title="Assign Volunteer to Ticket">
            {selectedTicket && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-sm">
                  <div className="font-semibold text-primary-dark dark:text-gray-100">{teams.find((t) => t.id === selectedTicket.teamId)?.name || "Unknown Team"}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedTicket.category} · {selectedTicket.description}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">Assign to Volunteer</label>
                  <select value={assignVolEmail} onChange={(e) => setAssignVolEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-200 cursor-pointer">
                    <option value="">Select a volunteer...</option>
                    {volunteers.map((v) => (
                      <option key={v.id} value={v.email}>{v.name} ({v.assignedArea || "Unassigned"})</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleAssignTicket} disabled={!assignVolEmail}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Assign Ticket
                </button>
              </div>
            )}
          </Modal>

          <Modal isOpen={scanModalOpen} onClose={() => setScanModalOpen(false)} title="Scan Generated Token">
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-gray-500">
                Below is a list of active, unused food tokens generated in this hackathon. Select one to simulate scanning it.
              </p>
              
              <div className="flex flex-col gap-2">
                {foodTokens
                  .filter((t) => t.status === "issued" && t.hackathonId === activeHackathonId)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setScannedToken(t);
                        setLookupQuery(t.tokenCode);
                        setScanModalOpen(false);
                        toast(`Scanned token ${t.tokenCode} for ${t.participantName}`, "success");
                      }}
                      className="p-3 rounded-xl border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-green hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 cursor-pointer transition-all flex justify-between items-center gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-primary-dark dark:text-gray-150 truncate">
                          {t.participantName}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                          Code: {t.tokenCode} | {t.mealName}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 text-[9px] font-bold uppercase shrink-0">
                        {t.mealType}
                      </span>
                    </div>
                  ))}
                {foodTokens.filter((t) => t.status === "issued" && t.hackathonId === activeHackathonId).length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No valid unredeemed tokens found for the active hackathon.
                  </div>
                )}
              </div>
            </div>
          </Modal>
        </main>
      </div>
    </PageWrapper>
  );
}
