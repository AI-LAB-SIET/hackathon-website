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
  Send, Eye, EyeOff, Sparkles, Lock, Plus
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

  // Google Sign-Up flow
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [customGoogleName, setCustomGoogleName] = useState("");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");

  const handleGoogleSignUp = (name: string, email: string) => {
    setGoogleLoading(true);
    setTimeout(() => {
      setAccount({ name, email, password: "google-oauth", confirm: "google-oauth" });
      setGoogleLoading(false);
      setGoogleModalOpen(false);
      toast(`Google account linked: ${email}`, "success");
      setStep(2);
    }, 1400);
  };

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

                  {/* Google Sign-Up Divider */}
                  <div className="relative flex items-center justify-center my-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-input-border/30 dark:border-gray-800"></div>
                    </div>
                    <span className="relative px-3 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest dark:bg-gray-900">Or</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setShowCustomGoogleInput(false); setGoogleModalOpen(true); }}
                    className="w-full py-2.5 px-4 rounded-xl border border-input-border/60 hover:border-primary-green bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 cursor-pointer shadow-xs"
                  >
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    Continue with Google
                  </button>
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

        {/* Google Sign-Up Account Chooser Modal */}
        <AnimatePresence>
          {googleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => { if (!googleLoading) setGoogleModalOpen(false); }}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 select-none"
              >
                {googleLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative w-12 h-12 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-base font-extrabold text-primary-dark dark:text-gray-100 mb-1">Creating your account</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">with Google Sign-Up</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center text-center mb-6">
                      <svg className="h-6 w-6 mb-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {showCustomGoogleInput ? "Sign up with Google" : "Choose an account"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        to register on <span className="font-bold text-primary-green">AI Hack Lab</span>
                      </p>
                    </div>

                    {showCustomGoogleInput ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={() => setShowCustomGoogleInput(false)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </button>
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Back to account list</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <Input
                            label="Full Name"
                            placeholder="Your full name"
                            value={customGoogleName}
                            onChange={(e) => setCustomGoogleName(e.target.value)}
                          />
                          <Input
                            label="Email"
                            placeholder="name@gmail.com"
                            type="email"
                            value={customGoogleEmail}
                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          />
                          <Button
                            onClick={() => handleGoogleSignUp(customGoogleName, customGoogleEmail)}
                            disabled={!customGoogleName.trim() || !customGoogleEmail.trim()}
                            className="w-full py-2.5 mt-2"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        {[
                          { name: "Abhishek Sharma", email: "abhishek@gmail.com" },
                          { name: "Meera Patel", email: "meera.patel@gmail.com" },
                          { name: "Rahul Verma", email: "rahul.v@gmail.com" },
                        ].map((acc) => (
                          <button
                            key={acc.email}
                            onClick={() => handleGoogleSignUp(acc.name, acc.email)}
                            className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
                              {acc.name.split(" ").map(w => w[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-800 dark:text-gray-100">{acc.name}</div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{acc.email}</div>
                            </div>
                          </button>
                        ))}
                        <button
                          onClick={() => { setCustomGoogleName(""); setCustomGoogleEmail(""); setShowCustomGoogleInput(true); }}
                          className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left cursor-pointer mt-1"
                        >
                          <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0">
                            <Plus className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">Use another account</div>
                          </div>
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                      To continue, Google will share your name, email address, language preference, and profile picture with AI Hack Lab.
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
