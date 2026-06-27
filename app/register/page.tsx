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
  User, Users, CheckCircle, ArrowRight, ArrowLeft,
  Send, Eye, EyeOff, Sparkles, Lock
} from "lucide-react";

const STEPS = [
  { num: 1, label: "Account", icon: <User className="h-4 w-4" /> },
  { num: 2, label: "Team", icon: <Users className="h-4 w-4" /> },
  { num: 3, label: "Submit", icon: <Send className="h-4 w-4" /> },
];

export default function Register() {
  const router = useRouter();
  const { registerTeam } = useAppState();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);

  // Step 1: Account
  const [account, setAccount] = useState({ name: "", email: "", password: "", confirm: "" });

  // Step 2: Team
  const [teamName, setTeamName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  // Validation
  const validateStep1 = () => {
    if (!account.name.trim()) { toast("Please enter your full name.", "error"); return false; }
    if (!account.email.includes("@")) { toast("Please enter a valid email.", "error"); return false; }
    if (account.password.length < 6) { toast("Password must be at least 6 characters.", "error"); return false; }
    if (account.password !== account.confirm) { toast("Passwords do not match.", "error"); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!teamName.trim()) { toast("Please enter a team name.", "error"); return false; }
    if (!projectDescription.trim()) { toast("Please describe your project briefly.", "error"); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(step + 1);
  };

  const handleSubmit = () => {
    registerTeam({
      name: teamName,
      projectDescription,
      members: [{ name: account.name, email: account.email, registerNumber: "", phone: "", department: "", year: "", skills: [], github: "", isLeader: true }],
    });
    toast("Team registered successfully!", "success");
    router.push("/dashboard#team");
  };

  return (
    <PageWrapper>
      <Navbar />

      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" /> AI Hack Lab 2026
            </div>
            <h1 className="text-3xl font-extrabold text-primary-dark dark:text-gray-100">Register Your Team</h1>
            <p className="text-gray-400 text-sm mt-2 dark:text-gray-500">Create an account, build your team, and compete.</p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${step === s.num ? "bg-primary-green text-white shadow-md" : step > s.num ? "bg-emerald-100 text-emerald-700" : "bg-white border border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"}`}>
                  {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.icon}
                  <span className="text-xs font-bold hidden sm:block">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && <div className={`h-0.5 w-8 rounded-full ${step > s.num ? "bg-primary-green" : "bg-gray-200"}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden dark:bg-gray-900 dark:border-gray-700">
            <AnimatePresence mode="wait">
              {/* ─── STEP 1: Account ─── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Create Account</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Your personal login credentials for the platform.</p>
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5 dark:text-gray-400">Full Name</label>
                      <input type="text" value={account.name} onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Abhishek Sharma"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5 dark:text-gray-400">College Email</label>
                      <input type="email" value={account.email} onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
                        placeholder="you@college.edu"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5 dark:text-gray-400">Password</label>
                      <div className="relative">
                        <input type={showPw ? "text" : "password"} value={account.password} onChange={(e) => setAccount((p) => ({ ...p, password: e.target.value }))}
                          placeholder="Min 6 characters"
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                        <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1.5 dark:text-gray-400">Confirm Password</label>
                      <input type="password" value={account.confirm} onChange={(e) => setAccount((p) => ({ ...p, confirm: e.target.value }))}
                        placeholder="Repeat password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-xl dark:bg-gray-800 dark:text-gray-500">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Your email will be used to log in and receive hackathon notifications.</span>
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 2: Team ─── */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Set Up Your Team</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Create a new team by giving it a name and brief description.</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5 dark:text-gray-400">Team Name</label>
                    <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Neural Knights"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5 dark:text-gray-400">Project Brief</label>
                    <textarea rows={3} value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Briefly describe your AI project idea..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-green/30 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" />
                  </div>
                </motion.div>
              )}

              {/* ─── STEP 3: Review & Submit ─── */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Review & Submit</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Confirm your details before submitting for organizer approval.</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 dark:text-gray-500">Account</div>
                      <div className="text-sm font-semibold text-primary-dark dark:text-gray-100">{account.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{account.email}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 dark:text-gray-500">Team</div>
                      <div className="text-sm font-semibold text-primary-dark dark:text-gray-100">{teamName}</div>
                      <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">{projectDescription}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-emerald-50 border border-emerald-100 p-3 rounded-xl dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-gray-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>By submitting, you confirm all details are accurate. Your team will appear as <strong>Pending</strong> until an organizer approves it. You can add team members after registration from your workspace.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="px-8 pb-8 flex gap-3">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
              {step < 3 ? (
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

          <p className="text-center text-xs text-gray-400 mt-4 dark:text-gray-500">
            Already registered?{" "}
            <button onClick={() => router.push("/login")} className="text-primary-green font-semibold hover:underline cursor-pointer">Log in here</button>
          </p>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
