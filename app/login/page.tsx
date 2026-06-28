"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { ShieldCheck, Plus, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type RoleType = "participant" | "admin" | "judge" | "organizer" | "volunteer";

export default function Login() {
  const router = useRouter();
  const { session, login } = useAppState();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleType>("participant");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Google Sign-In Simulation States
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSelectedEmail, setGoogleSelectedEmail] = useState("");
  const [googleSelectedRole, setGoogleSelectedRole] = useState<RoleType>("participant");
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);

  const handleGoogleLogin = (emailToUse: string, roleToUse: RoleType) => {
    setGoogleLoading(true);
    setGoogleSelectedEmail(emailToUse);
    setGoogleSelectedRole(roleToUse);

    setTimeout(() => {
      const success = login(emailToUse, roleToUse);
      setGoogleLoading(false);

      if (success) {
        setGoogleModalOpen(false);
        toast(`Signed in successfully with Google as ${roleToUse.toUpperCase()}.`, "success");
        switch (roleToUse) {
          case "admin":
            router.push("/admin");
            break;
          case "judge":
            router.push("/judge");
            break;
          case "organizer":
            router.push("/organizer");
            break;
          case "volunteer":
            router.push("/volunteer");
            break;
          case "participant":
          default:
            router.push("/dashboard");
            break;
        }
      } else {
        toast("Google Sign-In failed: Account not found in this workspace.", "error");
      }
    }, 1500);
  };

  // If already logged in, redirect to the correct workspace
  useEffect(() => {
    if (session.isLoggedIn) {
      switch (session.role) {
        case "admin":
          router.push("/admin");
          break;
        case "judge":
          router.push("/judge");
          break;
        case "organizer":
          router.push("/organizer");
          break;
        case "volunteer":
          router.push("/volunteer");
          break;
        case "participant":
        default:
          router.push("/dashboard");
          break;
      }
    }
  }, [session, router]);

  const handleRoleQuickFill = (selectedRole: RoleType, selectedEmail: string) => {
    setRole(selectedRole);
    setEmail(selectedEmail);
    setPassword("demo123");
    setError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all credentials.");
      toast("Invalid input parameters.", "error");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const success = login(email, role);
      setSubmitting(false);

      if (success) {
        toast(`Welcome back! Logged in as ${role.toUpperCase()}.`, "success");
        switch (role) {
          case "admin":
            router.push("/admin");
            break;
          case "judge":
            router.push("/judge");
            break;
          case "organizer":
            router.push("/organizer");
            break;
          case "volunteer":
            router.push("/volunteer");
            break;
          case "participant":
          default:
            router.push("/dashboard");
            break;
        }
      } else {
        toast("Invalid credentials or account not found.", "error");
        setError("Account not found. Please check your email and role selection.");
      }
    }, 1200);
  };

  return (
    <PageWrapper className="relative bg-white min-h-screen flex flex-col dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-6 gradient-mesh relative">
        <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-primary-green/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-accent-yellow/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl border border-input-border/30 bg-white p-8 shadow-2xl relative z-10 dark:bg-gray-900 dark:border-gray-700">
          <div className="flex flex-col items-center gap-2 text-center mb-8">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src="/siet_logo.png"
                alt="AI Lab Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary-dark dark:text-gray-100">
              Access Workspace
            </h2>
            <p className="text-xs text-gray-500 max-w-xs font-semibold leading-relaxed dark:text-gray-400">
              Login to inspect team details, evaluate code, or manage the hackathon timeline.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Custom Role Selector Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary-dark dark:text-gray-200">Select Workspace Portal</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as RoleType);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl border border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green focus:outline-none transition-all duration-200 text-sm font-semibold bg-white text-gray-800 cursor-pointer dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
              >
                <option value="participant">Participant Workspace</option>
                <option value="judge">Judge Evaluation Portal</option>
                <option value="organizer">Organizer Audit Control</option>
                <option value="volunteer">Volunteer Help Desk</option>
                <option value="admin">System Administration</option>
              </select>
            </div>

            <Input
              label="Account Email ID"
              placeholder={
                role === "admin"
                  ? "admin@college.edu"
                  : role === "judge"
                  ? "judge@college.edu"
                  : role === "organizer"
                  ? "organizer@college.edu"
                  : role === "volunteer"
                  ? "riya@college.edu"
                  : "abhishek@college.edu"
              }
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ? " " : undefined}
            />

            <Input
              label="Password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error ? " " : undefined}
            />

            {error && (
              <span className="text-xs text-red-600 font-semibold leading-relaxed">
                {error}
              </span>
            )}

            {/* Remember Me / Forgot Password */}
            <div className="flex items-center justify-between text-xs font-bold select-none">
              <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input-border text-primary-green focus:ring-primary-green h-4 w-4"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => toast("Contact AI Lab coordinator to reset passwords.", "info")}
                className="text-primary-green hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" isLoading={submitting} className="w-full py-3.5 mt-2">
              Log In to Workspace
            </Button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-input-border/30 dark:border-gray-800"></div>
            </div>
            <span className="relative px-3 bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest dark:bg-gray-900">Or continue with</span>
          </div>

          <button
            type="button"
            onClick={() => setGoogleModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl border border-input-border/60 hover:border-primary-green bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-center gap-2.5 font-bold text-sm transition-all duration-200 cursor-pointer shadow-xs"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Sign in with Google
          </button>

          {/* Quick Info Box for Evaluators */}
          <div className="mt-8 p-4 rounded-2xl bg-card-bg/40 border border-input-border/20 dark:bg-gray-800/40 dark:border-gray-700">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-green mb-2.5 flex items-center justify-center gap-1.5 border-b border-input-border/10 pb-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0" /> Demo Quick Login
            </p>
            <div className="text-[10px] text-gray-600 flex flex-col gap-2 dark:text-gray-400">
              {[
                { roleName: "Participant", r: "participant" as const, email: "abhishek@college.edu" },
                { roleName: "Judge", r: "judge" as const, email: "judge@college.edu" },
                { roleName: "Organizer", r: "organizer" as const, email: "organizer@college.edu" },
                { roleName: "Volunteer", r: "volunteer" as const, email: "riya@college.edu" },
                { roleName: "Admin", r: "admin" as const, email: "admin@college.edu" },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg border border-gray-150/40 dark:bg-gray-800/60 dark:border-gray-700">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{item.roleName}</span>
                  <button
                    type="button"
                    onClick={() => handleRoleQuickFill(item.r, item.email)}
                    className="text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-primary-green border border-primary-green/20 hover:bg-primary-green hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Google Sign-In Modal Simulation */}
        <AnimatePresence>
          {googleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!googleLoading) setGoogleModalOpen(false);
                }}
                className="absolute inset-0 bg-black/50 backdrop-blur-xs"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 select-none"
              >
                {googleLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    {/* Google Material Spinner */}
                    <div className="relative w-12 h-12 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-base font-extrabold text-primary-dark dark:text-gray-100 mb-1">Signing you in</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">to {googleSelectedEmail}</p>
                  </div>
                ) : (
                  <>
                    {/* Google Brand Header */}
                    <div className="flex flex-col items-center text-center mb-6">
                      <svg className="h-6 w-6 mb-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {showCustomGoogleInput ? "Sign in with Google" : "Choose an account"}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                        to continue to <span className="font-bold text-primary-green">AI Hack Lab</span>
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
                            label="Email or phone"
                            placeholder="name@gmail.com"
                            type="email"
                            value={customGoogleEmail}
                            onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          />
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold text-primary-dark dark:text-gray-200">Select Account Workspace</label>
                            <select
                              value={googleSelectedRole}
                              onChange={(e) => setGoogleSelectedRole(e.target.value as RoleType)}
                              className="w-full px-4 py-2.5 rounded-xl border border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green focus:outline-none transition-all duration-200 text-sm font-semibold bg-white text-gray-800 cursor-pointer dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                            >
                              <option value="participant">Participant Workspace</option>
                              <option value="judge">Judge Evaluation Portal</option>
                              <option value="organizer">Organizer Audit Control</option>
                              <option value="volunteer">Volunteer Help Desk</option>
                              <option value="admin">System Administration</option>
                            </select>
                          </div>
                          <Button
                            onClick={() => handleGoogleLogin(customGoogleEmail, googleSelectedRole)}
                            disabled={!customGoogleEmail.trim()}
                            className="w-full py-2.5 mt-2"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col max-h-[280px] overflow-y-auto pr-1">
                        {/* Google Account List */}
                        {[
                          { name: "Abhishek Sharma", email: "abhishek@college.edu", role: "participant" as const, roleLabel: "Participant" },
                          { name: "Dr. Priya Rajan", email: "judge@college.edu", role: "judge" as const, roleLabel: "Judge" },
                          { name: "Prof. Suresh Kumar", email: "organizer@college.edu", role: "organizer" as const, roleLabel: "Organizer" },
                          { name: "Riya Sharma", email: "riya@college.edu", role: "volunteer" as const, roleLabel: "Volunteer" },
                        ].map((acc) => (
                          <button
                            key={acc.email}
                            onClick={() => handleGoogleLogin(acc.email, acc.role)}
                            className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors text-left cursor-pointer border-b border-gray-100 dark:border-gray-850 last:border-0"
                          >
                            <div className="h-9 w-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-extrabold shrink-0">
                              {acc.name.split(" ").map(w => w[0]).join("")}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-gray-800 dark:text-gray-100 flex items-center justify-between">
                                <span>{acc.name}</span>
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">{acc.roleLabel}</span>
                              </div>
                              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{acc.email}</div>
                            </div>
                          </button>
                        ))}

                        {/* Add/Use Another Account */}
                        <button
                          onClick={() => {
                            setCustomGoogleEmail("");
                            setShowCustomGoogleInput(true);
                          }}
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

                    {/* Google Privacy Info footer */}
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed mt-6 pt-4 border-t border-gray-100 dark:border-gray-850">
                      To continue, Google will share your name, email address, language preference, and profile picture with AI Hack Lab.
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </PageWrapper>
  );
}
