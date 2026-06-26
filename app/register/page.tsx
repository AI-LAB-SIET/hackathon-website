"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Users, Plus, X, CheckCircle, ArrowRight, ArrowLeft,
  Send, Eye, EyeOff, Sparkles, Lock
} from "lucide-react";
import { Participant } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

const DEPT_OPTIONS = [
  "Computer Science & Engineering",
  "Electronics & Communication",
  "Information Technology",
  "Artificial Intelligence & Data Science",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Biotechnology",
  "Civil Engineering",
];
const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "PG 1st Year", "PG 2nd Year"];

const STEPS = [
  { num: 1, label: "Account", icon: <User className="h-4 w-4" /> },
  { num: 2, label: "Team", icon: <Users className="h-4 w-4" /> },
  { num: 3, label: "Members", icon: <Plus className="h-4 w-4" /> },
  { num: 4, label: "Submit", icon: <Send className="h-4 w-4" /> },
];

const emptyMember = (isLeader = false): Participant => ({
  name: "", registerNumber: "", email: "", phone: "",
  department: DEPT_OPTIONS[0], year: YEAR_OPTIONS[2],
  skills: [], github: "", isLeader,
});

export default function Register() {
  const router = useRouter();
  const { registerTeam, teams } = useAppState();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);

  // Step 1: Account
  const [account, setAccount] = useState({ name: "", email: "", password: "", confirm: "" });

  // Step 2: Team
  const [teamFlow, setTeamFlow] = useState<"create" | "join">("create");
  const [teamName, setTeamName] = useState("");
  const [trackId, setTrackId] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // Step 3: Members (leader is index 0, pre-filled from account)
  const [members, setMembers] = useState<Participant[]>([
    { ...emptyMember(true) },
  ]);
  const [newSkills, setNewSkills] = useState<string[]>([""]);

  // Validation
  const validateStep1 = () => {
    if (!account.name.trim()) { toast("Please enter your full name.", "error"); return false; }
    if (!account.email.includes("@")) { toast("Please enter a valid email.", "error"); return false; }
    if (account.password.length < 6) { toast("Password must be at least 6 characters.", "error"); return false; }
    if (account.password !== account.confirm) { toast("Passwords do not match.", "error"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (teamFlow === "create") {
      if (!teamName.trim()) { toast("Please enter a team name.", "error"); return false; }
      if (!trackId) { toast("Please select a problem statement track.", "error"); return false; }
      if (!projectDescription.trim()) { toast("Please describe your project briefly.", "error"); return false; }
    } else {
      if (!joinCode.trim()) { toast("Please enter a team join code.", "error"); return false; }
    }
    return true;
  };

  const validateStep3 = () => {
    const leader = members[0];
    if (!leader.name || !leader.email || !leader.registerNumber) {
      toast("Please fill in leader details (Name, Email, Register Number).", "error");
      return false;
    }
    if (members.length < 2) { toast("Team must have at least 2 members.", "error"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;

    // Pre-fill leader info from account on step 1 → 2
    if (step === 1) {
      setMembers([{ ...emptyMember(true), name: account.name, email: account.email }]);
      setNewSkills([""]);
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    const filledMembers = members.filter((m) => m.name.trim() && m.email.trim() && m.registerNumber.trim());
    if (filledMembers.length < 2) { toast("At least 2 members with complete details required.", "error"); return; }
    registerTeam({ name: teamName, projectDescription, members: filledMembers.map((m, i) => ({ ...m, isLeader: i === 0 })) });
    toast("Team registered successfully!", "success");
    router.push("/dashboard");
  };

  const updateMember = (idx: number, field: keyof Participant, value: string) => {
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addMember = () => {
    if (members.length >= 4) { toast("Maximum 4 members per team.", "error"); return; }
    setMembers((prev) => [...prev, emptyMember()]);
    setNewSkills((prev) => [...prev, ""]);
  };

  const removeMember = (idx: number) => {
    if (idx === 0) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
    setNewSkills((prev) => prev.filter((_, i) => i !== idx));
  };

  const addSkill = (idx: number) => {
    const skill = newSkills[idx]?.trim();
    if (!skill) return;
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, skills: [...m.skills, skill] } : m));
    setNewSkills((prev) => prev.map((s, i) => i === idx ? "" : s));
  };

  const removeSkill = (memberIdx: number, skill: string) => {
    setMembers((prev) => prev.map((m, i) => i === memberIdx ? { ...m, skills: m.skills.filter((s) => s !== skill) } : m));
  };

  return (
    <PageWrapper>
      <Navbar />

      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" /> AI Hack Lab 2026
            </div>
            <h1 className="text-3xl font-extrabold text-primary-dark">Register Your Team</h1>
            <p className="text-gray-400 text-sm mt-2">Create an account, build your team, and compete.</p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${step === s.num ? "bg-primary-green text-white shadow-md" : step > s.num ? "bg-emerald-100 text-emerald-700" : "bg-white border border-gray-200 text-gray-400"}`}>
                  {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.icon}
                  <span className="text-xs font-bold hidden sm:block">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && <div className={`h-0.5 w-8 rounded-full ${step > s.num ? "bg-primary-green" : "bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ─── STEP 1: Account ─── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1">Create Account</h2>
                    <p className="text-sm text-gray-400">Your personal login credentials for the platform.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Full Name</label>
                    <input type="text" value={account.name} onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Abhishek Sharma"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">College Email</label>
                    <input type="email" value={account.email} onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@college.edu"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Password</label>
                      <div className="relative">
                        <input type={showPw ? "text" : "password"} value={account.password} onChange={(e) => setAccount((p) => ({ ...p, password: e.target.value }))}
                          placeholder="Min 6 characters"
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Confirm Password</label>
                      <input type="password" value={account.confirm} onChange={(e) => setAccount((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Repeat password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-xl">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Your email will be used to log in and receive hackathon notifications.</span>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 2: Team ─── */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1">Set Up Your Team</h2>
                    <p className="text-sm text-gray-400">Create a new team or join one with an existing code.</p>
                  </div>

                  <div className="flex gap-3">
                    {(["create", "join"] as const).map((flow) => (
                      <button key={flow} onClick={() => setTeamFlow(flow)}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 cursor-pointer transition-all capitalize ${teamFlow === flow ? "border-primary-green bg-emerald-50 text-primary-green" : "border-gray-200 text-gray-400 hover:border-gray-300"}`}
                      >{flow === "create" ? "Create New Team" : "Join Existing Team"}</button>
                    ))}
                  </div>

                  {teamFlow === "create" ? (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1.5">Team Name</label>
                        <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. Neural Knights"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1.5">Problem Statement Track</label>
                        <select value={trackId} onChange={(e) => setTrackId(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer">
                          <option value="">Select a track...</option>
                          {HACK_TRACKS.map((tr) => <option key={tr.id} value={tr.id}>{tr.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1.5">Project Brief</label>
                        <textarea rows={3} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)}
                          placeholder="Briefly describe your AI project idea..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5">Team Join Code</label>
                      <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                        placeholder="e.g. NK-AI26-104"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 font-mono" />
                      <p className="text-xs text-gray-400 mt-2">Ask your team leader for the Join Code from their Team Pass.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── STEP 3: Members ─── */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold text-primary-dark text-xl mb-1">Add Members</h2>
                      <p className="text-sm text-gray-400">Register all team members (2–4 people, including you).</p>
                    </div>
                    <button onClick={addMember} disabled={members.length >= 4}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 cursor-pointer transition-colors">
                      <Plus className="h-3.5 w-3.5" /> Add Member
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 max-h-[52vh] overflow-y-auto pr-1">
                    {members.map((m, idx) => (
                      <div key={idx} className={`rounded-2xl border p-4 space-y-3 ${idx === 0 ? "border-emerald-200 bg-emerald-50/40" : "border-gray-100 bg-white"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx === 0 ? "bg-primary-green text-white" : "bg-gray-100 text-gray-500"}`}>
                            {idx === 0 ? "L" : idx + 1}
                          </div>
                          <span className="text-xs font-bold text-gray-600">{idx === 0 ? "Team Leader (You)" : `Member ${idx + 1}`}</span>
                          {idx > 0 && (
                            <button onClick={() => removeMember(idx)} className="ml-auto p-1 text-gray-300 hover:text-red-400 cursor-pointer"><X className="h-3.5 w-3.5" /></button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { label: "Full Name*", field: "name" as const, placeholder: "Full name" },
                            { label: "Register Number*", field: "registerNumber" as const, placeholder: "2022CSE0101" },
                            { label: "College Email*", field: "email" as const, placeholder: "name@college.edu" },
                            { label: "Phone", field: "phone" as const, placeholder: "98765..." },
                          ].map(({ label, field, placeholder }) => (
                            <div key={field}>
                              <label className="text-xs font-semibold text-gray-400 block mb-1">{label}</label>
                              <input type="text" value={m[field] as string} onChange={(e) => updateMember(idx, field, e.target.value)}
                                placeholder={placeholder} disabled={idx === 0 && (field === "name" || field === "email")}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green/30 disabled:bg-gray-50 disabled:text-gray-500" />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-xs font-semibold text-gray-400 block mb-1">Department</label>
                            <select value={m.department} onChange={(e) => updateMember(idx, "department", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer">
                              {DEPT_OPTIONS.map((d) => <option key={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-400 block mb-1">Year</label>
                            <select value={m.year} onChange={(e) => updateMember(idx, "year", e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary-green/30 cursor-pointer">
                              {YEAR_OPTIONS.map((y) => <option key={y}>{y}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-400 block mb-1">Skills</label>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {m.skills.map((s) => (
                              <span key={s} className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                {s}
                                <button onClick={() => removeSkill(idx, s)} className="cursor-pointer"><X className="h-2.5 w-2.5" /></button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input type="text" value={newSkills[idx] || ""} onChange={(e) => setNewSkills((prev) => prev.map((s, i) => i === idx ? e.target.value : s))}
                              onKeyDown={(e) => { if (e.key === "Enter") { addSkill(idx); e.preventDefault(); } }}
                              placeholder="Add skill + Enter"
                              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green/30" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 4: Review & Submit ─── */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1">Review & Submit</h2>
                    <p className="text-sm text-gray-400">Confirm your details before submitting for organizer approval.</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-gray-50">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Account</div>
                      <div className="text-sm font-semibold text-primary-dark">{account.name}</div>
                      <div className="text-sm text-gray-500">{account.email}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Team</div>
                      <div className="text-sm font-semibold text-primary-dark">{teamName}</div>
                      <div className="text-xs text-gray-400">{HACK_TRACKS.find((t) => t.id === trackId)?.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{projectDescription}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Members ({members.filter((m) => m.name).length})</div>
                      {members.filter((m) => m.name).map((m, i) => (
                        <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-100 last:border-0">
                          <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-primary-green text-white" : "bg-gray-200 text-gray-500"}`}>{i === 0 ? "L" : i + 1}</div>
                          <div><div className="text-sm font-semibold text-primary-dark">{m.name}</div><div className="text-xs text-gray-400">{m.department} · {m.year}</div></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>By submitting, you confirm all details are accurate. Your team will appear as <strong>Pending</strong> until an organizer approves it.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="px-8 pb-8 flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-green text-white text-sm font-bold hover:bg-primary-dark cursor-pointer transition-colors shadow-md">
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={handleSubmit}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-green text-white text-sm font-bold hover:bg-primary-dark cursor-pointer transition-colors shadow-md">
                  <Send className="h-4 w-4" /> Submit Registration
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Already registered?{" "}
            <button onClick={() => router.push("/login")} className="text-primary-green font-semibold hover:underline cursor-pointer">Log in here</button>
          </p>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
