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
import { ShieldCheck } from "lucide-react";

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
    setPassword("password123");
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
        toast("Invalid credentials or unregistered account.", "error");
        setError(`Account not found. For ${role.toUpperCase()}, use: ${
          role === "admin"
            ? "admin@college.edu"
            : role === "judge"
            ? "judge@college.edu"
            : role === "organizer"
            ? "organizer@college.edu"
            : role === "volunteer"
            ? "riya@college.edu"
            : "abhishek@college.edu"
        }`);
      }
    }, 1200);
  };

  return (
    <PageWrapper className="relative bg-white min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center py-12 px-6 gradient-mesh relative">
        <div className="absolute top-1/4 left-10 w-64 h-64 rounded-full bg-primary-green/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 rounded-full bg-accent-yellow/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md rounded-3xl border border-input-border/30 bg-white p-8 shadow-2xl relative z-10">
          <div className="flex flex-col items-center gap-2 text-center mb-8">
            <div className="relative h-10 w-10 overflow-hidden">
              <Image
                src="/siet_logo.png"
                alt="SIET Logo"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-primary-dark">
              Access Workspace
            </h2>
            <p className="text-xs text-gray-500 max-w-xs font-semibold leading-relaxed">
              Login to inspect team details, evaluate code, or manage the hackathon timeline.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Custom Role Selector Dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-primary-dark">Select Workspace Portal</label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value as RoleType);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl border border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green focus:outline-none transition-all duration-200 text-sm font-semibold bg-white text-gray-800 cursor-pointer"
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
              <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
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

          {/* Quick Info Box for Portfolio Evaluators */}
          <div className="mt-8 p-4 rounded-2xl bg-card-bg/40 border border-input-border/20">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-green mb-2.5 flex items-center justify-center gap-1.5 border-b border-input-border/10 pb-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0" /> Evaluator Quick Login List
            </p>
            <div className="text-[10px] text-gray-600 flex flex-col gap-2">
              {[
                { roleName: "Participant", r: "participant" as const, email: "abhishek@college.edu" },
                { roleName: "Judge", r: "judge" as const, email: "judge@college.edu" },
                { roleName: "Organizer", r: "organizer" as const, email: "organizer@college.edu" },
                { roleName: "Volunteer", r: "volunteer" as const, email: "riya@college.edu" },
                { roleName: "Admin", r: "admin" as const, email: "admin@college.edu" },
              ].map((item, index) => (
                <div key={index} className="flex justify-between items-center bg-white/60 p-1.5 rounded-lg border border-gray-150/40">
                  <span className="font-bold text-gray-800">{item.roleName}:</span>
                  <span className="text-gray-500 font-mono text-[9px]">{item.email}</span>
                  <button
                    type="button"
                    onClick={() => handleRoleQuickFill(item.r, item.email)}
                    className="text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-primary-green border border-primary-green/20 hover:bg-primary-green hover:text-white transition-all font-bold cursor-pointer"
                  >
                    Quick Autofill
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageWrapper>
  );
}
