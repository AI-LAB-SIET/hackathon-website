"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Participant } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, ShieldCheck, Mail, Github, Users } from "lucide-react";

export default function TeamManagement() {
  const router = useRouter();
  const { session, teams, updateTeamMembers } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Form state for adding member
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState("3rd Year");
  const [skillsStr, setSkillsStr] = useState("");
  const [github, setGithub] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "participant")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "participant") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500">
        Loading workspace...
      </div>
    );
  }

  const userTeam = teams.find((t) => t.id === session.teamId);

  if (!userTeam) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-red-500">
        Team profile not found.
      </div>
    );
  }

  const handleRemoveMember = (reg: string) => {
    // Basic boundaries checks
    const targetMember = userTeam.members.find((m) => m.registerNumber === reg);
    if (!targetMember) return;

    if (targetMember.isLeader) {
      toast("The Team Leader cannot be removed from the team roster.", "error");
      return;
    }

    if (userTeam.members.length <= 2) {
      toast("A team must have at least 2 members to compete.", "error");
      return;
    }

    const updatedMembers = userTeam.members.filter((m) => m.registerNumber !== reg);
    updateTeamMembers(userTeam.id, updatedMembers);
    toast(`Successfully removed ${targetMember.name} from the roster.`, "info");
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let valid = true;

    if (!name.trim()) {
      errs.name = "Name is required";
      valid = false;
    }
    if (!regNum.trim()) {
      errs.regNum = "Register number is required";
      valid = false;
    } else if (userTeam.members.some((m) => m.registerNumber.toLowerCase() === regNum.trim().toLowerCase())) {
      errs.regNum = "Register number already exists in this team";
      valid = false;
    }
    if (!email.trim()) {
      errs.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Enter a valid email format";
      valid = false;
    } else if (userTeam.members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
      errs.email = "Email address is already in use by a teammate";
      valid = false;
    }
    if (!dept.trim()) {
      errs.dept = "Department is required";
      valid = false;
    }

    setErrors(errs);

    if (!valid) {
      toast("Invalid input coordinates.", "error");
      return;
    }

    // Add member
    const newMember: Participant = {
      name: name.trim(),
      registerNumber: regNum.trim().toUpperCase(),
      email: email.trim(),
      phone: "N/A",
      department: dept.trim(),
      year,
      skills: skillsStr ? skillsStr.split(",").map((s) => s.trim()).filter((s) => s.length > 0) : [],
      github: github.trim() || undefined,
    };

    const updatedMembers = [...userTeam.members, newMember];
    updateTeamMembers(userTeam.id, updatedMembers);

    // Reset Form
    setName("");
    setRegNum("");
    setEmail("");
    setDept("");
    setYear("3rd Year");
    setSkillsStr("");
    setGithub("");
    setErrors({});
    setIsModalOpen(false);

    toast(`Added ${newMember.name} to the team roster.`, "success");
  };

  const yearsList = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Postgraduate"];

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Team Roster Management
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Review teammate credentials or modify entries for {userTeam.name}.
            </p>
          </div>

          <Button
            onClick={() => {
              if (userTeam.members.length >= 4) {
                toast("You have reached the maximum allowed team size of 4.", "warning");
              } else {
                setIsModalOpen(true);
              }
            }}
            disabled={userTeam.members.length >= 4}
            className="gap-1.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" /> Add Teammate
          </Button>
        </div>

        {/* Members Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {userTeam.members.map((m) => (
              <motion.div
                key={m.registerNumber}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-3xl border border-input-border/30 p-6 shadow-sm flex flex-col justify-between gap-5 relative overflow-hidden"
              >
                {/* Decorative background shape */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary-green/5 blur-xl pointer-events-none" />

                {/* Profile Detail */}
                <div className="flex items-start gap-4">
                  <Avatar name={m.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-primary-dark truncate max-w-[140px] sm:max-w-none">
                        {m.name}
                      </h3>
                      {m.isLeader ? (
                        <Badge variant="primary" pulse className="px-2 py-0.5 text-[10px]">
                          Leader
                        </Badge>
                      ) : (
                        <Badge variant="info" className="px-2 py-0.5 text-[10px]">
                          Teammate
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-semibold mt-1">
                      Reg: <code className="text-primary-dark">{m.registerNumber}</code>
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 font-semibold">{m.department} | {m.year}</p>
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="flex flex-col gap-2 border-y border-gray-100 py-3 text-xs text-gray-500 font-medium">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4 w-4 text-primary-green shrink-0" />
                    <span className="truncate">{m.email}</span>
                  </div>
                  {m.github && (
                    <div className="flex items-center gap-2.5">
                      <Github className="h-4 w-4 text-primary-green shrink-0" />
                      <a href={`https://${m.github}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-green transition-colors truncate">
                        {m.github}
                      </a>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Expertise / Skills</span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.skills.length > 0 ? (
                      m.skills.map((s, i) => (
                        <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-card-bg text-primary-dark rounded-md border border-input-border/20">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 font-medium italic">No skill tags declared.</span>
                    )}
                  </div>
                </div>

                {/* Delete button (Teammates only) */}
                {!m.isLeader && (
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleRemoveMember(m.registerNumber)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-100 hover:bg-red-100/50 hover:border-red-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Remove Teammate
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Teammate Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Teammate">
          <form onSubmit={handleAddMember} className="flex flex-col gap-4">
            <Input
              label="Teammate Full Name"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />

            <Input
              label="Register Number"
              placeholder="e.g. 2022CSE0146"
              value={regNum}
              onChange={(e) => setRegNum(e.target.value)}
              error={errors.regNum}
            />

            <Input
              label="College Email ID"
              placeholder="teammate@college.edu"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="Department"
              placeholder="e.g. Information Technology"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              error={errors.dept}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary-dark select-none">Year of Study</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
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
              placeholder="React, Python, SQL"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
            />

            <Input
              label="GitHub Account URL (Optional)"
              placeholder="github.com/username"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />

            <div className="flex gap-3 justify-end mt-4 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-input-border/50 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <Button type="submit" size="sm">
                Save Teammate
              </Button>
            </div>
          </form>
        </Modal>
      </main>
    </PageWrapper>
  );
}
