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

import { SupportTicket, FoodToken } from "@/types";

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
  const {
    session, teams, problemStatements, notifications, tickets, volunteers, updateTicketStatus,
    markAllNotificationsRead, updateProfile, getProfile,
    foodMeals, foodTokens, redeemToken, lookupToken, activeHackathonId
  } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("all");
  const [notifOpen, setNotifOpen] = useState(false);

  // Food token lookup states
  const [lookupQuery, setLookupQuery] = useState("");
  const [scannedToken, setScannedToken] = useState<FoodToken | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [scanModalOpen, setScanModalOpen] = useState(false);


  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profileCollege, setProfileCollege] = useState("");
  const [profileHostelStatus, setProfileHostelStatus] = useState<"hosteller" | "dayscholar" | "">("");
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
        setProfileCollege(profile.college || "");
        setProfileHostelStatus(profile.hostelStatus || "");
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
    if (!profileCollege.trim()) { toast("College Name is required.", "error"); return; }
    if (!profileHostelStatus) { toast("Please select whether you are a Hosteller or Dayscholar.", "error"); return; }
    updateProfile(session.email, {
      name: profileName,
      college: profileCollege,
      hostelStatus: profileHostelStatus,
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

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen pt-20 md:pt-10">
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
                          College Name
                        </label>
                        <input
                          type="text"
                          value={profileCollege}
                          onChange={(e) => setProfileCollege(e.target.value)}
                          placeholder="e.g. SIET"
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide block mb-1.5">
                          Hosteller / Dayscholar
                        </label>
                        <select
                          value={profileHostelStatus}
                          onChange={(e) => setProfileHostelStatus(e.target.value as "hosteller" | "dayscholar")}
                          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Select status</option>
                          <option value="hosteller">Hosteller</option>
                          <option value="dayscholar">Dayscholar</option>
                        </select>
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
                              {team.members.length} members · {problemStatements.find(ps => ps.id === team.problemStatementId)?.title || "No problem statement"}
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
                    <p className="mt-2">Use the <strong>Attendance</strong> tab to track team attendance.</p>
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
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${scannedToken.status === "redeemed" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
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
                              <span className="font-semibold text-gray-600 dark:text-gray-300">{scannedToken.participantEmail}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 block">Token Code</span>
                              <span className="font-mono text-gray-600 dark:text-gray-300 font-bold">{scannedToken.tokenCode}</span>
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

            {/* ==================== SUPPORT TAB ==================== */}
            {activeTab === "support" && (
              <div className="flex flex-col gap-6">
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 mb-4 dark:text-gray-100">
                    <HelpCircle className="h-4.5 w-4.5 text-primary-green" /> FAQ &amp; Help Resources
                  </h3>
                  <div className="space-y-4">
                    {[
                      { q: "How do I check in a team?", a: "Use the Attendance tab to manually find and check in the team. The system will automatically log their attendance." },
                      { q: "How do I handle a support ticket?", a: "Go to the Tickets tab, find tickets assigned to you, and update their status as you work through them." },
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
                      <p><strong>Team not found:</strong> Ensure you are searching by correct team or member name in the Attendance tab.</p>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <p><strong>Duplicate check-in:</strong> Inform the team that attendance has already been recorded.</p>
                    </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-500 mt-0.5">⚠️</span>
                        <p><strong>System offline:</strong> Try refreshing your page if the server disconnects.</p>
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
                              {team.members.length} members · {problemStatements.find(ps => ps.id === team.problemStatementId)?.title || "No problem statement"}
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

    </PageWrapper>
  );
}
