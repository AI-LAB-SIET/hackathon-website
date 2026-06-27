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
  Users,
  Calendar,
  MessageSquare,
  Settings,
  ExternalLink,
  Plus,
  Clock,
  Trash2,
  Bell,
} from "lucide-react";
import { Team } from "@/types";

export default function MentorDashboard() {
  const router = useRouter();
  const { session, teams, notifications, markNotificationRead, markAllNotificationsRead, addMentorFeedback } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);

  // Selection state for feedback
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [feedbackText, setFeedbackText] = useState<string>("");

  // Schedule slot state
  const [slot, setSlot] = useState({ date: "", time: "", link: "", description: "" });
  const [schedules, setSchedules] = useState([
    { id: "slot-1", teamName: "Abhishek's Team", date: "July 05", time: "11:00 AM", link: "https://meet.google.com/siet-rag-mentor", desc: "Code review: context DB limits" }
  ]);

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "mentor")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "mentor") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500">
        Loading mentor desk...
      </div>
    );
  }

  // Active teams (APPROVED status)
  const assignedTeams = teams.filter((t) => t.status === "APPROVED");
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleStartFeedback = (team: Team) => {
    setSelectedTeamId(team.id);
    setFeedbackText("");
    setActiveTab("feedback");
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !feedbackText.trim()) {
      toast("Please select a team and enter feedback text.", "error");
      return;
    }
    addMentorFeedback(selectedTeamId, {
      author: session.email || "mentor@college.edu",
      feedback: feedbackText
    });
    toast("Mentor review published and logged in the team room.", "success");
    setActiveTab("dashboard");
    setSelectedTeamId("");
  };

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot.date || !slot.time || !slot.link) {
      toast("Please specify date, time and Google Meet link.", "error");
      return;
    }
    const chosenTeam = assignedTeams.find((t) => t.id === selectedTeamId)?.name || "General Slot";
    const newSlot = {
      id: `slot-${Date.now()}`,
      teamName: chosenTeam,
      date: slot.date,
      time: slot.time,
      link: slot.link,
      desc: slot.description
    };
    setSchedules([...schedules, newSlot]);
    toast("Virtual Office hour scheduled and broadcasted to team.", "success");
    setSlot({ date: "", time: "", link: "", description: "" });
    setSelectedTeamId("");
  };

  const handleDeleteSlot = (id: string) => {
    setSchedules(schedules.filter((s) => s.id !== id));
    toast("Virtual meeting slot deleted.", "info");
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "teams", label: "Assigned Teams" },
            { id: "schedules", label: "Schedules" },
            { id: "feedback", label: "Feedback Logs" },
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
              {activeTab === "dashboard" ? "Mentor Office" : activeTab.replace("-", " ")}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Logged in as: <strong>{session.email}</strong> | Role: {session.role?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-primary-green hover:text-primary-green transition-colors cursor-pointer"
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
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <span className="font-bold text-sm text-primary-dark">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={() => { markAllNotificationsRead(); toast("All notifications marked as read", "info"); }}
                          className="text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                        >Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 && <div className="px-4 py-6 text-center text-sm text-gray-400">No notifications</div>}
                      {notifications.slice(0, 10).map((n) => (
                        <div key={n.id} onClick={() => markNotificationRead(n.id)}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "bg-emerald-50/50" : ""}`}
                        >
                          <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.read ? "bg-primary-green" : "bg-gray-300"}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-semibold ${!n.read ? "text-primary-dark" : "text-gray-500"}`}>{n.title}</div>
                            <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{n.body}</div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: "Assigned Teams", val: assignedTeams.length, icon: <Users className="h-5 w-5" /> },
                    { label: "Scheduled Hours", val: schedules.length, icon: <Calendar className="h-5 w-5 text-emerald-600" /> },
                    { label: "Pending Reviews", val: assignedTeams.length, icon: <Clock className="h-5 w-5 text-amber-500" /> },
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

                {/* Schedules queue list */}
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                    <Calendar className="h-4.5 w-4.5 text-primary-green" /> Virtual Office Hour Sessions
                  </h3>
                  <div className="flex flex-col gap-3">
                    {schedules.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-gray-100 bg-white text-xs">
                        <div>
                          <p className="font-bold text-gray-800">{item.teamName}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{item.date} at {item.time} | {item.desc}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-primary-green text-[10px] font-bold border border-primary-green/20"
                          >
                            Join Meet <ExternalLink className="h-3 w-3" />
                          </a>
                          <button
                            onClick={() => handleDeleteSlot(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 border-0 bg-transparent cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {schedules.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No scheduled hours. Select schedules tab to add slots.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ASSIGNED TEAMS TAB ==================== */}
            {activeTab === "teams" && (
              <div className="flex flex-col gap-6">
                {assignedTeams.map((team) => (
                  <div key={team.id} className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-primary-dark">{team.name}</h3>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Teammates: {team.members.map((m) => m.name).join(", ")}</p>
                      </div>
                      <Badge variant="success">Approved</Badge>
                    </div>

                    <div className="p-4 rounded-2xl bg-card-bg/25 border border-input-border/10 text-xs">
                      <p className="font-bold text-gray-700">Project Concept:</p>
                      <p className="text-gray-500 leading-relaxed font-semibold mt-1">
                        {team.projectDescription || "No concept summary declared by team."}
                      </p>
                    </div>

                    {team.milestonesProgress && (
                      <div className="flex flex-col gap-1.5 text-xs">
                        <span className="font-bold text-gray-700">Milestones Cleared:</span>
                        <div className="flex flex-wrap gap-2">
                          {team.milestonesProgress.map((m) => (
                            <span key={m.id} className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              m.completed 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : "bg-gray-50 text-gray-400 border-gray-200"
                            }`}>
                              {m.title}: {m.completed ? "Done" : "Ongoing"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleStartFeedback(team)}
                        className="px-4 py-2 rounded-xl bg-primary-green hover:bg-primary-green/90 text-white text-xs font-bold cursor-pointer"
                      >
                        Publish Feedback
                      </button>
                    </div>
                  </div>
                ))}
                {assignedTeams.length === 0 && (
                  <div className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-white">
                    <p className="text-xs text-gray-400 italic">No assigned teams found.</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== SCHEDULES TAB ==================== */}
            {activeTab === "schedules" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form scheduler (Left columns) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary-green" /> Schedule Meeting Slot
                    </h3>
                    
                    <form onSubmit={handleCreateSlot} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="font-bold text-gray-700">Target Team</label>
                        <select
                          value={selectedTeamId}
                          onChange={(e) => setSelectedTeamId(e.target.value)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg border border-input-border bg-white cursor-pointer"
                        >
                          <option value="">All Teams (General)</option>
                          {assignedTeams.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <Input
                        label="Meeting Date"
                        placeholder="e.g. July 05"
                        value={slot.date}
                        onChange={(e) => setSlot({ ...slot, date: e.target.value })}
                      />

                      <Input
                        label="Meeting Time"
                        placeholder="e.g. 11:00 AM"
                        value={slot.time}
                        onChange={(e) => setSlot({ ...slot, time: e.target.value })}
                      />

                      <Input
                        label="Google Meet Link"
                        placeholder="https://meet.google.com/..."
                        value={slot.link}
                        onChange={(e) => setSlot({ ...slot, link: e.target.value })}
                      />

                      <div className="sm:col-span-2 flex flex-col gap-1.5 text-xs">
                        <label className="font-bold text-gray-700">Agenda / Discussion description</label>
                        <textarea
                          rows={2}
                          value={slot.description}
                          onChange={(e) => setSlot({ ...slot, description: e.target.value })}
                          placeholder="e.g. Discuss Database schemas and API keys sandbox"
                          className="w-full px-4 py-2 text-xs rounded-xl border border-input-border focus:ring-1 focus:ring-primary-green focus:outline-none"
                        />
                      </div>

                      <Button type="submit" className="sm:col-span-2 text-xs mt-2">
                        Schedule Slot
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Details calendar (Right column) */}
                <div className="flex flex-col gap-6">
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-extrabold text-primary-dark uppercase tracking-wider border-b border-gray-150 pb-2">Working Guideline</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Please schedule virtual reviews to assist students with RAG implementation errors. All slots are synchronized directly with the participant&apos;s Dashboard calendar.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== FEEDBACK LOGS TAB ==================== */}
            {activeTab === "feedback" && (
              <div className="max-w-2xl rounded-3xl border border-input-border/30 bg-white p-5 sm:p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-6">
                  <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary-green" /> Write Mentor Feedback
                  </h3>
                  {selectedTeamId && (
                    <span className="text-xs font-bold text-primary-green">
                      Team: {teams.find((t) => t.id === selectedTeamId)?.name}
                    </span>
                  )}
                </div>

                {!selectedTeamId ? (
                  <div className="py-8 text-center text-xs text-gray-400 italic">
                      Please select a team to review from the &quot;Assigned Teams&quot; tab first.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="font-bold text-gray-700">Detailed Feedback & Recommendations</label>
                      <textarea
                        rows={6}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Input guidance regarding context RAG models, query safety checks or slides presentation guidelines..."
                        className="w-full px-4 py-3 rounded-xl border border-input-border focus:ring-1 focus:ring-primary-green focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 justify-end mt-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setSelectedTeamId("");
                          setActiveTab("dashboard");
                        }}
                        className="bg-gray-150 text-gray-700 hover:bg-gray-200 border-0 text-xs px-4"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" className="text-xs px-5">
                        Publish Review Feedback
                      </Button>
                    </div>
                  </form>
                )}
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
                      <p className="text-gray-800">New Team Alerts</p>
                      <p className="text-gray-400 font-normal">Alert when new approved teams are assigned to my mentor board.</p>
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
