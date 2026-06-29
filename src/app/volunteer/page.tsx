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
  LifeBuoy,
  User,
  Bell,
  CheckCircle,
  Clock,
  Filter,
  QrCode,
  ClipboardCheck,
  HelpCircle,
  Phone,
  AlertTriangle,
  Info,
} from "lucide-react";
import { QRScanner } from "@/components/ui/QRScanner";
import { SupportTicket, Team } from "@/types";

type TabType = "dashboard" | "tickets" | "profile" | "attendance" | "scanner" | "support" | "approval";
type TicketFilter = "all" | "Open" | "Assigned" | "In Progress" | "Resolved" | "Closed";


const statusColors: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  Assigned: "bg-purple-100 text-purple-700",
  "In Progress": "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Closed: "bg-gray-100 text-gray-500",
};

export default function VolunteerDashboard() {
  const router = useRouter();
  const { session, teams, notifications, tickets, volunteers, updateTicketStatus, markAllNotificationsRead, updateProfile, getProfile } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");
  const [notifOpen, setNotifOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileSkills, setProfileSkills] = useState("");
  const [profileSocialLinks, setProfileSocialLinks] = useState<{ platform: string; url: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "volunteer")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  useEffect(() => {
    if (session.email) {
      const profile = getProfile(session.email);
      if (profile) {
        setProfileName(profile.name || "");
        setProfileBio(profile.bio || "");
        setProfileSkills((profile.skills || []).join(", "));
        setProfileSocialLinks(profile.socialLinks || []);
      } else {
        setProfileName(session.name || "");
      }
    }
  }, [session.email, session.name, getProfile]);

  // Aggregate tickets from teams' supportTickets
  const allTickets: (SupportTicket & { teamName?: string })[] = useMemo(() => {
    return tickets.length > 0
      ? tickets
      : teams.flatMap((t) => (t.supportTickets || []).map((tk) => ({ ...tk, teamName: t.name })));
  }, [tickets, teams]);

  // Tickets assigned to this volunteer
  const myTickets = useMemo(() => {
    return allTickets.filter(
      (t) => t.assignedTo && t.assignedTo.toLowerCase() === (session.email || "").toLowerCase()
    );
  }, [allTickets, session.email]);

  const pendingTickets = useMemo(() => myTickets.filter((t) => t.status !== "Resolved" && t.status !== "Closed"), [myTickets]);
  const recentlyResolved = useMemo(() => {
    return myTickets.filter((t) => {
      if (t.status !== "Resolved") return false;
      const created = new Date(t.createdAt);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return created >= sevenDaysAgo;
    });
  }, [myTickets]);

  const filteredTickets = useMemo(() => allTickets.filter((t) => ticketFilter === "all" || t.status === ticketFilter), [allTickets, ticketFilter]);

  if (!mounted || !session.isLoggedIn || session.role !== "volunteer") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500 dark:bg-gray-950 dark:text-gray-400">
        Loading volunteer portal...
      </div>
    );
  }

  // Find volunteer info from state
  const volunteerInfo = volunteers.find((v) => v.email.toLowerCase() === (session.email || "").toLowerCase());

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSaveProfile = () => {
    if (!session.email) return;
    updateProfile(session.email, {
      name: profileName,
      bio: profileBio,
      skills: profileSkills.split(",").map((s) => s.trim()).filter(Boolean),
      socialLinks: profileSocialLinks,
    });
    toast("Profile updated successfully.", "success");
  };

  const handleTicketAction = (ticketId: string, status: SupportTicket["status"]) => {
    updateTicketStatus(ticketId, status);
    toast(`Ticket marked as ${status}.`, "success");
  };

  const getTeamName = (teamId: string) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team";
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50 dark:bg-gray-950">
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as TabType)} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "tickets", label: "Tickets" },
            { id: "attendance", label: "Attendance" },
            { id: "scanner", label: "Scanner" },
            { id: "support", label: "Support" },
            { id: "approval", label: "Approval" },
            { id: "profile", label: "Profile" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === item.id
                  ? "bg-primary-green text-white"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight capitalize dark:text-gray-100">
              {activeTab === "dashboard" ? "Volunteer Portal" : activeTab.replace("-", " ")}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5 dark:text-gray-400">
              Logged in as: <strong>{session.email}</strong> | Role: Volunteer
              {volunteerInfo?.assignedArea && (
                <> | Area: <strong>{volunteerInfo.assignedArea}</strong></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <ThemeToggle />
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
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
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                      <span className="font-bold text-sm text-primary-dark dark:text-gray-100">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => {
                            markAllNotificationsRead();
                            toast("All notifications marked as read", "info");
                          }}
                          className="text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 text-xs ${!n.read ? "bg-emerald-50/50 dark:bg-emerald-900/20" : ""}`}
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-primary-dark dark:text-gray-100">{n.title}</span>
                            {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary-green shrink-0" />}
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 line-clamp-2">{n.body}</p>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="px-4 py-8 text-center text-xs text-gray-400">No notifications yet.</div>
                      )}
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
            {/* ==================== DASHBOARD TAB ==================== */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-6">
                {/* Welcome Banner */}
                <div className="rounded-3xl border border-input-border/30 bg-linear-to-r from-primary-green/5 to-emerald-50 p-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary-green/10 flex items-center justify-center shrink-0">
                      <User className="h-7 w-7 text-primary-green" />
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-primary-dark dark:text-gray-100">
                        Welcome, {volunteerInfo?.name || session.name || "Volunteer"}!
                      </h2>
                      <p className="text-xs text-gray-500 font-semibold mt-0.5 dark:text-gray-400">
                        {volunteerInfo?.assignedArea
                          ? `Assigned Area: ${volunteerInfo.assignedArea}`
                          : "No area assigned yet"}
                        {volunteerInfo?.assignedResponsibilities && (
                          <> · {volunteerInfo.assignedResponsibilities}</>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    {
                      label: "Assigned Tickets",
                      val: myTickets.length,
                      icon: <LifeBuoy className="h-5 w-5" />,
                      color: "text-blue-600",
                    },
                    {
                      label: "Pending Tickets",
                      val: pendingTickets.length,
                      icon: <Clock className="h-5 w-5 text-amber-500" />,
                      color: "text-amber-600",
                    },
                    {
                      label: "Recently Resolved",
                      val: recentlyResolved.length,
                      icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
                      color: "text-emerald-600",
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl border border-input-border/30 bg-white shadow-sm flex items-center gap-4 dark:bg-gray-900 dark:border-gray-700"
                    >
                      <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                        {stat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider dark:text-gray-500">
                          {stat.label}
                        </span>
                        <span className="text-sm font-extrabold text-primary-dark dark:text-gray-100">{stat.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Assigned Tickets List */}
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4 dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2 dark:text-gray-100 dark:border-gray-700">
                    <LifeBuoy className="h-4.5 w-4.5 text-primary-green" /> My Assigned Tickets
                  </h3>
                  <div className="flex flex-col gap-3">
                    {myTickets.slice(0, 5).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex justify-between items-center p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-gray-800 dark:text-gray-100">
                              {ticket.teamName || getTeamName(ticket.teamId ?? "")}
                            </span>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                statusColors[ticket.status] || ""
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5 line-clamp-1">
                            {ticket.category} · {ticket.description}
                          </p>
                        </div>
                      </div>
                    ))}
                    {myTickets.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No tickets assigned to you yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TICKETS TAB ==================== */}
            {activeTab === "tickets" && (
              <div className="flex flex-col gap-6">
                {/* Filter Bar */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-gray-400" />
                  {(["all", "Open", "Assigned", "In Progress", "Resolved", "Closed"] as TicketFilter[]).map(
                    (f) => (
                      <button
                        key={f}
                        onClick={() => setTicketFilter(f)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          ticketFilter === f
                            ? "bg-primary-green text-white"
                            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-green/40"
                        }`}
                      >
                        {f === "all" ? "All" : f}
                      </button>
                    )
                  )}
                </div>

                {/* Tickets List */}
                <div className="flex flex-col gap-3">
                  {filteredTickets.map((ticket) => {
                    const isAssignedToMe =
                      ticket.assignedTo &&
                      ticket.assignedTo.toLowerCase() === (session.email || "").toLowerCase();
                    return (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3 dark:bg-gray-900 dark:border-gray-700"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-primary-dark text-sm dark:text-gray-100">
                              {ticket.teamName || getTeamName(ticket.teamId ?? "")}
                            </span>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                statusColors[ticket.status] || ""
                              }`}
                            >
                              {ticket.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ticket.description}</div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                            <span>Category: {ticket.category}</span>
                            <span>Raised by: {ticket.raisedBy}</span>
                            {ticket.assignedTo && <span>Assigned: {ticket.assignedTo}</span>}
                          </div>
                        </div>

                        {/* Volunteer Actions */}
                        <div className="flex gap-2 shrink-0">
                          {isAssignedToMe && ticket.status !== "Resolved" && ticket.status !== "Closed" && (
                            <>
                              {ticket.status !== "In Progress" && (
                                <button
                                  onClick={() => handleTicketAction(ticket.id, "In Progress")}
                                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 cursor-pointer"
                                >
                                  In Progress
                                </button>
                              )}
                              <button
                                onClick={() => handleTicketAction(ticket.id, "Resolved")}
                                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              >
                                Resolved
                              </button>
                            </>
                          )}
                          {isAssignedToMe && ticket.status !== "Closed" && (
                            <button
                              onClick={() => handleTicketAction(ticket.id, "Closed")}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 cursor-pointer dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <div className="text-center text-gray-400 py-12 text-sm">No tickets match this filter.</div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== PROFILE TAB ==================== */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <h2 className="font-extrabold text-primary-dark text-xl dark:text-gray-100">Profile & Settings</h2>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 dark:bg-gray-900 dark:border-gray-700">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="h-16 w-16 rounded-2xl bg-linear-to-br from-primary-green to-emerald-600 flex items-center justify-center text-white text-2xl font-extrabold shrink-0">
                        {(profileName || "V")
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-extrabold text-primary-dark text-lg dark:text-gray-100">
                          {profileName || "Volunteer"}
                        </div>
                        <div className="text-gray-400 text-sm dark:text-gray-500">{session.email}</div>
                        <div className="text-xs font-semibold text-primary-green mt-0.5">
                          Volunteer · AI Hackathon 2026
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          value={session.email || ""}
                          readOnly
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        />
                        <p className="text-[11px] text-gray-400 mt-1 dark:text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                        Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={profileSkills}
                        onChange={(e) => setProfileSkills(e.target.value)}
                        placeholder="e.g. First Aid, Crowd Management, Logistics"
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="px-6 py-2.5 rounded-xl bg-primary-green text-white text-sm font-bold hover:bg-primary-green/90 transition-colors cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ATTENDANCE TAB ==================== */}
            {activeTab === "attendance" && (
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <CheckCircle className="h-4.5 w-4.5 text-primary-green" /> Teams Checked In Today
                  </h3>
                  <div className="flex flex-col gap-3">
                    {teams.filter((t) => t.status === "APPROVED").slice(0, 10).map((team) => (
                      <div
                        key={team.id}
                        className="flex justify-between items-center p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {team.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-100">{team.name}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                              {team.members.length} members · {team.trackId || "No track"}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          {team.status}
                        </span>
                      </div>
                    ))}
                    {teams.filter((t) => t.status === "APPROVED").length === 0 && (
                      <p className="text-xs text-gray-400 italic">No teams checked in today.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <Clock className="h-4.5 w-4.5 text-amber-500" /> Check-in History
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>Attendance records are updated in real-time as teams scan in at stations.</p>
                    <p className="mt-2">Use the <strong>QR Scanner</strong> tab to scan team QR codes for attendance tracking.</p>
                  </div>
                </div>

                {volunteerInfo?.assignedArea && (
                  <div className="rounded-3xl border border-input-border/30 bg-linear-to-r from-primary-green/5 to-emerald-50 p-5 sm:p-6 shadow-sm dark:from-primary-green/10 dark:to-emerald-900/20">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2 dark:text-gray-100">
                      <Info className="h-4.5 w-4.5 text-primary-green" /> Your Station
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      You are assigned to <strong>{volunteerInfo.assignedArea}</strong>. Scan QR codes at this station to track attendance.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== SCANNER TAB ==================== */}
            {activeTab === "scanner" && (
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <QrCode className="h-4.5 w-4.5 text-primary-green" /> QR Scanner
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Scan team or participant QR codes to check attendance or access team information.
                  </p>
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-green text-white text-sm font-bold hover:bg-primary-green/90 transition-colors cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" />
                    Open Scanner
                  </button>
                </div>

                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <HelpCircle className="h-4.5 w-4.5 text-blue-500" /> How to Use
                  </h3>
                  <div className="space-y-3 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary-green/10 flex items-center justify-center text-primary-green font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <p>Tap <strong>Open Scanner</strong> to activate your camera.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary-green/10 flex items-center justify-center text-primary-green font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <p>Point your camera at a team&apos;s QR code or participant badge.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary-green/10 flex items-center justify-center text-primary-green font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <p>The system will automatically recognize the code and route you to the appropriate action.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SUPPORT TAB ==================== */}
            {activeTab === "support" && (
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <HelpCircle className="h-4.5 w-4.5 text-primary-green" /> FAQ &amp; Help Resources
                  </h3>
                  <div className="space-y-4">
                    {[
                      { q: "How do I check in a team?", a: "Use the QR Scanner tab to scan the team's QR code. The system will automatically log their attendance." },
                      { q: "What if a team has lost their QR code?", a: "You can search for the team manually in the QR Scanner fallback mode by team name or member name." },
                      { q: "How do I handle a support ticket?", a: "Go to the Tickets tab, find tickets assigned to you, and update their status as you work through them." },
                      { q: "What if I can't access the scanner?", a: "Make sure you've granted camera permissions. You can also use the manual search fallback in the scanner." },
                    ].map((faq, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
                        <div className="font-bold text-primary-dark dark:text-gray-100 mb-1">{faq.q}</div>
                        <p className="text-gray-500 dark:text-gray-400">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <Phone className="h-4.5 w-4.5 text-red-500" /> Emergency Contacts
                  </h3>
                  <div className="space-y-3">
                    {[
                      { role: "Event Coordinator", contact: "coordinator@ai-lab.in", note: "For event-wide issues" },
                      { role: "Technical Support", contact: "tech@ai-lab.in", note: "For system/website issues" },
                      { role: "Campus Security", contact: "Ext. 100", note: "For safety emergencies" },
                    ].map((c, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs">
                        <Phone className="h-4 w-4 text-red-500 shrink-0" />
                        <div>
                          <div className="font-bold text-primary-dark dark:text-gray-100">{c.role}</div>
                          <div className="text-gray-500 dark:text-gray-400">{c.contact} · {c.note}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-input-border/30 bg-linear-to-r from-amber-50 to-orange-50 p-5 sm:p-6 shadow-sm dark:from-amber-900/20 dark:to-orange-900/20">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2 dark:text-gray-100">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" /> Handling Common Issues
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <p><strong>Team not found:</strong> Verify you&apos;re scanning the correct QR code. Use manual search as backup.</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <p><strong>Duplicate check-in:</strong> Inform the team that attendance has already been recorded.</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <p><strong>Camera issues:</strong> Switch to manual search or restart the scanner from the QR Scanner tab.</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <p><strong>Urgent problems:</strong> Contact the Event Coordinator immediately using the emergency contacts above.</p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* ==================== APPROVAL VIEW TAB ==================== */}
            {activeTab === "approval" && (
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-2 dark:text-gray-100">
                    <ClipboardCheck className="h-4.5 w-4.5 text-primary-green" /> Approval View
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Read-only view of team approval status. Actual approvals are managed by organizers.
                  </p>
                </div>

                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2 mb-4">
                    <Clock className="h-4.5 w-4.5" /> Pending Approval
                  </h3>
                  <div className="flex flex-col gap-3">
                    {teams.filter((t) => t.status === "PENDING").map((team) => (
                      <div
                        key={team.id}
                        className="flex justify-between items-center p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {team.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-100">{team.name}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                              {team.members.length} members · Submitted {team.createdAt ? new Date(team.createdAt).toLocaleDateString() : "N/A"}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          PENDING
                        </span>
                      </div>
                    ))}
                    {teams.filter((t) => t.status === "PENDING").length === 0 && (
                      <p className="text-xs text-gray-400 italic">No teams pending approval.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2 mb-4">
                    <CheckCircle className="h-4.5 w-4.5" /> Approved Teams
                  </h3>
                  <div className="flex flex-col gap-3">
                    {teams.filter((t) => t.status === "APPROVED").map((team) => (
                      <div
                        key={team.id}
                        className="flex justify-between items-center p-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {team.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 dark:text-gray-100">{team.name}</div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500">
                              {team.members.length} members · {team.trackId || "No track"}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          APPROVED
                        </span>
                      </div>
                    ))}
                    {teams.filter((t) => t.status === "APPROVED").length === 0 && (
                      <p className="text-xs text-gray-400 italic">No approved teams yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <QRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onSelectTeam={(team: Team) => {
          toast(`Selected team: ${team.name}`, "success");
        }}
      />
    </PageWrapper>
  );
}
