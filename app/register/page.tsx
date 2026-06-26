"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, UserPlus, FileText, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { Participant } from "@/types";

export default function Register() {
  const router = useRouter();
  const { registerTeam } = useAppState();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [teamSize, setTeamSize] = useState<number>(3); // Default 3 members

  // Setup state for members. Index 0 is Leader.
  const [members, setMembers] = useState<Participant[]>([
    { name: "", registerNumber: "", email: "", phone: "", department: "", year: "3rd Year", skills: [], github: "", isLeader: true },
    { name: "", registerNumber: "", email: "", phone: "", department: "", year: "3rd Year", skills: [], github: "" },
    { name: "", registerNumber: "", email: "", phone: "", department: "", year: "3rd Year", skills: [], github: "" },
    { name: "", registerNumber: "", email: "", phone: "", department: "", year: "3rd Year", skills: [], github: "" },
  ]);

  const [skillsInputs, setSkillsInputs] = useState<string[]>(["", "", "", ""]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Synchronize members state when teamSize changes
  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
  };

  const handleMemberChange = (idx: number, field: keyof Participant, val: Participant[keyof Participant]) => {
    const updated = [...members];
    updated[idx] = { ...updated[idx], [field]: val };
    setMembers(updated);
  };

  const validateStep = () => {
    const errs: Record<string, string> = {};
    let valid = true;

    if (step === 1) {
      if (!teamName.trim()) {
        errs.teamName = "Team Name is required";
        valid = false;
      }
      if (!projectDescription.trim()) {
        errs.projectDescription = "Project Description is required";
        valid = false;
      }
    } else if (step === 2) {
      // Validate Leader (Index 0)
      const leader = members[0];
      if (!leader.name.trim()) {
        errs.leaderName = "Leader Name is required";
        valid = false;
      }
      if (!leader.registerNumber.trim()) {
        errs.leaderReg = "Register Number is required";
        valid = false;
      }
      if (!leader.email.trim()) {
        errs.leaderEmail = "Email is required";
        valid = false;
      } else if (!/\S+@\S+\.\S+/.test(leader.email)) {
        errs.leaderEmail = "Invalid email format";
        valid = false;
      }
      if (!leader.phone.trim()) {
        errs.leaderPhone = "Phone number is required";
        valid = false;
      }
      if (!leader.department.trim()) {
        errs.leaderDept = "Department is required";
        valid = false;
      }
    } else if (step === 3) {
      // Validate Teammates (Index 1 to teamSize - 1)
      for (let i = 1; i < teamSize; i++) {
        const m = members[i];
        if (!m.name.trim()) {
          errs[`member_${i}_name`] = `Teammate ${i} Name is required`;
          valid = false;
        }
        if (!m.registerNumber.trim()) {
          errs[`member_${i}_reg`] = `Teammate ${i} Register Number is required`;
          valid = false;
        }
        if (!m.email.trim()) {
          errs[`member_${i}_email`] = `Teammate ${i} Email is required`;
          valid = false;
        } else if (!/\S+@\S+\.\S+/.test(m.email)) {
          errs[`member_${i}_email`] = "Invalid email format";
          valid = false;
        }
        if (!m.department.trim()) {
          errs[`member_${i}_dept`] = `Teammate ${i} Department is required`;
          valid = false;
        }
      }
    }

    setErrors(errs);
    return valid;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    } else {
      toast("Please complete all required fields correctly.", "error");
    }
  };

  const handlePrev = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    if (!validateStep()) {
      toast("Form validation failed.", "error");
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      // Assemble members based on team size
      const activeMembers = members.slice(0, teamSize).map((m, idx) => {
        const skillsString = skillsInputs[idx];
        const skills = skillsString
          ? skillsString.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
          : [];
        return {
          ...m,
          skills,
        };
      });

      registerTeam({
        name: teamName,
        projectDescription,
        members: activeMembers,
      });

      setSubmitting(false);
      setIsSuccess(true);
      toast("Team Registered Successfully!", "success");
    }, 1500);
  };

  const yearsList = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-12 md:py-20 relative">
        <div className="absolute top-10 left-0 w-48 h-48 bg-primary-green/5 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-0 w-64 h-64 bg-accent-yellow/5 blur-3xl rounded-full pointer-events-none" />

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="registration-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="rounded-3xl border border-input-border/30 bg-white p-6 sm:p-10 shadow-2xl relative z-10"
            >
              {/* Header Title */}
              <div className="flex flex-col gap-2 mb-8 text-center sm:text-left">
                <span className="text-xs font-bold text-primary-green uppercase tracking-widest">
                  Step {step} of 4
                </span>
                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-primary-dark leading-tight">
                  Team Registration
                </h2>
                <p className="text-xs text-gray-500 max-w-lg font-semibold leading-relaxed">
                  {step === 1 && "Start by declaring your team name and project brief."}
                  {step === 2 && "Enter coordinate profiles for the designated team leader."}
                  {step === 3 && "Input academic profiles for the remaining team members."}
                  {step === 4 && "Review your complete profile before final submission."}
                </p>
              </div>

              {/* Progress Line */}
              <div className="flex gap-1.5 h-1 bg-gray-150 rounded-full mb-8 overflow-hidden select-none">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-full transition-all duration-300 ${
                      i <= step ? "bg-primary-green" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Step Forms */}
              <div className="min-h-[280px]">
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-5"
                  >
                    <Input
                      label="Team Name"
                      placeholder="e.g. Neural Knights"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      error={errors.teamName}
                    />

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-primary-dark">Project Description / Brief Idea</label>
                      <textarea
                        rows={4}
                        placeholder="Detail your AI product solution concept (e.g. LLM integration, agent tools, RAG schema)..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all duration-200 text-sm
                          ${
                            errors.projectDescription
                              ? "border-red-500 focus:ring-1 focus:ring-red-500"
                              : "border-input-border hover:border-primary-green focus:ring-2 focus:ring-primary-green focus:border-primary-green shadow-inner"
                          }`}
                      />
                      {errors.projectDescription && (
                        <span className="text-xs text-red-600 font-semibold">{errors.projectDescription}</span>
                      )}
                    </div>

                    {/* Team Size Selector */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-primary-dark">Total Team Size (including Leader)</label>
                      <div className="flex gap-3">
                        {[2, 3, 4].map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleTeamSizeChange(sz)}
                            className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                              teamSize === sz
                                ? "bg-primary-green border-primary-green text-white shadow-md shadow-primary-green/10"
                                : "bg-white border-gray-200 text-gray-600 hover:border-primary-green hover:text-primary-green"
                            }`}
                          >
                            {sz} Members
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Leader Name"
                        placeholder="John Doe"
                        value={members[0].name}
                        onChange={(e) => handleMemberChange(0, "name", e.target.value)}
                        error={errors.leaderName}
                      />
                      <Input
                        label="Leader Register Number"
                        placeholder="e.g. 2022CSE0101"
                        value={members[0].registerNumber}
                        onChange={(e) => handleMemberChange(0, "registerNumber", e.target.value)}
                        error={errors.leaderReg}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="College Email Address"
                        placeholder="john@college.edu"
                        type="email"
                        value={members[0].email}
                        onChange={(e) => handleMemberChange(0, "email", e.target.value)}
                        error={errors.leaderEmail}
                      />
                      <Input
                        label="Phone Number"
                        placeholder="10-digit number"
                        type="tel"
                        value={members[0].phone}
                        onChange={(e) => handleMemberChange(0, "phone", e.target.value)}
                        error={errors.leaderPhone}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Department"
                        placeholder="e.g. Computer Science"
                        value={members[0].department}
                        onChange={(e) => handleMemberChange(0, "department", e.target.value)}
                        error={errors.leaderDept}
                      />
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-primary-dark">Year of Study</label>
                        <select
                          value={members[0].year}
                          onChange={(e) => handleMemberChange(0, "year", e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-input-border text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green text-sm shadow-inner cursor-pointer"
                        >
                          {yearsList.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Skills (Comma Separated)"
                        placeholder="React, PyTorch, LangChain"
                        value={skillsInputs[0]}
                        onChange={(e) => {
                          const updated = [...skillsInputs];
                          updated[0] = e.target.value;
                          setSkillsInputs(updated);
                        }}
                      />
                      <Input
                        label="GitHub Profile URL (Optional)"
                        placeholder="github.com/username"
                        value={members[0].github || ""}
                        onChange={(e) => handleMemberChange(0, "github", e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-8 max-h-[50vh] overflow-y-auto pr-2"
                  >
                    {Array.from({ length: teamSize - 1 }).map((_, i) => {
                      const idx = i + 1;
                      return (
                        <div key={idx} className="flex flex-col gap-4 border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                          <h4 className="text-xs font-bold text-primary-green uppercase tracking-wider flex items-center gap-1.5">
                            <UserPlus className="h-4 w-4" /> Teammate {idx} Profile
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Full Name"
                              placeholder={`Teammate ${idx} name`}
                              value={members[idx].name}
                              onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                              error={errors[`member_${idx}_name`]}
                            />
                            <Input
                              label="Register Number"
                              placeholder="e.g. 2022CSE0112"
                              value={members[idx].registerNumber}
                              onChange={(e) => handleMemberChange(idx, "registerNumber", e.target.value)}
                              error={errors[`member_${idx}_reg`]}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input
                              label="Email Address"
                              placeholder="teammate@college.edu"
                              type="email"
                              value={members[idx].email}
                              onChange={(e) => handleMemberChange(idx, "email", e.target.value)}
                              error={errors[`member_${idx}_email`]}
                            />
                            <Input
                              label="Department"
                              placeholder="e.g. Information Technology"
                              value={members[idx].department}
                              onChange={(e) => handleMemberChange(idx, "department", e.target.value)}
                              error={errors[`member_${idx}_dept`]}
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-xs font-semibold text-primary-dark">Year of Study</label>
                              <select
                                value={members[idx].year}
                                onChange={(e) => handleMemberChange(idx, "year", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-input-border text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green text-sm shadow-inner cursor-pointer"
                              >
                                {yearsList.map((y) => (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Input
                              label="Skills (Comma Separated)"
                              placeholder="Node.js, OpenCV, SQL"
                              value={skillsInputs[idx]}
                              onChange={(e) => {
                                const updated = [...skillsInputs];
                                updated[idx] = e.target.value;
                                setSkillsInputs(updated);
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col gap-5 text-xs sm:text-sm text-gray-600"
                  >
                    <div className="rounded-2xl border border-input-border/30 bg-card-bg/20 p-5 flex flex-col gap-3">
                      <h4 className="text-sm font-bold text-primary-dark uppercase tracking-wide flex items-center gap-2">
                        <Users className="h-4.5 w-4.5 text-primary-green" /> Team Overview
                      </h4>
                      <p>
                        <strong>Team Name:</strong> {teamName}
                      </p>
                      <p>
                        <strong>Team Size:</strong> {teamSize} Members
                      </p>
                      <p className="leading-relaxed">
                        <strong>Project Pitch:</strong> {projectDescription}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      <h4 className="text-sm font-bold text-primary-dark uppercase tracking-wide flex items-center gap-2">
                        <FileText className="h-4.5 w-4.5 text-primary-green" /> Team Roster
                      </h4>
                      <div className="grid grid-cols-1 gap-3 max-h-[220px] overflow-y-auto pr-1">
                        {members.slice(0, teamSize).map((m, i) => (
                          <div key={i} className="p-3 bg-white border border-gray-150 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-primary-dark">
                                {m.name} {i === 0 && <span className="text-[10px] bg-primary-green/10 text-primary-green px-1.5 py-0.5 rounded border border-primary-green/10 ml-1.5">Leader</span>}
                              </p>
                              <p className="text-[10px] text-gray-500">
                                {m.registerNumber} | {m.department}
                              </p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{m.year}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="flex gap-4 mt-10 border-t border-gray-100 pt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-5 py-3 rounded-xl border border-input-border/50 text-primary-dark font-bold text-xs hover:bg-card-bg/25 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" /> Previous
                  </button>
                )}
                {step < 4 ? (
                  <Button type="button" onClick={handleNext} className="ml-auto gap-1.5">
                    Next Step <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} isLoading={submitting} className="ml-auto gap-1.5">
                    Submit Registration <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            /* Success Screen */
            <motion.div
              key="success-screen"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="rounded-3xl border border-input-border/30 bg-white p-8 sm:p-12 shadow-2xl text-center flex flex-col items-center gap-5 relative z-10"
            >
              <div className="h-16 w-16 rounded-full bg-card-bg text-primary-green flex items-center justify-center shadow-inner border border-input-border/30 animate-bounce-slow">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight text-primary-dark">
                Registration Confirmed!
              </h2>
              <div className="max-w-md text-xs sm:text-sm text-gray-500 leading-relaxed flex flex-col gap-3 font-semibold">
                <p>
                  Your registration form has been loaded into our system. An audit has been scheduled with the college registry.
                </p>
                <div className="p-4 rounded-2xl bg-card-bg border border-input-border/30 text-primary-dark mt-2">
                  <p className="font-extrabold">Registered Team: {teamName}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-widest">
                    Status: PENDING AUDIT (Review on Admin Panel)
                  </p>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  You are now automatically authenticated as the team leader. Use the link below to enter your workspace sandbox.
                </p>
              </div>
              <Button onClick={() => router.push("/dashboard")} className="mt-4 px-8 py-3.5 rounded-xl font-bold">
                Go to Dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </PageWrapper>
  );
}
