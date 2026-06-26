"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  FolderCode,
  Megaphone,
  BookOpen,
  Activity,
  Settings,
  CheckCircle,
  XCircle,
  ExternalLink,
  Plus,
  Trash2,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Team } from "@/types";

export default function OrganizerDashboard() {
  const router = useRouter();
  const { session, teams, announcements, approveTeam, rejectTeam, addAnnouncement } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Announcement state
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState<"info" | "warning" | "success">("info");

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "organizer")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "organizer") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500">
        Loading organizer desk...
      </div>
    );
  }

  // Count approvals metrics
  const pendingTeams = teams.filter((t) => t.status === "PENDING");
  const approvedTeams = teams.filter((t) => t.status === "APPROVED");
  const rejectedTeams = teams.filter((t) => t.status === "REJECTED");

  const handleApprove = (id: string) => {
    approveTeam(id);
    toast("Team registration approved successfully.", "success");
  };

  const handleReject = (id: string) => {
    rejectTeam(id);
    toast("Team registration flagged/rejected.", "info");
  };

  const handlePublishAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) {
      toast("Please specify announcement title and message content.", "error");
      return;
    }
    addAnnouncement(annTitle, annContent, annType);
    toast("Announcement broadcasted successfully to all participant workspaces.", "success");
    setAnnTitle("");
    setAnnContent("");
    setAnnType("info");
    setActiveTab("dashboard");
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "approvals", label: "Approvals Queue" },
            { id: "teams", label: "Teams Directory" },
            { id: "projects", label: "Projects Directory" },
            { id: "announcements", label: "Announcements" },
            { id: "stats", label: "Stats & Analytics" },
            { id: "settings", label: "Settings" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === item.id 
                  ? "bg-primary-green text-white" 
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Workspace Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight capitalize">
              {activeTab === "dashboard" ? "Organizer Control" : activeTab.replace("-", " ")}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Logged in as: <strong>{session.email}</strong> | Role: {session.role?.toUpperCase()}
            </p>
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
                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {[
                    { label: "Pending Approvals", val: pendingTeams.length, icon: <UserCheck className="h-5 w-5 text-amber-500" /> },
                    { label: "Approved Teams", val: approvedTeams.length, icon: <CheckCircle className="h-5 w-5 text-emerald-650" /> },
                    { label: "Rejected Teams", val: rejectedTeams.length, icon: <XCircle className="h-5 w-5 text-red-500" /> },
                    { label: "Total Registrations", val: teams.length, icon: <Users className="h-5 w-5 text-primary-green" /> }
                  ].map((stat, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-input-border/30 bg-white shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                        {stat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
                        <span className="text-sm font-extrabold text-primary-dark">{stat.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Audit Approval Queue Peek */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 rounded-3xl border border-input-border/30 bg-white p-5 shadow-sm flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                      <UserCheck className="h-4.5 w-4.5 text-primary-green" /> Action Approvals Queue
                    </h3>
                    
                    <div className="flex flex-col gap-3">
                      {pendingTeams.map((team) => (
                        <div key={team.id} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 bg-white text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{team.name}</p>
                            <p className="text-[9px] text-gray-400 font-semibold">{team.members.length} members | Registry: {team.id}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReject(team.id)}
                              className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-650 hover:bg-red-50 text-[10px] font-bold cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApprove(team.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-primary-green text-white hover:bg-primary-green/90 text-[10px] font-bold cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                      {pendingTeams.length === 0 && (
                        <p className="text-xs text-gray-400 italic">No registrations waiting in the audit approvals queue.</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3 h-fit">
                    <h3 className="text-xs font-extrabold text-primary-dark uppercase tracking-wider border-b border-gray-150 pb-2">System Notice</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Approving a team validates their registry credentials in the SIET administration log. It releases access to Cloud GPU credits and final code submissions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== APPROVALS QUEUE TAB ==================== */}
            {activeTab === "approvals" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-base font-bold text-primary-dark border-b border-gray-150 pb-3">
                  SIET Registrations Audit Desk ({pendingTeams.length} pending)
                </h3>
                <div className="flex flex-col gap-4">
                  {pendingTeams.map((team) => (
                    <div key={team.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div>
                        <h4 className="font-extrabold text-primary-dark text-sm">{team.name}</h4>
                        <p className="text-gray-400 font-semibold mt-1">Project Concept: {team.projectDescription || "No concept stated."}</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Teammates: {team.members.map((m) => `${m.name} (${m.department})`).join(", ")}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleReject(team.id)}
                          className="px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-650 font-bold cursor-pointer"
                        >
                          Reject Registration
                        </button>
                        <button
                          onClick={() => handleApprove(team.id)}
                          className="px-3.5 py-2 rounded-xl bg-primary-green hover:bg-primary-green/90 text-white font-bold cursor-pointer"
                        >
                          Approve Team
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingTeams.length === 0 && (
                    <div className="py-12 text-center text-xs text-gray-400 italic">
                      No registrations awaiting credentials audit approvals.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== TEAMS DIRECTORY TAB ==================== */}
            {activeTab === "teams" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-primary-dark border-b border-gray-150 pb-3">Teams Registry Directory</h3>
                
                <div className="flex flex-col gap-3.5">
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs hover:border-input-border/20 transition-all">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-extrabold text-primary-dark text-sm">{team.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            team.status === "APPROVED" 
                              ? "bg-emerald-50 text-emerald-705 border border-emerald-100" 
                              : team.status === "REJECTED" 
                              ? "bg-red-50 text-red-700 border border-red-100" 
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {team.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1">Registry: {team.id} | Size: {team.size} members</p>
                        <p className="text-gray-500 font-semibold mt-0.5">Teammates: {team.members.map((m) => m.name).join(", ")}</p>
                      </div>

                      <div className="flex gap-2">
                        {team.status !== "APPROVED" && (
                          <button
                            onClick={() => handleApprove(team.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-primary-green hover:bg-emerald-100 text-[10px] font-bold border border-primary-green/20 cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {team.status !== "REJECTED" && (
                          <button
                            onClick={() => handleReject(team.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-55/10 text-red-650 hover:bg-red-50 text-[10px] font-bold border border-red-200 cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== PROJECTS DIRECTORY TAB ==================== */}
            {activeTab === "projects" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-primary-dark border-b border-gray-150 pb-3">Submissions & Code Repository Directory</h3>
                
                <div className="flex flex-col gap-4">
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col gap-3 text-xs hover:border-input-border/20 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-extrabold text-primary-dark">{team.name}</h4>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Status: {team.status} | Final Submission: {team.submitted ? "Yes" : "No"}</p>
                        </div>
                        {team.submitted ? (
                          <Badge variant="success">Submitted</Badge>
                        ) : (
                          <Badge variant="warning">In Progress</Badge>
                        )}
                      </div>

                      <p className="text-gray-500 leading-relaxed font-semibold">
                        {team.projectDescription || "No concept summary declared by team."}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-semibold mt-1">
                        <div className="p-2 border border-gray-100 rounded-xl flex justify-between">
                          <span className="text-gray-400">GitHub Repository:</span>
                          <a href={team.githubUrl || "#"} target="_blank" rel="noreferrer" className="text-primary-green hover:underline">
                            {team.githubUrl ? "Open Repository" : "Not Linked"}
                          </a>
                        </div>
                        <div className="p-2 border border-gray-100 rounded-xl flex justify-between">
                          <span className="text-gray-400">Average Judge Rating:</span>
                          <span className="font-bold text-primary-green">
                            {team.evaluations && team.evaluations.length > 0 
                              ? `${(team.evaluations.reduce((acc, curr) => acc + (curr.innovation + curr.feasibility + curr.presentation)/3, 0) / team.evaluations.length).toFixed(1)} / 10`
                              : "Not Rated"
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== ANNOUNCEMENTS TAB ==================== */}
            {activeTab === "announcements" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form Announcements (Left columns) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-primary-green" /> Broadcast Global Announcement
                    </h3>
                    
                    <form onSubmit={handlePublishAnn} className="flex flex-col gap-4">
                      <Input
                        label="Broadcast Title"
                        placeholder="e.g. Mid-term review abstracts deadline extended"
                        value={annTitle}
                        onChange={(e) => setAnnTitle(e.target.value)}
                      />

                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="font-bold text-gray-700">Message Content</label>
                        <textarea
                          rows={4}
                          value={annContent}
                          onChange={(e) => setAnnContent(e.target.value)}
                          placeholder="Input direct instructions for participant teams regarding code requirements or deadline updates..."
                          className="w-full px-4 py-3 rounded-xl border border-input-border focus:ring-1 focus:ring-primary-green focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="font-bold text-gray-700">Notification Level</label>
                        <select
                          value={annType}
                          onChange={(e) => setAnnType(e.target.value as "info" | "warning" | "success")}
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-input-border bg-white cursor-pointer"
                        >
                          <option value="info">Information (Blue)</option>
                          <option value="warning">Action Required (Amber)</option>
                          <option value="success">Success Broadcast (Emerald)</option>
                        </select>
                      </div>

                      <Button type="submit" className="text-xs mt-2">
                        Publish Broadcast
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Guidelines Announcements (Right column) */}
                <div className="flex flex-col gap-6">
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-extrabold text-primary-dark uppercase tracking-wider border-b border-gray-150 pb-2">Working Instructions</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Broadcasts are pushed instantly to all student dashboards. Use &quot;Action Required&quot; level to notify teams regarding delayed checklists or approvals errors.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STATS & ANALYTICS TAB ==================== */}
            {activeTab === "stats" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-8 shadow-sm flex flex-col gap-6">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-3">
                  <Activity className="h-5 w-5 text-primary-green" /> Event Analytics & Registration Reports
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold">
                  <div className="p-5 bg-card-bg/25 border border-input-border/10 rounded-2xl flex flex-col gap-2">
                    <h4 className="font-extrabold text-primary-dark text-sm border-b border-gray-100 pb-1.5">Registration Drop-off rate</h4>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">Initiated Drafts:</span>
                      <span className="font-bold text-gray-700">12 Teams</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completed Profiles:</span>
                      <span className="font-bold text-gray-700">{teams.length} Teams</span>
                    </div>
                    <div className="flex justify-between text-primary-green font-bold mt-1 border-t border-gray-100 pt-1">
                      <span>Conversion Rate:</span>
                      <span>{((teams.length / 12) * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div className="p-5 bg-card-bg/25 border border-input-border/10 rounded-2xl flex flex-col gap-2">
                    <h4 className="font-extrabold text-primary-dark text-sm border-b border-gray-100 pb-1.5">Evaluation stats</h4>
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-500">Final Submissions:</span>
                      <span className="font-bold text-gray-700">{teams.filter((t) => t.submitted).length} Teams</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Graded submissions:</span>
                      <span className="font-bold text-gray-700">
                        {teams.filter((t) => t.evaluations && t.evaluations.length > 0).length} Teams
                      </span>
                    </div>
                    <div className="flex justify-between text-primary-green font-bold mt-1 border-t border-gray-100 pt-1">
                      <span>Grading Progress:</span>
                      <span>
                        {teams.filter((t) => t.submitted).length > 0
                          ? `${((teams.filter((t) => t.evaluations && t.evaluations.length > 0).length / teams.filter((t) => t.submitted).length) * 100).toFixed(0)}%`
                          : "0%"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SETTINGS TAB ==================== */}
            {activeTab === "settings" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col gap-6 max-w-xl">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                  <Settings className="h-5 w-5 text-primary-green" /> Portal Preferences
                </h3>
                <div className="flex flex-col gap-4 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">Auto approve SIET domain</p>
                      <p className="text-gray-400 font-normal">Automatically validate participants registry with siet.ac.in emails.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-input-border text-primary-green focus:ring-primary-green h-4.5 w-4.5 cursor-pointer" />
                  </div>
                  <Button
                    onClick={() => {
                      toast("Preferences saved.", "success");
                    }}
                    className="mt-2 text-xs"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </PageWrapper>
  );
}
