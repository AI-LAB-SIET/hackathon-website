"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendMemberInviteEmail } from "@/lib/firebaseAuth";
import { auth } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, User, CheckCircle, ArrowRight, ArrowLeft,
  Sparkles, Phone, BookOpen, Hash, Plus, Trash2, Send, Mail
} from "lucide-react";
import type { Participant } from "@/types";

const STEPS = [
  { num: 1, label: "Your Info", icon: <User className="h-4 w-4" /> },
  { num: 2, label: "Team", icon: <Users className="h-4 w-4" /> },
  { num: 3, label: "Review", icon: <Send className="h-4 w-4" /> },
];

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Electrical", "Mechanical", "Civil", "Chemical", "Biotechnology", "Other"
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const blankMember = (): Participant => ({
  name: "", email: "", registerNumber: "", phone: "",
  department: "", year: "", skills: [], isLeader: false,
});

export default function Onboarding() {
  const router = useRouter();
  const { session, registerTeam } = useAppState();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Personal info (leader)
  const [personal, setPersonal] = useState({
    registerNumber: "",
    phone: "",
    department: "",
    year: "",
  });

  // Team
  const [teamName, setTeamName] = useState("");
  const [extraMembers, setExtraMembers] = useState<Participant[]>([]);

  // Redirect if not a participant who needs setup or not logged in
  useEffect(() => {
    if (!session.isLoggedIn) {
      router.push("/login");
    } else if (session.isLoggedIn && session.teamSetupDone === true) {
      router.push("/dashboard");
    }
  }, [session.isLoggedIn, session.teamSetupDone, router]);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!personal.registerNumber.trim()) errs.registerNumber = "Register number is required";
    if (!personal.phone.trim()) errs.phone = "Phone number is required";
    if (!personal.department) errs.department = "Department is required";
    if (!personal.year) errs.year = "Year of study is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!teamName.trim()) errs.teamName = "Team name is required";
    extraMembers.forEach((m, i) => {
      if (m.name && !m.email.includes("@")) errs[`email_${i}`] = "Valid email required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const addMember = () => {
    if (extraMembers.length < 3) setExtraMembers((p) => [...p, blankMember()]);
  };

  const removeMember = (i: number) =>
    setExtraMembers((p) => p.filter((_, idx) => idx !== i));

  const updateMember = (i: number, field: keyof Participant, value: string) =>
    setExtraMembers((p) =>
      p.map((m, idx) => idx === i ? { ...m, [field]: value } : m)
    );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const leader: Participant = {
        name: session.name ?? "",
        email: session.email ?? "",
        registerNumber: personal.registerNumber,
        phone: personal.phone,
        department: personal.department,
        year: personal.year,
        skills: [],
        isLeader: true,
      };

      const validExtra = extraMembers.filter((m) => m.name.trim() && m.email.trim());
      const members = [leader, ...validExtra];

      // Get auth token BEFORE registerTeam (state is still fresh)
      let idToken: string | null = null;
      try {
        if (auth?.currentUser) {
          idToken = await auth.currentUser.getIdToken();
        }
      } catch { /* skip */ }

      // Register the team
      await registerTeam({ name: teamName, projectDescription: "", members });

      // Invite each extra team member: create their Firebase account + send password setup email
      if (validExtra.length > 0) {
        // Compute the teamId the same way registerTeam does: team-{timestamp}
        // We read it from auth.currentUser's Firestore doc if possible; otherwise derive it
        let resolvedTeamId: string | null = null;
        try {
          if (auth?.currentUser) {
            const { getDoc, doc } = await import("firebase/firestore");
            const { db: firestore } = await import("@/lib/firebase");
            if (firestore) {
              const snap = await getDoc(doc(firestore, "users", auth.currentUser.uid));
              resolvedTeamId = snap.data()?.teamId ?? null;
            }
          }
        } catch { /* skip Firestore lookup */ }

        const inviteResults = await Promise.allSettled(
          validExtra.map(async (m) => {
            // 1. Create Firebase Auth account + Firestore profile via API
            //    This MUST succeed before we can send the password setup email
            let accountCreated = false;
            if (idToken && resolvedTeamId) {
              try {
                const res = await fetch("/api/auth/invite-member", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`,
                  },
                  body: JSON.stringify({
                    name: m.name,
                    email: m.email,
                    registerNumber: m.registerNumber,
                    phone: m.phone,
                    department: m.department,
                    year: m.year,
                    teamId: resolvedTeamId,
                  }),
                });
                accountCreated = res.ok;
                if (!res.ok) {
                  const errData = await res.json().catch(() => ({}));
                  console.warn(`[Invite] Account creation failed for ${m.email}:`, errData);
                }
              } catch (e) {
                console.warn(`[Invite] API call failed for ${m.email}:`, e);
              }
            }

            // 2. Send password setup email only AFTER the Firebase account exists
            //    sendPasswordResetEmail throws auth/user-not-found if account doesn't exist
            if (accountCreated || (!resolvedTeamId || !idToken)) {
              await sendMemberInviteEmail(m.email);
            } else {
              throw new Error(`Could not create account for ${m.name}`);
            }
          })
        );

        const failedInvites = inviteResults
          .map((r, i) => (r.status === "rejected" ? validExtra[i].name : null))
          .filter(Boolean);

        if (failedInvites.length > 0) {
          toast(`Team registered! Could not send invite to: ${failedInvites.join(", ")}`, "info");
        } else {
          toast(
            `Team registered! Password setup emails sent to ${validExtra.length} teammate${validExtra.length > 1 ? "s" : ""}.`,
            "success"
          );
        }
      } else {
        toast("Team registered! Welcome to AI Hack Lab 2026.", "success");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setSubmitting(false);
      const msg =
        (err as { userFriendly?: string; message?: string })?.userFriendly ||
        (err as { message?: string })?.message ||
        "Registration failed. Please try again.";
      toast(msg, "error");
    }
  };

  return (
    <PageWrapper>
      <Navbar />

      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" /> Welcome, {session.name ?? "Participant"}!
            </div>
            <h1 className="text-3xl font-extrabold text-primary-dark dark:text-gray-100">Complete Your Registration</h1>
            <p className="text-gray-400 text-sm mt-2 dark:text-gray-500">
              Just a few more details to set up your team.
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${step === s.num ? "bg-primary-green text-white shadow-md" : step > s.num ? "bg-emerald-100 text-emerald-700" : "bg-white border border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"}`}>
                  {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.icon}
                  <span className="text-xs font-bold hidden sm:block">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 rounded-full ${step > s.num ? "bg-primary-green" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 dark:bg-gray-900 dark:border-gray-700 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Your Details</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Personal information about you as the team leader.</p>
                  </div>

                  {/* Register Number */}
                  <div className="relative">
                    <div className="absolute left-3 top-[38px] text-gray-400 pointer-events-none z-10">
                      <Hash className="h-4 w-4" />
                    </div>
                    <Input
                      label="Register Number"
                      placeholder="e.g. 22CS101"
                      value={personal.registerNumber}
                      onChange={(e) => setPersonal((p) => ({ ...p, registerNumber: e.target.value }))}
                      error={errors.registerNumber}
                      className="pl-9"
                    />
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <div className="absolute left-3 top-[38px] text-gray-400 pointer-events-none z-10">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      label="Phone Number"
                      placeholder="e.g. 9876543210"
                      type="tel"
                      value={personal.phone}
                      onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
                      error={errors.phone}
                      className="pl-9"
                    />
                  </div>

                  {/* Department + Year */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Department</label>
                      <select
                        value={personal.department}
                        onChange={(e) => setPersonal((p) => ({ ...p, department: e.target.value }))}
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/50 ${errors.department ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`}
                      >
                        <option value="">Select department</option>
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Year of Study</label>
                      <select
                        value={personal.year}
                        onChange={(e) => setPersonal((p) => ({ ...p, year: e.target.value }))}
                        className={`w-full border rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/50 ${errors.year ? "border-red-400" : "border-gray-200 dark:border-gray-600"}`}
                      >
                        <option value="">Select year</option>
                        {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Team Setup */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Team Setup</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Name your team and optionally add up to 3 teammates.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-[38px] text-gray-400 pointer-events-none z-10">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <Input
                      label="Team Name"
                      placeholder="e.g. Neural Knights"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      error={errors.teamName}
                      className="pl-9"
                    />
                  </div>

                  {/* Extra Members */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Teammates (optional, max 3)</span>
                      {extraMembers.length < 3 && (
                        <button
                          type="button"
                          onClick={addMember}
                          className="flex items-center gap-1 text-xs font-semibold text-primary-green hover:underline cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Member
                        </button>
                      )}
                    </div>

                    {extraMembers.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl dark:border-gray-700">
                        You can participate solo or add teammates above.
                      </div>
                    )}

                    {extraMembers.length > 0 && (
                      <div className="flex items-start gap-2 text-xs text-blue-600 bg-blue-50 border border-blue-100 p-3 rounded-xl dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                        <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Each teammate will receive a <strong>password setup email</strong> at their address so they can log in and access the platform.</span>
                      </div>
                    )}

                    {extraMembers.map((m, i) => (
                      <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Member {i + 2}</span>
                          <button type="button" onClick={() => removeMember(i)} className="text-red-400 hover:text-red-600 cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Full Name"
                            placeholder="Name"
                            value={m.name}
                            onChange={(e) => updateMember(i, "name", e.target.value)}
                          />
                          <Input
                            label="Email"
                            placeholder="email@college.edu"
                            type="email"
                            value={m.email}
                            onChange={(e) => updateMember(i, "email", e.target.value)}
                            error={errors[`email_${i}`]}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Register Number"
                            placeholder="e.g. 22CS102"
                            value={m.registerNumber}
                            onChange={(e) => updateMember(i, "registerNumber", e.target.value)}
                          />
                          <Input
                            label="Phone"
                            placeholder="9876543210"
                            value={m.phone}
                            onChange={(e) => updateMember(i, "phone", e.target.value)}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Department</label>
                            <select
                              value={m.department}
                              onChange={(e) => updateMember(i, "department", e.target.value)}
                              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/50"
                            >
                              <option value="">Select</option>
                              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Year</label>
                            <select
                              value={m.year}
                              onChange={(e) => updateMember(i, "year", e.target.value)}
                              className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-green/50"
                            >
                              <option value="">Select</option>
                              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Review */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Review & Confirm</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Check everything before submitting your registration.</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Team Leader</div>
                      <div className="text-sm font-semibold text-primary-dark dark:text-gray-100">{session.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{session.email}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {personal.registerNumber} &bull; {personal.department} &bull; {personal.year} &bull; {personal.phone}
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Team</div>
                      <div className="text-sm font-semibold text-primary-dark dark:text-gray-100">{teamName}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {1 + extraMembers.filter((m) => m.name.trim()).length} member{(1 + extraMembers.filter((m) => m.name.trim()).length) !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {extraMembers.filter((m) => m.name.trim()).length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Teammates</div>
                        {extraMembers.filter((m) => m.name.trim()).map((m, i) => (
                          <div key={i} className="text-xs text-gray-600 dark:text-gray-300">
                            <span className="font-semibold">{m.name}</span> — {m.email} &bull; {m.department}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-emerald-50 border border-emerald-100 p-3 rounded-xl dark:bg-emerald-900/20 dark:border-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>By submitting, you confirm all details are accurate. You can update team members from your dashboard later.</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="px-8 pb-8 flex gap-3">
              {step > 1 && (
                <Button variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex items-center gap-2 text-xs">
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 text-xs">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={submitting} className="flex-1 flex items-center justify-center gap-2 text-xs">
                  <Send className="h-4 w-4" /> Complete Registration
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
