"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { User, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Phone, Hash, Send } from "lucide-react";

const STEPS = [
  { num: 1, label: "Your Info", icon: <User className="h-4 w-4" /> },
  { num: 2, label: "Review", icon: <Send className="h-4 w-4" /> },
];

const DEPARTMENTS = [
  "Computer Science", "Information Technology", "Electronics & Communication",
  "Artificial Intelligence and Machine Learning", "Artificial Intelligence and Data Science",
  "Electrical", "Mechanical", "Civil", "Chemical", "Biotechnology", "Other"
];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function Onboarding() {
  const router = useRouter();
  const { session, updateProfile } = useAppState();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Personal info
  const [personal, setPersonal] = useState({
    registerNumber: "",
    phone: "",
    department: "",
    year: "",
  });

  // Redirect if not logged in or already onboarded
  useEffect(() => {
    if (!session.isLoggedIn) {
      router.push("/login");
    } else if (session.onboarded === true) {
      router.push("/dashboard");
    }
  }, [session.isLoggedIn, session.onboarded, router]);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!personal.registerNumber.trim()) errs.registerNumber = "Register number is required";
    if (!personal.phone.trim()) errs.phone = "Phone number is required";
    if (!personal.department) errs.department = "Department is required";
    if (!personal.year) errs.year = "Year of study is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (session.email) {
        await updateProfile(session.email, {
          registerNumber: personal.registerNumber,
          phone: personal.phone,
          department: personal.department,
          year: personal.year,
          onboarded: true,
        });
      }
      toast("Profile setup completed! Welcome to AI Hack Lab.", "success");
      router.push("/dashboard");
    } catch (err: unknown) {
      setSubmitting(false);
      const msg =
        (err as { message?: string })?.message ||
        "Setup failed. Please try again.";
      toast(msg, "error");
    }
  };

  return (
    <PageWrapper>
      <Navbar />

      <section className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center py-12 px-4 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4" /> Welcome, {session.name ?? "Participant"}!
            </div>
            <h1 className="text-3xl font-extrabold text-primary-dark dark:text-gray-100">Complete Your Profile</h1>
            <p className="text-gray-400 text-sm mt-2 dark:text-gray-500">
              Provide your details to complete your student profile.
            </p>
          </div>

          {/* Step Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step === s.num ? "bg-primary-green text-white shadow-md" : step > s.num ? "bg-emerald-100 text-emerald-700" : "bg-white border border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"}`}>
                  {step > s.num ? <CheckCircle className="h-4 w-4" /> : s.icon}
                  <span className="text-xs font-bold">{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-12 rounded-full ${step > s.num ? "bg-primary-green" : "bg-gray-200"}`} />
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
                    <p className="text-sm text-gray-400 dark:text-gray-500">Information about you as a student participant.</p>
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

              {/* STEP 2: Review */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="p-8 space-y-5">
                  <div>
                    <h2 className="font-extrabold text-primary-dark text-xl mb-1 dark:text-gray-100">Review & Confirm</h2>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Check everything before completing your profile.</p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-5 space-y-4 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Student Info</div>
                      <div className="text-sm font-semibold text-primary-dark dark:text-gray-100">{session.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{session.email}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 space-y-1">
                        <p><strong>Register Number:</strong> {personal.registerNumber}</p>
                        <p><strong>Department:</strong> {personal.department}</p>
                        <p><strong>Year of Study:</strong> {personal.year}</p>
                        <p><strong>Phone Number:</strong> {personal.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-gray-400 bg-emerald-50 border border-emerald-100 p-3 rounded-xl dark:bg-emerald-900/20 dark:border-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    <span>By submitting, you confirm all details are accurate. You can update these details from your dashboard later.</span>
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
              {step < 2 ? (
                <Button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 text-xs">
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} isLoading={submitting} className="flex-1 flex items-center justify-center gap-2 text-xs">
                  <Send className="h-4 w-4" /> Complete Profile Setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
