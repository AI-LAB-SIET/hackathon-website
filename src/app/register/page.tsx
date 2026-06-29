"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Account
  const [account, setAccount] = useState({ name: "", email: "", password: "", confirm: "" });

  // Step 2: Team
  const [teamName, setTeamName] = useState("");

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!account.name.trim()) errs.name = "Full name is required";
    if (!account.email.includes("@")) errs.email = "Valid email is required";
    if (account.password.length < 6) errs.password = "Must be at least 6 characters";
    if (account.password !== account.confirm) errs.confirm = "Passwords do not match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) errs.teamName = "Team name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep(step + 1);
  };

  const handleSubmit = () => {
    registerTeam({
      name: teamName,
      projectDescription: "",
      members: [{ name: account.name, email: account.email, registerNumber: "", phone: "", department: "", year: "", skills: [], github: "", isLeader: true }],
    });
    toast("Team registered successfully! You can now log in.", "success");
    router.push("/login");
  };

  return (
    <PageWrapper>
      <Navbar />

      <section className="min-h-[calc(100vh-4rem)] bg-linear-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
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
              {/* STEP 1: Account */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Create Account</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Your personal login credentials for the platform.</p>
                  </div>
                  <Input
                    label="Full Name"
                    placeholder="e.g. Abhishek Sharma"
                    value={account.name}
                    onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))}
                    error={errors.name}
                  />
                  <Input
                    label="College Email"
                    placeholder="you@college.edu"
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
                    error={errors.email}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Input
                        label="Password"
                        placeholder="Min 6 characters"
                        type={showPw ? "text" : "password"}
                        value={account.password}
                        onChange={(e) => setAccount((p) => ({ ...p, password: e.target.value }))}
                        error={errors.password}
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-gray-400 cursor-pointer z-10">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Input
                      label="Confirm Password"
                      placeholder="Repeat password"
                      type="password"
                      value={account.confirm}
                      onChange={(e) => setAccount((p) => ({ ...p, confirm: e.target.value }))}
                      error={errors.confirm}
                    />
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-xl dark:bg-gray-800 dark:text-gray-500">
                    <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Your email will be used to log in and receive hackathon notifications.</span>
                  </div>

                </motion.div>
              )}

              {/* STEP 2: Team */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Set Up Your Team</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Give your team a name to get started.</p>
                  </div>
                  <Input
                    label="Team Name"
                    placeholder="e.g. Neural Knights"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    error={errors.teamName}
                  />

                </motion.div>
              )}

              {/* STEP 3: Review & Submit */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Review & Submit</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Confirm your details before registering.</p>
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
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-emerald-50 border border-emerald-100 p-3 rounded-xl dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-gray-400">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>By submitting, you confirm all details are accurate. Your team will be registered immediately. You can add team members after logging in from your workspace.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="px-8 pb-8 flex gap-3">
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-xs">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 text-xs">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 text-xs">
                  <Send className="h-4 w-4" /> Submit Registration
                </Button>
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
