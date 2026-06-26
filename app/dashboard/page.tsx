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
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Layers,
  ExternalLink,
  Users,
  Send,
  Github,
  Video,
  UserPlus,
  Trash2,
  Award,
  Settings,
  HelpCircle,
  MessageSquare,
  Search,
  CheckSquare,
  AlertCircle,
  Plus,
  Inbox
} from "lucide-react";
import { Participant } from "@/types";

export default function ParticipantDashboard() {
  const router = useRouter();
  const { session, teams, announcements, updateProjectDetails, updateTeamMembers, updateMilestoneProgress } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("home");

  // Local inputs
  const [newMember, setNewMember] = useState<Participant>({
    name: "",
    registerNumber: "",
    email: "",
    phone: "",
    department: "Information Technology",
    year: "III",
    skills: [],
    isLeader: false
  });
  const [newSkill, setNewSkill] = useState("");
  const [editProject, setEditProject] = useState({
    name: "",
    projectDescription: "",
    githubUrl: "",
    videoUrl: "",
    demoUrl: "",
    aiDisclosure: ""
  });
  const [chatMessage, setChatMessage] = useState("");
  const [chatLogs, setChatLogs] = useState([
    { author: "Abhishek", text: "Hey team, did we finalize the RAG system architecture?", time: "10:15 AM" },
    { author: "Siddharth", text: "Yes, I uploaded the design block to the Shared Files folder.", time: "10:18 AM" },
    { author: "Dr. A. Rajesh (Mentor)", text: "Ensure safety checks on RAG database context limits.", time: "12:05 PM" }
  ]);
  const [supportTicket, setSupportTicket] = useState({ subject: "", desc: "" });
  const [searchAnn, setSearchAnn] = useState("");
  const [annFilter, setAnnFilter] = useState<"all" | "info" | "warning" | "success">("all");

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "participant")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  // Sync edit project inputs when userTeam changes
  const userTeam = teams.find((t) => t.id === session.teamId);
  useEffect(() => {
    if (userTeam) {
      setEditProject({
        name: userTeam.name,
        projectDescription: userTeam.projectDescription || "",
        githubUrl: userTeam.githubUrl || "",
        videoUrl: userTeam.videoUrl || "",
        demoUrl: userTeam.demoUrl || "",
        aiDisclosure: userTeam.aiDisclosure || ""
      });
    }
  }, [userTeam]);

  if (!mounted || !session.isLoggedIn || session.role !== "participant") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500">
        Loading workspace...
      </div>
    );
  }

  if (!userTeam) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-red-500">
        Team profile not found. Try logging in again.
      </div>
    );
  }



  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          icon: <CheckCircle className="h-10 w-10 text-emerald-600 animate-bounce-slow" />,
          title: "Registration Approved",
          desc: "Your team profile has been successfully audited against the college logs. You are eligible to participate in the physical coding sprint on July 18th.",
          badge: <Badge variant="success" pulse>Approved</Badge>,
          bg: "bg-emerald-50/30 border-emerald-100",
        };
      case "REJECTED":
        return {
          icon: <AlertTriangle className="h-10 w-10 text-red-600" />,
          title: "Registration Rejected",
          desc: "Your registration was flagged by the administrative council due to duplicate credentials or missing details. Reach out to the lab desk immediately.",
          badge: <Badge variant="danger">Rejected</Badge>,
          bg: "bg-red-50/30 border-red-100",
        };
      default:
        return {
          icon: <Clock className="h-10 w-10 text-amber-600 animate-pulse" />,
          title: "Audit in Progress",
          desc: "Your team registry is currently undergoing a credentials check with the SIET administration database. We will update your status shortly.",
          badge: <Badge variant="warning" pulse>Pending Audit</Badge>,
          bg: "bg-amber-50/20 border-amber-150",
        };
    }
  };

  const statusConfig = getStatusConfig(userTeam.status);

  // Gamified progress percentage
  const calculateProgress = () => {
    let score = 0;
    if (userTeam.status === "APPROVED") score += 25;
    if (userTeam.members.length >= 2) score += 25;
    if (userTeam.githubUrl && userTeam.projectDescription) score += 25;
    if (userTeam.submitted) score += 25;
    return score;
  };
  const progressPercent = calculateProgress();

  // Action: Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.registerNumber || !newMember.email) {
      toast("Please fill name, register number and email.", "error");
      return;
    }
    if (userTeam.members.length >= 4) {
      toast("Maximum team size is 4 members.", "error");
      return;
    }
    const updated = [...userTeam.members, newMember];
    updateTeamMembers(userTeam.id, updated);
    toast(`Added teammate: ${newMember.name}`, "success");
    setNewMember({
      name: "",
      registerNumber: "",
      email: "",
      phone: "",
      department: "Information Technology",
      year: "III",
      skills: [],
      isLeader: false
    });
  };

  // Action: Remove Member
  const handleRemoveMember = (emailToRemove: string) => {
    const updated = userTeam.members.filter((m) => m.email !== emailToRemove);
    updateTeamMembers(userTeam.id, updated);
    toast("Teammate removed from roster.", "info");
  };

  // Action: Update Project Details
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    updateProjectDetails(userTeam.id, editProject);
    toast("Project configuration saved successfully.", "success");
  };

  // Action: Submit Project Final Deliverables
  const handleSubmitDeliverables = () => {
    if (!editProject.githubUrl) {
      toast("Please configure the GitHub Repository link first.", "error");
      return;
    }
    updateProjectDetails(userTeam.id, {
      ...editProject,
      submitted: true,
      submittedAt: new Date().toISOString()
    });
    toast("Project final deliverables submitted to judges evaluation queue!", "success");
  };

  // Action: Send Team Message
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatLogs([...chatLogs, { author: session.email?.split("@")[0] || "Me", text: chatMessage, time: "Just now" }]);
    setChatMessage("");
    toast("Message posted to team channel.", "success");
  };

  // Action: Submit Support Ticket
  const handleRaiseTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportTicket.subject || !supportTicket.desc) {
      toast("Please fill in the subject and description.", "error");
      return;
    }
    toast(`Ticket #${Math.floor(Math.random() * 9000 + 1000)} created! An organizer will check shortly.`, "success");
    setSupportTicket({ subject: "", desc: "" });
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar for desktop */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        
        {/* Mobile Horizontal Navigation Header */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {[
            { id: "home", label: "Home" },
            { id: "team", label: "My Team" },
            { id: "project", label: "Project" },
            { id: "deliverables", label: "Deliverables" },
            { id: "timeline", label: "Timeline" },
            { id: "resources", label: "Resources" },
            { id: "announcements", label: "Announcements" },
            { id: "messages", label: "Messages" },
            { id: "support", label: "Support" },
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

        {/* Tab Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight capitalize">
              {activeTab === "home" ? "Mission Control" : activeTab.replace("-", " ")}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Workspace of <strong>{userTeam.name}</strong> | Role: {session.role?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-bold hidden sm:inline">
              Team ID: <code className="text-primary-green bg-card-bg px-2 py-1 rounded border border-input-border/25">{userTeam.id}</code>
            </span>
          </div>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            
            {/* ==================== HOME TAB ==================== */}
            {activeTab === "home" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Columns */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Status Roster Audits */}
                  <div className={`rounded-3xl border p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 bg-white shadow-sm ${statusConfig.bg}`}>
                    <div className="shrink-0">{statusConfig.icon}</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-bold text-primary-dark">{statusConfig.title}</h3>
                        {statusConfig.badge}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl font-semibold">
                        {statusConfig.desc}
                      </p>
                      {userTeam.status === "APPROVED" && (
                        <div className="flex gap-4 mt-2">
                          <button
                            onClick={() => {
                              toast("GPU credit tokens: SIET-AILAB-2026X4-CLAUDE", "info");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-green hover:underline cursor-pointer bg-transparent border-0"
                          >
                            Claim Cloud GPU Token <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="p-6 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-primary-dark">Hackathon Milestones Completed</span>
                      <span className="text-xs font-extrabold text-primary-green">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-150 h-3 rounded-full overflow-hidden">
                      <div className="bg-primary-green h-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center text-[9px] font-bold text-gray-400 mt-1">
                      <span className={userTeam.status === "APPROVED" ? "text-primary-green" : ""}>1. Approval</span>
                      <span className={userTeam.members.length >= 2 ? "text-primary-green" : ""}>2. Teammates</span>
                      <span className={userTeam.githubUrl ? "text-primary-green" : ""}>3. Repository</span>
                      <span className={userTeam.submitted ? "text-primary-green" : ""}>4. Submission</span>
                    </div>
                  </div>

                  {/* Checklist and Action list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Checklist of Tasks */}
                    <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                        <CheckSquare className="h-4.5 w-4.5 text-primary-green" /> Today&apos;s Action Checklist
                      </h3>
                      <div className="flex flex-col gap-3">
                        {[
                          { label: "Verify Team Registry", done: userTeam.status === "APPROVED" },
                          { label: "Invite at least 2 members", done: userTeam.members.length >= 2 },
                          { label: "Link GitHub repository", done: !!userTeam.githubUrl },
                          { label: "Submit Final Presentation deck", done: !!userTeam.submitted }
                        ].map((tsk, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-[10px] ${
                              tsk.done ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-400"
                            }`}>
                              ✓
                            </span>
                            <span className={`font-semibold ${tsk.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                              {tsk.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Upcoming Deadlines */}
                    <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                        <Clock className="h-4.5 w-4.5 text-primary-green" /> Deadlines & Timers
                      </h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700">Team approvals end:</span>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-100">Tomorrow</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700">Mid-term RAG Checkpoint:</span>
                          <span className="text-gray-500 font-semibold">July 10th</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-gray-700">Final Deliverables sprint:</span>
                          <span className="text-primary-green font-extrabold">July 18th (Live)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (Pinned Announcements) */}
                <div className="flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 shadow-sm flex flex-col gap-4 max-h-[500px] overflow-hidden">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-100 pb-2">
                      <Bell className="h-4.5 w-4.5 text-primary-green" /> Recent Broadcasts
                    </h3>
                    <div className="flex flex-col gap-3.5 overflow-y-auto pr-1">
                      {announcements.slice(0, 3).map((ann) => (
                        <div key={ann.id} className="p-3.5 rounded-2xl border border-gray-100 bg-card-bg/20 flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] uppercase font-bold tracking-widest ${
                              ann.type === "warning" ? "text-amber-700" : ann.type === "success" ? "text-emerald-700" : "text-blue-700"
                            }`}>
                              {ann.type}
                            </span>
                            <span className="text-[8px] text-gray-400 font-semibold">{ann.date}</span>
                          </div>
                          <h4 className="font-extrabold text-primary-dark leading-tight">{ann.title}</h4>
                          <p className="text-[11px] text-gray-500 leading-relaxed truncate">{ann.content}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => setActiveTab("announcements")}
                        className="text-xs font-bold text-primary-green hover:underline cursor-pointer border-0 bg-transparent text-center pt-1"
                      >
                        View all announcements ({announcements.length})
                      </button>
                    </div>
                  </div>

                  {/* Mentor Feedback Peek */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-extrabold text-primary-dark uppercase tracking-wider">Latest Mentor Feedback</h3>
                    {userTeam.mentorFeedbacks && userTeam.mentorFeedbacks.length > 0 ? (
                      <div className="p-3 rounded-2xl bg-amber-50/30 border border-amber-100 text-xs">
                        <p className="font-bold text-gray-700">{userTeam.mentorFeedbacks[0].author}</p>
                        <p className="text-gray-500 italic mt-1">&quot;{userTeam.mentorFeedbacks[0].feedback}&quot;</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No feedback submitted by assigned mentors yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== MY TEAM TAB ==================== */}
            {activeTab === "team" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Roster management (Left columns) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  
                  {/* Members list */}
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary-green" /> Teammates Roster ({userTeam.members.length}/4)
                    </h3>
                    
                    <div className="flex flex-col gap-3.5">
                      {userTeam.members.map((member, index) => (
                        <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-input-border/20 transition-all">
                          <div className="flex items-center gap-3">
                            <Avatar name={member.name} size="sm" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary-dark">{member.name}</span>
                                {member.isLeader && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-primary-green text-[9px] font-extrabold border border-primary-green/20">Leader</span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400 font-semibold">{member.registerNumber} | {member.department} ({member.year} Yr)</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {member.skills.map((sk, skIdx) => (
                              <span key={skIdx} className="px-1.5 py-0.5 bg-card-bg text-primary-dark rounded text-[9px] font-bold border border-input-border/10">{sk}</span>
                            ))}
                          </div>
                          {!member.isLeader && (
                            <button
                              onClick={() => handleRemoveMember(member.email)}
                              className="text-xs text-red-600 hover:text-red-700 cursor-pointer p-1 rounded hover:bg-red-50 border-0 bg-transparent self-end sm:self-auto"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Teammate Form */}
                  {userTeam.members.length < 4 && (
                    <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                      <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2">
                        <UserPlus className="h-4.5 w-4.5 text-primary-green" /> Register New Teammate
                      </h3>
                      
                      <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Full Name"
                          placeholder="e.g. Abhishek Sharma"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        />
                        <Input
                          label="University Register Number"
                          placeholder="e.g. 711721104001"
                          value={newMember.registerNumber}
                          onChange={(e) => setNewMember({ ...newMember, registerNumber: e.target.value })}
                        />
                        <Input
                          label="College Email ID"
                          placeholder="email@college.edu"
                          type="email"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        />
                        <Input
                          label="Mobile Contact"
                          placeholder="10-digit number"
                          value={newMember.phone}
                          onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                        />
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-primary-dark">Department</label>
                          <select
                            value={newMember.department}
                            onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-input-border bg-white cursor-pointer"
                          >
                            <option value="Information Technology">Information Technology</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Artificial Intelligence">Artificial Intelligence</option>
                            <option value="Electronics & Communication">Electronics & Comm</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-primary-dark">Academic Year</label>
                          <select
                            value={newMember.year}
                            onChange={(e) => setNewMember({ ...newMember, year: e.target.value })}
                            className="px-3 py-2 text-xs font-semibold rounded-lg border border-input-border bg-white cursor-pointer"
                          >
                            <option value="I">1st Year</option>
                            <option value="II">2nd Year</option>
                            <option value="III">3rd Year</option>
                            <option value="IV">4th Year</option>
                          </select>
                        </div>

                        {/* Teammate Skills Input */}
                        <div className="sm:col-span-2 flex flex-col gap-2">
                          <label className="text-xs font-semibold text-primary-dark">Competence / Skills</label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="e.g. Next.js, Python, RAG"
                              value={newSkill}
                              onChange={(e) => setNewSkill(e.target.value)}
                              error={undefined}
                            />
                            <Button
                              type="button"
                              onClick={() => {
                                if (newSkill.trim()) {
                                  setNewMember({
                                    ...newMember,
                                    skills: [...newMember.skills, newSkill.trim()]
                                  });
                                  setNewSkill("");
                                }
                              }}
                              className="px-3"
                            >
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {newMember.skills.map((sk, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-primary-green/10 text-primary-green rounded text-[9px] font-bold border border-primary-green/20 flex items-center gap-1">
                                {sk}
                                <button
                                  type="button"
                                  onClick={() => setNewMember({
                                    ...newMember,
                                    skills: newMember.skills.filter((s) => s !== sk)
                                  })}
                                  className="text-red-600 hover:text-red-700 bg-transparent border-0 font-bold"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <Button type="submit" className="sm:col-span-2 mt-2 gap-1 text-xs">
                          <Plus className="h-4.5 w-4.5" /> Save Teammate Profile
                        </Button>
                      </form>
                    </div>
                  )}
                </div>

                {/* Team Activity and Shared files (Right Column) */}
                <div className="flex flex-col gap-6">
                  {/* Simulated Chat */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-4 max-h-[380px]">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                      <MessageSquare className="h-4.5 w-4.5 text-primary-green" /> Team Chat Room
                    </h3>
                    
                    <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin">
                      {chatLogs.map((c, idx) => (
                        <div key={idx} className="text-xs bg-card-bg/20 p-2.5 rounded-xl border border-gray-100 flex flex-col gap-0.5">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-primary-dark">{c.author}</span>
                            <span className="text-[8px] text-gray-400 font-semibold">{c.time}</span>
                          </div>
                          <p className="text-gray-600">{c.text}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input
                        placeholder="Say something to team..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-input-border text-xs focus:ring-1 focus:ring-primary-green focus:outline-none"
                      />
                      <Button type="submit" className="px-3">
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>

                  {/* Shared Files manager */}
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-extrabold text-primary-dark uppercase tracking-wider border-b border-gray-150 pb-1.5">Shared Team Assets</h3>
                    <div className="flex flex-col gap-2">
                      {[
                        { name: "RAG Architecture Diagram.png", size: "1.4 MB", ext: "IMG" },
                        { name: "Pitch Slide Draft.pptx", size: "4.8 MB", ext: "PPT" },
                        { name: "Sample Context Datasets.csv", size: "12 KB", ext: "CSV" }
                      ].map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 rounded-xl bg-card-bg/25 border border-input-border/10">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-primary-green/10 text-primary-green text-[9px] font-bold">{file.ext}</span>
                            <span className="font-semibold text-gray-700 truncate max-w-[120px]">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-bold">{file.size}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => toast("Drag & Drop is simulated. File successfully uploaded.", "success")}
                      className="mt-2 w-full py-2 border border-dashed border-input-border/60 hover:border-primary-green rounded-xl text-[10px] font-bold text-gray-500 hover:text-primary-green transition-all cursor-pointer"
                    >
                      + Upload New Asset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PROJECT CONFIG TAB ==================== */}
            {activeTab === "project" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form configuration (Left columns) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-primary-green" /> Build & Project Context
                    </h3>
                    
                    <form onSubmit={handleSaveProject} className="flex flex-col gap-4">
                      <Input
                        label="Project Title"
                        value={editProject.name}
                        onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                      />
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-primary-dark">Project Abstract / Summary</label>
                        <textarea
                          rows={4}
                          value={editProject.projectDescription}
                          onChange={(e) => setEditProject({ ...editProject, projectDescription: e.target.value })}
                          placeholder="Describe the problem, the core AI/ML stack, and how the RAG context evaluates queries."
                          className="w-full px-4 py-3 rounded-xl border border-input-border focus:ring-2 focus:ring-primary-green focus:border-primary-green focus:outline-none text-xs text-gray-800"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="GitHub Code Repository"
                          placeholder="https://github.com/..."
                          value={editProject.githubUrl}
                          onChange={(e) => setEditProject({ ...editProject, githubUrl: e.target.value })}
                        />
                        <Input
                          label="Live Hosted Demo URL"
                          placeholder="https://your-demo.vercel.app"
                          value={editProject.demoUrl}
                          onChange={(e) => setEditProject({ ...editProject, demoUrl: e.target.value })}
                        />
                        <Input
                          label="Pitch Presentation / Video URL"
                          placeholder="https://youtube.com/watch?v=..."
                          value={editProject.videoUrl}
                          onChange={(e) => setEditProject({ ...editProject, videoUrl: e.target.value })}
                        />
                        <Input
                          label="AI Models & Assist Disclosure"
                          placeholder="Claude 3.5, GPT-4o, Llama 3 etc."
                          value={editProject.aiDisclosure}
                          onChange={(e) => setEditProject({ ...editProject, aiDisclosure: e.target.value })}
                        />
                      </div>

                      <Button type="submit" className="mt-2 text-xs">
                        Save Configurations
                      </Button>
                    </form>
                  </div>
                </div>

                {/* Milestones checklists (Right column) */}
                <div className="flex flex-col gap-6">
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                      <Layers className="h-4.5 w-4.5 text-primary-green" /> Workspace Milestones
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      {userTeam.milestonesProgress?.map((m) => (
                        <div key={m.id} className="flex items-start gap-3 text-xs">
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={(e) => {
                              updateMilestoneProgress(userTeam.id, m.id, e.target.checked);
                              toast(`Milestone status updated!`, "success");
                            }}
                            className="rounded border-input-border text-primary-green focus:ring-primary-green h-4 w-4 cursor-pointer mt-0.5"
                          />
                          <div className="flex flex-col">
                            <span className={`font-bold ${m.completed ? "text-primary-green line-through" : "text-primary-dark"}`}>{m.title}</span>
                            <span className="text-[10px] text-gray-400 font-semibold">{m.completed ? "Cleared" : "Ongoing check"}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== DELIVERABLES SUBMISSION TAB ==================== */}
            {activeTab === "deliverables" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Submission Form (Left column) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-primary-green" /> Pitch Submission Office
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                      Ensure your code repository is public and contains the presentation file in the root folder. The evaluation panel will review directly.
                    </p>

                    <div className="p-4 rounded-2xl bg-card-bg/25 border border-input-border/10 text-xs flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-gray-700">Submission Status:</span>
                        {userTeam.submitted ? (
                          <Badge variant="success">Submitted</Badge>
                        ) : (
                          <Badge variant="warning">Draft Checklist</Badge>
                        )}
                      </div>
                      {userTeam.submittedAt && (
                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                          <span>Timestamp:</span>
                          <span>{new Date(userTeam.submittedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3 mt-2 text-xs">
                      <h4 className="font-extrabold text-primary-dark border-b border-gray-100 pb-1">Submitting Assets:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-white border border-gray-150 rounded-xl flex items-center gap-2">
                          <Github className="h-4.5 w-4.5 text-gray-600" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-[10px] text-gray-400 uppercase">Code Repository</p>
                            <p className="font-semibold text-gray-700 truncate text-[11px]">{editProject.githubUrl || "Not configured"}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-white border border-gray-150 rounded-xl flex items-center gap-2">
                          <Video className="h-4.5 w-4.5 text-red-600" />
                          <div className="overflow-hidden">
                            <p className="font-bold text-[10px] text-gray-400 uppercase">Pitch Deck/Video</p>
                            <p className="font-semibold text-gray-700 truncate text-[11px]">{editProject.videoUrl || "Not configured"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmitDeliverables}
                      className="mt-4 py-3 text-xs"
                      disabled={userTeam.submitted}
                    >
                      {userTeam.submitted ? "Submission Locked (Under Review)" : "Publish Final Submission"}
                    </Button>
                  </div>
                </div>

                {/* Score Rubric Feedback (Right column) */}
                <div className="flex flex-col gap-6">
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                      <Award className="h-4.5 w-4.5 text-primary-green" /> Judging Evaluation Scores
                    </h3>
                    
                    {userTeam.evaluations && userTeam.evaluations.length > 0 ? (
                      userTeam.evaluations.map((ev, idx) => {
                        const avg = ((ev.innovation + ev.feasibility + ev.presentation) / 3).toFixed(1);
                        return (
                          <div key={idx} className="flex flex-col gap-3 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-gray-700">Judge Panel Score:</span>
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-primary-green font-extrabold text-sm border border-primary-green/25">
                                {avg} / 10
                              </span>
                            </div>
                            <div className="flex flex-col gap-2 mt-1">
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Innovation:</span>
                                <span className="font-bold text-primary-dark">{ev.innovation}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Feasibility:</span>
                                <span className="font-bold text-primary-dark">{ev.feasibility}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500 font-semibold">Presentation:</span>
                                <span className="font-bold text-primary-dark">{ev.presentation}/10</span>
                              </div>
                            </div>
                            <div className="mt-2 p-3 bg-card-bg/30 border border-input-border/10 rounded-xl">
                              <p className="font-bold text-gray-800 text-[10px] uppercase">Review Comment:</p>
                              <p className="text-gray-500 italic mt-0.5 leading-relaxed">&quot;{ev.feedback}&quot;</p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 italic">No score evaluations published by judges panel yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== TIMELINE TAB ==================== */}
            {activeTab === "timeline" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-8 shadow-sm flex flex-col gap-6">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-3">
                  <Calendar className="h-5 w-5 text-primary-green" /> Coding Sprint Timeline
                </h3>
                
                <div className="relative border-l border-gray-200 ml-4 flex flex-col gap-8 py-2">
                  {[
                    { title: "Team Registry Audits", time: "July 01", desc: "Student credentials verification and team matching.", status: "completed" },
                    { title: "AI Mentor Reviews & GPU claim", time: "July 05", desc: "Coordinators allocate Cloud server credits tokens.", status: "ongoing" },
                    { title: "Mid-way Abstract submission", time: "July 10", desc: "Submit project RAG model documentation file.", status: "upcoming" },
                    { title: "Hackathon Coding Sprint", time: "July 18", desc: "24-hour physical prototyping sprint inside SIET Lab.", status: "upcoming" }
                  ].map((evt, idx) => (
                    <div key={idx} className="relative pl-6">
                      <span className={`absolute left-0 -translate-x-1/2 top-1.5 h-4.5 w-4.5 rounded-full border-4 border-white ${
                        evt.status === "completed" 
                          ? "bg-emerald-500" 
                          : evt.status === "ongoing" 
                          ? "bg-amber-500 animate-pulse" 
                          : "bg-gray-300"
                      }`} />
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase">{evt.time}</span>
                        <h4 className="font-bold text-primary-dark">{evt.title}</h4>
                        <p className="text-gray-500 max-w-lg leading-relaxed mt-0.5">{evt.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== RESOURCES TAB ==================== */}
            {activeTab === "resources" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "Slide Presentation Deck", type: "Google Slides Template", desc: "Pre-designed outline featuring Innovation, tech architecture, and team slides.", action: "Download Template" },
                  { title: "FastAPI + Claude Starter", type: "GitHub Repository", desc: "Boilerplate setup to query Anthropic API with standard security middlewares.", action: "Fork Repository" },
                  { title: "Claim GPU Credits Board", type: "SIET Lab Tokens", desc: "Redeem 100$ credits for Anthropic and OpenAI sandboxes.", action: "Reveal Token" },
                  { title: "Student RAG Datasets", type: "L&T bypass traffic logs", desc: "Pre-cleaned CSV file representing traffic flows for predictive modeling.", action: "Download Dataset" }
                ].map((res, idx) => (
                  <div key={idx} className="p-5 rounded-3xl border border-input-border/30 bg-white hover:border-primary-green transition-all shadow-sm flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-[10px] text-primary-green uppercase font-bold tracking-wider">{res.type}</span>
                      <h4 className="font-extrabold text-primary-dark">{res.title}</h4>
                      <p className="text-gray-500 leading-relaxed font-semibold mt-0.5">{res.desc}</p>
                    </div>
                    <Button
                      onClick={() => {
                        toast(`Access link dispatched!`, "success");
                      }}
                      className="w-full text-xs"
                    >
                      {res.action}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* ==================== ANNOUNCEMENTS TAB ==================== */}
            {activeTab === "announcements" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-3">
                  <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary-green" /> Broadcast Board ({announcements.length})
                  </h3>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        placeholder="Search broadcasts..."
                        value={searchAnn}
                        onChange={(e) => setSearchAnn(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-input-border text-xs rounded-xl focus:ring-1 focus:ring-primary-green focus:outline-none w-full"
                      />
                    </div>
                    <select
                      value={annFilter}
                      onChange={(e) => setAnnFilter(e.target.value as "all" | "info" | "warning" | "success")}
                      className="px-3 py-2 border border-input-border rounded-xl text-xs font-semibold cursor-pointer bg-white"
                    >
                      <option value="all">All levels</option>
                      <option value="info">Info only</option>
                      <option value="warning">Warnings</option>
                      <option value="success">Bulletins</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {announcements
                    .filter((ann) => annFilter === "all" || ann.type === annFilter)
                    .filter((ann) => ann.title.toLowerCase().includes(searchAnn.toLowerCase()) || ann.content.toLowerCase().includes(searchAnn.toLowerCase()))
                    .map((ann) => (
                      <div key={ann.id} className={`p-4 rounded-2xl border flex gap-4 items-start transition-all ${
                        ann.type === "warning" 
                          ? "bg-amber-50/20 border-amber-100" 
                          : ann.type === "success" 
                          ? "bg-emerald-50/20 border-emerald-100" 
                          : "bg-blue-50/20 border-blue-100"
                      }`}>
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          ann.type === "warning" 
                            ? "bg-amber-50 text-amber-700 border-amber-250" 
                            : ann.type === "success" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-250" 
                            : "bg-blue-50 text-blue-700 border-blue-250"
                        }`}>
                          <AlertCircle className="h-4.5 w-4.5" />
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] uppercase tracking-widest font-extrabold text-gray-400">{ann.date}</span>
                          </div>
                          <h4 className="font-extrabold text-primary-dark">{ann.title}</h4>
                          <p className="text-gray-500 leading-relaxed font-semibold">{ann.content}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ==================== MESSAGES TAB ==================== */}
            {activeTab === "messages" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center py-20 gap-3">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 border border-primary-green/20 text-primary-green flex items-center justify-center shadow-sm">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <h4 className="text-base font-extrabold text-primary-dark">Mentor Messaging Box</h4>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed font-semibold">
                  You are connected with <strong>Dr. A. Rajesh (Advisor)</strong>. Text queries inside the Team Chat room tab to request virtual meeting slots.
                </p>
                <Button
                  onClick={() => {
                    toast("Meeting Link: https://meet.google.com/siet-rag-mentor", "info");
                  }}
                  className="mt-2 text-xs"
                >
                  Join Mentor Sandbox Meeting
                </Button>
              </div>
            )}

            {/* ==================== SUPPORT TAB ==================== */}
            {activeTab === "support" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form tickets (Left columns) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary-green" /> Raise Support Ticket
                    </h3>
                    
                    <form onSubmit={handleRaiseTicket} className="flex flex-col gap-4">
                      <Input
                        label="Subject / Ticket Category"
                        placeholder="e.g. Sandbox GPU credentials allocation delay"
                        value={supportTicket.subject}
                        onChange={(e) => setSupportTicket({ ...supportTicket, subject: e.target.value })}
                      />
                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="text-xs font-semibold text-primary-dark">Trouble Description</label>
                        <textarea
                          rows={4}
                          value={supportTicket.desc}
                          onChange={(e) => setSupportTicket({ ...supportTicket, desc: e.target.value })}
                          placeholder="Describe the issues regarding registration checks, teammates role edit errors or submission audits."
                          className="w-full px-4 py-3 rounded-xl border border-input-border focus:ring-1 focus:ring-primary-green focus:outline-none"
                        />
                      </div>
                      <Button type="submit" className="text-xs">
                        Publish Ticket
                      </Button>
                    </form>
                  </div>
                </div>

                {/* FAQ links (Right column) */}
                <div className="flex flex-col gap-6">
                  <div className="p-5 rounded-3xl border border-input-border/30 bg-white shadow-sm flex flex-col gap-3">
                    <h3 className="text-xs font-extrabold text-primary-dark uppercase tracking-wider border-b border-gray-150 pb-2">Emergency Contacts</h3>
                    <div className="text-xs flex flex-col gap-2.5">
                      <div>
                        <p className="font-bold text-gray-700">Student IT Desk:</p>
                        <p className="text-gray-400 font-semibold">+91 98765 43210 (Rahul)</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">Lab emergency line:</p>
                        <p className="text-red-600 font-extrabold">+91 98765 99999</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== SETTINGS TAB ==================== */}
            {activeTab === "settings" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col gap-6 max-w-xl">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                  <Settings className="h-5 w-5 text-primary-green" /> Profile & Workspace settings
                </h3>
                
                <div className="flex flex-col gap-5 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-bold text-gray-800">Email Notifications</p>
                      <p className="text-gray-400 font-semibold">Notify me for every announcement broadcasted.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-input-border text-primary-green focus:ring-primary-green h-4.5 w-4.5 cursor-pointer" />
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-bold text-gray-800">Direct Messages</p>
                      <p className="text-gray-400 font-semibold">Allow mentors to invite to calendar sessions.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-input-border text-primary-green focus:ring-primary-green h-4.5 w-4.5 cursor-pointer" />
                  </div>

                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <p className="font-bold text-gray-800">Dark Theme</p>
                      <p className="text-gray-400 font-semibold">Toggle dark system appearance.</p>
                    </div>
                    <input
                      type="checkbox"
                      onChange={() => toast("Dark mode theme will be available in V1 releases.", "info")}
                      className="rounded border-input-border text-primary-green focus:ring-primary-green h-4.5 w-4.5 cursor-pointer"
                    />
                  </div>

                  <Button
                    onClick={() => {
                      toast("Theme preferences and settings saved.", "success");
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
