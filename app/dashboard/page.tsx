"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  FolderOpen,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  Users,
} from "lucide-react";

export default function ParticipantDashboard() {
  const router = useRouter();
  const { session, teams, announcements } = useAppState();
  const [mounted, setMounted] = useState(false);

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

  // Find the user's team
  const userTeam = teams.find((t) => t.id === session.teamId);

  if (!userTeam) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-red-500">
        Team profile not found. Try logging in again.
      </div>
    );
  }

  const leader = userTeam.members.find((m) => m.isLeader) || userTeam.members[0];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "APPROVED":
        return {
          icon: <CheckCircle className="h-10 w-10 text-emerald-600 animate-bounce-slow" />,
          title: "Registration Approved",
          desc: "Your team profile has been successfully audited against the college logs. You are eligible to participate in the physical coding sprint on July 18th.",
          badge: <Badge variant="success" pulse>Approved</Badge>,
          bg: "bg-emerald-50/30 border-emerald-100",
        };
      case "REJECTED":
        return {
          icon: <AlertTriangle className="h-10 w-10 text-red-600" />,
          title: "Registration Rejected",
          desc: "Your registration was flagged by the administrative council due to duplicate credentials or missing details. Reach out to the lab desk immediately.",
          badge: <Badge variant="danger">Rejected</Badge>,
          bg: "bg-red-50/30 border-red-100",
        };
      default:
        return {
          icon: <Clock className="h-10 w-10 text-amber-600 animate-pulse" />,
          title: "Audit in Progress",
          desc: "Your team registry is currently undergoing a credentials check with the SIET administration database. We will update your status shortly.",
          badge: <Badge variant="warning" pulse>Pending Audit</Badge>,
          bg: "bg-amber-50/20 border-amber-150",
        };
    }
  };

  const statusConfig = getStatusConfig(userTeam.status);

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Welcome, {userTeam.name}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Workspace Sandbox | Leader: {leader.name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-bold hidden sm:inline">
              Team ID: <code className="text-primary-green bg-card-bg px-2 py-1 rounded border border-input-border/25">{userTeam.id}</code>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Columns (Status & Stats) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl border p-6 flex flex-col sm:flex-row items-start gap-5 bg-white shadow-sm ${statusConfig.bg}`}
            >
              <div className="shrink-0">{statusConfig.icon}</div>
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <h3 className="text-base sm:text-lg font-bold text-primary-dark">{statusConfig.title}</h3>
                  {statusConfig.badge}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed max-w-xl">
                  {statusConfig.desc}
                </p>
                {userTeam.status === "APPROVED" && (
                  <div className="flex gap-4 mt-2">
                    <a
                      href="#"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-green hover:underline"
                    >
                      Claim Cloud GPU Token <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: "Total Members", val: `${userTeam.size} / 4`, icon: <Users className="h-4.5 w-4.5" /> },
                { label: "Milestones Cleared", val: userTeam.status === "APPROVED" ? "2 / 5" : "1 / 5", icon: <Layers className="h-4.5 w-4.5" /> },
                { label: "Physical Coding Date", val: "July 18, 2026", icon: <Calendar className="h-4.5 w-4.5" /> },
              ].map((c, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-input-border/30 bg-white shadow-sm flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                    {c.icon}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{c.label}</span>
                    <span className="text-sm font-extrabold text-primary-dark">{c.val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Team Pitch Summary */}
            <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2">
                  <FolderOpen className="h-4.5 w-4.5 text-primary-green" /> Registered Project Proposal
                </h3>
                <button
                  onClick={() => router.push("/dashboard/team")}
                  className="text-xs font-bold text-primary-green hover:underline cursor-pointer flex items-center gap-0.5"
                >
                  Manage Roster <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="p-4 rounded-2xl bg-card-bg/25 border border-input-border/15">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {userTeam.projectDescription || "No concept summary declared. Update team members list to specify details."}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (Announcements Log) */}
          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col gap-5 max-h-[550px] overflow-hidden">
              <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-100 pb-3">
                <Bell className="h-4.5 w-4.5 text-primary-green" /> Bullet Announcements
              </h3>

              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                {announcements.map((ann) => {
                  const annColors = {
                    info: "bg-blue-50/50 border-blue-100 text-blue-800",
                    warning: "bg-amber-50/50 border-amber-100 text-amber-800",
                    success: "bg-emerald-50/50 border-emerald-100 text-emerald-800",
                  };

                  const annTitles = {
                    info: "System Notice",
                    warning: "Action Required",
                    success: "Broadcast Update",
                  };

                  return (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-2xl border flex flex-col gap-1.5 transition-colors ${annColors[ann.type]}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase font-bold tracking-widest">
                          {annTitles[ann.type]}
                        </span>
                        <span className="text-[9px] text-gray-400 font-semibold">{ann.date}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark leading-tight">{ann.title}</h4>
                      <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">{ann.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </PageWrapper>
  );
}
