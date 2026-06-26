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
  Users,
  FolderCode,
  Gavel,
  Activity,
  MessageSquare,
  Settings,
  Github,
  Video,
  ExternalLink,
  Award,
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  Inbox
} from "lucide-react";
import { Team } from "@/types";

export default function JudgeDashboard() {
  const router = useRouter();
  const { session, teams, evaluateProject } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Selection state for evaluation
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [innovation, setInnovation] = useState<number>(8);
  const [feasibility, setFeasibility] = useState<number>(8);
  const [presentation, setPresentation] = useState<number>(8);
  const [feedback, setFeedback] = useState<string>("");

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "judge")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "judge") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500">
        Loading judge portal...
      </div>
    );
  }

  // Under review teams are those with status APPROVED
  const assignedTeams = teams.filter((t) => t.status === "APPROVED");
  const gradedTeamsCount = assignedTeams.filter((t) => 
    t.evaluations?.some((e) => e.judgeEmail === session.email)
  ).length;

  const handleStartEvaluation = (team: Team) => {
    setSelectedTeamId(team.id);
    const existing = team.evaluations?.find((e) => e.judgeEmail === session.email);
    if (existing) {
      setInnovation(existing.innovation);
      setFeasibility(existing.feasibility);
      setPresentation(existing.presentation);
      setFeedback(existing.feedback);
    } else {
      setInnovation(8);
      setFeasibility(8);
      setPresentation(8);
      setFeedback("");
    }
    setActiveTab("evaluation");
  };

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId) {
      toast("Please select a team to grade first.", "error");
      return;
    }
    evaluateProject(selectedTeamId, {
      innovation,
      feasibility,
      presentation,
      feedback,
      judgeEmail: session.email || "judge@college.edu"
    });
    toast("Project score evaluated and broadcasted to participant.", "success");
    setActiveTab("dashboard");
    setSelectedTeamId("");
  };

  // Leaderboard ranking logic
  const getRankedTeams = () => {
    return [...teams]
      .map((t) => {
        const evals = t.evaluations || [];
        if (evals.length === 0) return { ...t, score: 0 };
        const sum = evals.reduce((acc, curr) => acc + (curr.innovation + curr.feasibility + curr.presentation) / 3, 0);
        return { ...t, score: parseFloat((sum / evals.length).toFixed(2)) };
      })
      .sort((a, b) => b.score - a.score);
  };

  const rankedTeams = getRankedTeams();

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "assigned", label: "Assigned Projects" },
            { id: "evaluation", label: "Evaluation" },
            { id: "leaderboard", label: "Leaderboard" },
            { id: "messages", label: "Messages" },
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
              {activeTab === "dashboard" ? "Judge Dashboard" : activeTab.replace("-", " ")}
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
                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { label: "Assigned Teams", val: assignedTeams.length, icon: <Users className="h-5 w-5" /> },
                    { label: "Evaluations Completed", val: `${gradedTeamsCount} / ${assignedTeams.length}`, icon: <CheckCircle className="h-5 w-5 text-emerald-600" /> },
                    { label: "Leaderboard Top Score", val: rankedTeams[0]?.score > 0 ? `${rankedTeams[0].score} / 10` : "N/A", icon: <Award className="h-5 w-5 text-amber-500" /> },
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

                {/* Assigned Queue Summary */}
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                    <FolderCode className="h-4.5 w-4.5 text-primary-green" /> Projects Awaiting Score
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {assignedTeams.map((team) => {
                      const isGraded = team.evaluations?.some((e) => e.judgeEmail === session.email);
                      return (
                        <div key={team.id} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 hover:bg-card-bg/20 text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{team.name}</p>
                            <p className="text-[10px] text-gray-400 font-semibold truncate max-w-[280px]">
                              {team.projectDescription || "No summary configured"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              isGraded ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700 animate-pulse"
                            }`}>
                              {isGraded ? "Graded" : "Pending Grading"}
                            </span>
                            <button
                              onClick={() => handleStartEvaluation(team)}
                              className="px-3 py-1.5 rounded-lg bg-primary-green hover:bg-primary-green/90 text-white text-[10px] font-bold cursor-pointer"
                            >
                              {isGraded ? "Edit Score" : "Grade Project"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {assignedTeams.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No approved teams in the registration system yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== ASSIGNED PROJECTS TAB ==================== */}
            {activeTab === "assigned" && (
              <div className="flex flex-col gap-6">
                {assignedTeams.map((team) => {
                  const ev = team.evaluations?.find((e) => e.judgeEmail === session.email);
                  return (
                    <div key={team.id} className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-base font-bold text-primary-dark">{team.name}</h3>
                          <p className="text-[10px] text-gray-400 font-semibold mt-0.5">Submitted Project Details</p>
                        </div>
                        {ev ? (
                          <Badge variant="success">Graded ({( (ev.innovation + ev.feasibility + ev.presentation) / 3 ).toFixed(1)}/10)</Badge>
                        ) : (
                          <Badge variant="warning">Awaiting Grade</Badge>
                        )}
                      </div>

                      <div className="p-4 rounded-2xl bg-card-bg/25 border border-input-border/10 text-xs">
                        <p className="font-bold text-gray-700">Abstract Summary:</p>
                        <p className="text-gray-500 leading-relaxed mt-1 font-semibold">
                          {team.projectDescription || "No concept summary declared by team."}
                        </p>
                      </div>

                      {team.aiDisclosure && (
                        <div className="text-xs text-gray-500">
                          <strong>AI Model Assist Disclosure:</strong> {team.aiDisclosure}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 border border-gray-150 rounded-xl flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-gray-700">
                            <Github className="h-4 w-4 text-gray-600" /> Repository Link:
                          </span>
                          <a
                            href={team.githubUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-green font-extrabold hover:underline truncate max-w-[150px]"
                          >
                            {team.githubUrl ? "GitHub Repo" : "Not Linked"}
                          </a>
                        </div>

                        <div className="p-3 border border-gray-150 rounded-xl flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-bold text-gray-700">
                            <Video className="h-4 w-4 text-red-600" /> Pitch Presentation:
                          </span>
                          <a
                            href={team.videoUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-green font-extrabold hover:underline truncate max-w-[150px]"
                          >
                            {team.videoUrl ? "Watch Video" : "Not Provided"}
                          </a>
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end mt-2">
                        <button
                          onClick={() => handleStartEvaluation(team)}
                          className="px-4 py-2 rounded-xl bg-primary-green hover:bg-primary-green/90 text-white text-xs font-bold cursor-pointer"
                        >
                          {ev ? "Edit Scoring Rubric" : "Start Scoring Review"}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {assignedTeams.length === 0 && (
                  <div className="p-12 text-center border border-dashed border-gray-200 rounded-3xl bg-white">
                    <p className="text-xs text-gray-400 italic">No assigned projects found.</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== EVALUATION RUBRIC TAB ==================== */}
            {activeTab === "evaluation" && (
              <div className="max-w-2xl rounded-3xl border border-input-border/30 bg-white p-5 sm:p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-6">
                  <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary-green" /> Scoring & Grading Rubric
                  </h3>
                  {selectedTeamId && (
                    <span className="text-xs font-bold text-primary-green">
                      Grading: {teams.find((t) => t.id === selectedTeamId)?.name}
                    </span>
                  )}
                </div>

                {!selectedTeamId ? (
                  <div className="py-8 text-center text-xs text-gray-400 italic">
                    Please select a project to review from the &quot;Assigned Projects&quot; tab first.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitScore} className="flex flex-col gap-6">
                    {/* Innovation Range */}
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700">1. Tech Innovation & AI Model depth</span>
                        <span className="text-primary-green font-extrabold">{innovation} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={innovation}
                        onChange={(e) => setInnovation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-green"
                      />
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                        Assess depth of LLMs, prompts structures, safety RAG controls, and originality of localized integration.
                      </p>
                    </div>

                    {/* Feasibility Range */}
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700">2. Feasibility & Architecture limits</span>
                        <span className="text-primary-green font-extrabold">{feasibility} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={feasibility}
                        onChange={(e) => setFeasibility(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-green"
                      />
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                        Assess database layout, FastAPI structures, API endpoint reliability, and frontend speed.
                      </p>
                    </div>

                    {/* Presentation Range */}
                    <div className="flex flex-col gap-1.5 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700">3. Pitch Presentation & Demo Quality</span>
                        <span className="text-primary-green font-extrabold">{presentation} / 10</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={presentation}
                        onChange={(e) => setPresentation(parseInt(e.target.value))}
                        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-green"
                      />
                      <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                        Assess pitch style, clarity of the video presentation, slide deck completeness, and visual design.
                      </p>
                    </div>

                    {/* Feedback comment */}
                    <div className="flex flex-col gap-1.5 text-xs">
                      <label className="font-bold text-gray-700">4. Review Feedback / Recommendations</label>
                      <textarea
                        rows={4}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Leave constructive critiques or instructions for API safety corrections..."
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
                        Submit Scorecard
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ==================== LEADERBOARD TAB ==================== */}
            {activeTab === "leaderboard" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-8 shadow-sm flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-gray-150 pb-3">
                  <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-green" /> Scoring Rankings & Standings
                  </h3>
                  <span className="text-xs font-bold text-gray-400">Updates in real-time</span>
                </div>

                <div className="flex flex-col gap-3">
                  {rankedTeams.map((team, idx) => (
                    <div key={team.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-gray-100 hover:border-input-border/10 text-xs">
                      <div className="flex items-center gap-4">
                        <span className={`h-6 w-6 rounded-full flex items-center justify-center font-extrabold text-[10px] ${
                          idx === 0 
                            ? "bg-amber-100 text-amber-800 border border-amber-300" 
                            : idx === 1 
                            ? "bg-slate-100 text-slate-800 border border-slate-350" 
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-gray-800">{team.name}</p>
                          <p className="text-[10px] text-gray-400 font-semibold">{team.members.length} members | Status: {team.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-bold">Avg Score:</span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-primary-green font-extrabold text-sm border border-primary-green/20">
                          {team.score > 0 ? `${team.score} / 10` : "Unrated"}
                        </span>
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
                <h4 className="text-base font-extrabold text-primary-dark">Organizers Support Box</h4>
                <p className="text-xs text-gray-500 max-w-sm leading-relaxed font-semibold">
                  Request coordinators to resolve team eligibility conflicts or reset scorecard rubrics.
                </p>
                <Button
                  onClick={() => {
                    toast("Direct line to coordinators: support@siet.ac.in", "info");
                  }}
                  className="mt-2 text-xs"
                >
                  Contact Admin Desk
                </Button>
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
                      <p className="text-gray-800">Scoring Notifications</p>
                      <p className="text-gray-400 font-normal">Alert when new teams submit final code links.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-input-border text-primary-green focus:ring-primary-green h-4.5 w-4.5 cursor-pointer" />
                  </div>
                  <Button
                    onClick={() => {
                      toast("Scoring configs updated.", "success");
                    }}
                    className="mt-2 text-xs"
                  >
                    Save Scoring Configuration
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
