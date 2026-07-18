"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUpWithEmail } from "@/lib/firebaseAuth";
import { isConfigured } from "@/lib/firebase";
import { useAppState } from "@/components/layout/StateProvider";
import { motion } from "framer-motion";
import { User, Eye, EyeOff, Sparkles, Lock, Mail, CheckCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { hackathons, addProfile } = useAppState();

  const [account, setAccount] = useState({ name: "", email: "", college: "", hostelStatus: "" as "hosteller" | "dayscholar" | "", password: "", confirm: "" });
  const [selectedHackathonId, setSelectedHackathonId] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const hParam = searchParams.get("h");

  // Filter out archived and closed/locked hackathons for registration
  const availableHackathons = hackathons.filter(h => h.status !== "archived" && h.registrationOpen);

  useEffect(() => {
    if (hParam && availableHackathons.length > 0) {
      const matched = availableHackathons.find((h) => h.slug === hParam);
      if (matched) {
        setSelectedHackathonId(matched.id);
      }
    } else if (availableHackathons.length > 0 && !selectedHackathonId) {
      const active = availableHackathons.find((h) => h.status === "active") || availableHackathons[0];
      setSelectedHackathonId(active.id);
    }
  }, [hParam, availableHackathons, selectedHackathonId]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!account.name.trim()) errs.name = "Full name is required";
    if (!account.college.trim()) errs.college = "College name is required";
    if (!account.hostelStatus) errs.hostelStatus = "Hosteller/Dayscholar status is required";
    if (!account.email.includes("@")) errs.email = "Valid email is required";
    if (account.password.length < 6) errs.password = "Must be at least 6 characters";
    if (account.password !== account.confirm) errs.confirm = "Passwords do not match";
    if (!selectedHackathonId) errs.hackathonId = "Selecting a hackathon is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isConfigured) {
        await signUpWithEmail(
          account.email,
          account.password,
          account.name,
          account.college,
          account.hostelStatus as "hosteller" | "dayscholar",
          selectedHackathonId
        );
      } else {
        // In local mock mode, simulate registration and save user profile
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newProfile = {
          id: `m-${Date.now()}`,
          uid: `m-${Date.now()}`,
          email: account.email,
          name: account.name,
          college: account.college,
          hostelStatus: account.hostelStatus as "hosteller" | "dayscholar",
          displayName: account.name,
          role: "participant" as const,
          currentHackathonId: selectedHackathonId,
          hackathonIds: [],
          teamSetupDone: false,
          onboarded: false,
        };
        addProfile(newProfile);
      }
      setDone(true);
    } catch (err: unknown) {
      setSubmitting(false);
      const msg =
        (err as { userFriendly?: string; message?: string })?.userFriendly ||
        (err as { message?: string })?.message ||
        "Registration failed.";
      toast(msg, "error");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden dark:bg-gray-900 dark:border-gray-700">
      {!done ? (
        <motion.form
          key="form"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="p-8 space-y-5"
        >
          <div className="relative">
            <div className="absolute left-3 top-[38px] text-gray-400 pointer-events-none z-10">
              <User className="h-4 w-4" />
            </div>
            <Input
              label="Full Name"
              placeholder="e.g. Abhishek Sharma"
              value={account.name}
              onChange={(e) => setAccount((p) => ({ ...p, name: e.target.value }))}
              error={errors.name}
              className="pl-9"
            />
          </div>

          <div className="relative">
            <div className="absolute left-3 top-[38px] text-gray-400 pointer-events-none z-10">
              <Sparkles className="h-4 w-4" />
            </div>
            <Input
              label="College Name"
              placeholder="e.g. SIET"
              value={account.college}
              onChange={(e) => setAccount((p) => ({ ...p, college: e.target.value }))}
              error={errors.college}
              className="pl-9"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-primary-dark select-none dark:text-gray-200 block mb-1.5">
              Hosteller / Dayscholar
            </label>
            <select
              value={account.hostelStatus}
              onChange={(e) => setAccount((p) => ({ ...p, hostelStatus: e.target.value as "hosteller" | "dayscholar" }))}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 focus:outline-none transition-all duration-200 text-sm dark:bg-gray-900 dark:text-gray-100
                ${
                  errors.hostelStatus
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green shadow-[0_2px_4px_rgba(0,100,0,0.02)] dark:border-gray-700 dark:hover:border-primary-green"
                }`}
            >
              <option value="">Select status</option>
              <option value="hosteller">Hosteller</option>
              <option value="dayscholar">Dayscholar</option>
            </select>
            {errors.hostelStatus && (
              <span className="text-xs text-red-600 font-medium mt-1 block" role="alert">
                {errors.hostelStatus}
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute left-3 top-[38px] text-gray-400 pointer-events-none z-10">
              <Mail className="h-4 w-4" />
            </div>
            <Input
              label="College Email"
              placeholder="you@college.edu"
              type="email"
              value={account.email}
              onChange={(e) => setAccount((p) => ({ ...p, email: e.target.value }))}
              error={errors.email}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
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
            <div className="relative">
              <Input
                label="Confirm Password"
                placeholder="Repeat password"
                type={showConfirm ? "text" : "password"}
                value={account.confirm}
                onChange={(e) => setAccount((p) => ({ ...p, confirm: e.target.value }))}
                error={errors.confirm}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-[38px] text-gray-400 cursor-pointer z-10">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              Select Hackathon
            </label>
            <select
              value={selectedHackathonId}
              onChange={(e) => setSelectedHackathonId(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/50"
            >
              <option value="">Select a hackathon</option>
              {availableHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.status})
                </option>
              ))}
            </select>
            {errors.hackathonId && <p className="text-xs text-red-500 mt-1">{errors.hackathonId}</p>}
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-xl dark:bg-gray-800 dark:text-gray-500">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>A verification link will be sent to your email. Verify it before logging in to complete team registration.</span>
          </div>

          <Button type="submit" isLoading={submitting} className="w-full py-3.5 mt-2">
            Create Account &amp; Send Verification
          </Button>
        </motion.form>
      ) : (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-10 flex flex-col items-center text-center gap-5"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-primary-dark dark:text-gray-100 mb-1">Account Created!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              We sent a verification link to{" "}
              <span className="font-semibold text-emerald-600">{account.email}</span>.
              Click the link to activate your account, then log in to complete your profile setup.
            </p>
          </div>
          <div className="w-full rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 font-medium dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300">
            Check your Spam / Junk folder if you do not see the email.
          </div>
          <Button onClick={() => router.push("/login")} className="w-full">
            Go to Login
          </Button>
        </motion.div>
      )}
    </div>
  );
}

export default function Register() {
  const router = useRouter();

  return (
    <PageWrapper>
      <Navbar />

      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" /> SIET HACKATHONS
            </div>
            <h1 className="text-3xl font-extrabold text-primary-dark dark:text-gray-100">Create Account</h1>
            <p className="text-gray-400 text-sm mt-2 dark:text-gray-500">
              Sign up first — set up your team after verifying your email.
            </p>
          </div>

          <Suspense fallback={<div className="p-8 text-center text-sm text-gray-400">Loading registration form...</div>}>
            <RegisterForm />
          </Suspense>

          <p className="text-center text-xs text-gray-400 mt-4 dark:text-gray-500">
            Already registered?{" "}
            <button onClick={() => router.push("/login")} className="text-primary-green font-semibold hover:underline cursor-pointer">
              Log in here
            </button>
          </p>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
