"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { ShieldCheck, Mail, Lock } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const { session, login } = useAppState();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"participant" | "admin">("participant");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session.isLoggedIn) {
      if (session.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, router]);

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
        toast(`Welcome back! Logged in as ${role === "admin" ? "Admin" : "Participant"}.`, "success");
        if (role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast("Invalid credentials or unregistered account.", "error");
        setError("Account not found. For testing, use: admin@college.edu (Admin) or abhishek@college.edu / sid@college.edu (Participant).");
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
              Login to inspect team details, modify member entries, or review pending approvals.
            </p>
          </div>

          {/* Toggle Role Tab */}
          <div className="flex bg-card-bg/50 p-1.5 rounded-xl border border-input-border/10 mb-6">
            <button
              type="button"
              onClick={() => {
                setRole("participant");
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                role === "participant"
                  ? "bg-primary-green text-white shadow-sm"
                  : "text-gray-600 hover:text-primary-dark"
              }`}
            >
              Participant Account
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("admin");
                setError("");
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                role === "admin"
                  ? "bg-primary-green text-white shadow-sm"
                  : "text-gray-600 hover:text-primary-dark"
              }`}
            >
              System Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Account Email ID"
              placeholder={role === "admin" ? "admin@college.edu" : "email@college.edu"}
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
              Log In to Dashboard
            </Button>
          </form>

          {/* Quick Info Box for Portfolio Evaluators */}
          <div className="mt-8 p-4 rounded-2xl bg-card-bg/40 border border-input-border/20 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary-green mb-1.5 flex items-center justify-center gap-1.5">
              <ShieldCheck className="h-4 w-4 shrink-0" /> Evaluator Quick Login
            </p>
            <div className="text-[10px] text-gray-500 flex flex-col gap-1">
              <p>
                <strong>Admin:</strong> admin@college.edu | <em>Any password</em>
              </p>
              <p>
                <strong>Student:</strong> abhishek@college.edu | <em>Any password</em>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </PageWrapper>
  );
}
