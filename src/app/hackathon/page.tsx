"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";

import {
  Info,
  MapPin,
  Layers,
  Calendar,
  ShieldAlert,
  Award,
  HelpCircle,
  BookOpen,
  ChevronDown,
  Paperclip,
  FileText,
  Download,
} from "lucide-react";


type TabType = "overview" | "tracks" | "timeline" | "rules" | "faq" | "problems";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },

  { id: "timeline", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
  { id: "rules", label: "Guidelines", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "faq", label: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
  { id: "problems", label: "Problem Statements", icon: <BookOpen className="h-4 w-4" /> },
];



const timelineSteps = [
  { num: "01", date: "June 25, 2026", title: "Registrations Open", desc: "Submit member registry, department details, and roll numbers.", status: "completed" },
  { num: "02", date: "July 05, 2026", title: "Idea Abstract Deadline", desc: "Upload a 2-page PDF detailing your AI solution architecture & datasets.", status: "ongoing" },
  { num: "03", date: "July 12, 2026", title: "Shortlist Broadcast", desc: "Top 20 teams selected to receive cloud GPU credit credentials.", status: "upcoming" },
  { num: "04", date: "July 18, 2026", title: "24-Hour Physical Hackathon", desc: "Live coding sprint, mentor clinics, and review checkpoints at AI Research Lab.", status: "upcoming" },
  { num: "05", date: "July 19, 2026", title: "Final Pitch & Awards", desc: "Live prototype demo to industry panels, announcements of winners.", status: "upcoming" },
];

const rules = [
  "Eligibility: Open to all current undergraduate and postgraduate engineering, technology, and science students.",
  "Team Size: Teams must consist of 2 to 4 members. Cross-department collaborations are highly encouraged.",
  "Academic Integrity: All code repositories must be hosted publicly on GitHub and created from scratch during the hackathon. Pre-existing projects are disqualified.",
  "AI Disclosure: Usage of AI coding helpers (Copilot, ChatGPT, Claude) is permitted, but must be declared in the final project disclosure form.",
  "Plagiarism: Code duplication or datasets manipulation will result in immediate termination of the registration.",
];

const prizes = [
  { title: "First Place", amount: "₹50,000", desc: "Cash prize, trophy, winner certificate, and direct incubation shortlisting.", glow: "border-amber-400 bg-amber-500/5" },
  { title: "Second Place", amount: "₹30,000", desc: "Cash prize, runner-up certificate, and AI research lab internship invites.", glow: "border-gray-300 bg-gray-500/5" },
  { title: "Best Innovative Agent", amount: "₹20,000", desc: "Dedicated recognition for outstanding autonomous agent architecture.", glow: "border-emerald-400 bg-emerald-500/5" },
];

const faqs = [
  { q: "What is the registration fee?", a: "There is absolutely no registration fee. The event is fully sponsored by the AI Research Lab." },
  { q: "What hardware support will be provided?", a: "Each shortlisted team will be provided with high-speed Wi-Fi, desk space, and power connections in the AI Lab. All teams also receive ₹5,000 in GPU cloud credits." },
  { q: "Can we modify our team members after registration?", a: "Team rosters can be managed inside the workspace up until the abstract submission deadline on July 5th." },
  { q: "Who can I contact if I face errors?", a: "You can submit support tickets directly from the dashboard workspace, join our official WhatsApp group, or email the organizing desk." },
];

const statusStyles: Record<string, { dot: string; text: string; border: string }> = {
    completed: {
      dot: "bg-emerald-500",
      text: "text-emerald-600",
      border: "border-emerald-200",
    },
    ongoing: {
      dot: "bg-amber-500 animate-pulse",
      text: "text-amber-600",
      border: "border-amber-200",
    },
    upcoming: {
      dot: "bg-gray-300",
      text: "text-gray-400",
      border: "border-gray-200",
    },
  };

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / 1000 / 60) % 60),
          s: Math.floor((diff / 1000) % 60),
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <>
      {Object.entries(timeLeft).map(([unit, val]) => (
        <div key={unit} className="flex flex-col items-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-gray-800 text-primary-dark dark:text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            {val.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase mt-2">{unit === 'd' ? 'Days' : unit === 'h' ? 'Hours' : unit === 'm' ? 'Mins' : 'Secs'}</span>
        </div>
      ))}
    </>
  );
};

export default function HackathonPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const [expandedPs, setExpandedPs] = useState<string | null>(null);

  const { problemStatements, hackathons, activeHackathonId } = useAppState();
  const publishedPs = problemStatements.filter((ps) => ps.status === "published");
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const downloadAttachment = (att: { name: string; dataUrl: string }) => {
    const link = document.createElement("a");
    link.href = att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <PageWrapper className="relative bg-white min-h-screen dark:bg-gray-950">
      <Navbar />

      {/* Header */}
      <section className="relative py-16 bg-card-bg/20 border-b border-input-border/15 overflow-hidden dark:bg-gray-800/20 dark:border-gray-700">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-green/5 blur-[120px]" />
        <div className="max-w-[1440px] mx-auto px-6 text-center flex flex-col items-center gap-3 relative z-10">
          <span className="text-[10px] sm:text-xs font-bold text-primary-green uppercase tracking-widest bg-card-bg px-3 py-1 rounded-full border border-input-border/20">
            Ecosystem Directory
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark dark:text-gray-100">
            Hackathon Blueprint
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed dark:text-gray-400">
            Everything you need to understand about the AI Hack Lab rules, timeline, problem statements, evaluation models, and prizes.
          </p>
        </div>
      </section>

      {/* Tabs Selector Navigation */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 shadow-sm dark:bg-gray-900/95 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-6 overflow-x-auto scrollbar-none flex gap-2 md:justify-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer
                  ${isActive
                    ? "bg-primary-green text-white shadow-md shadow-primary-green/10"
                    : "bg-card-bg/40 text-gray-600 hover:bg-card-bg hover:text-primary-dark dark:bg-gray-800/40 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }
                `}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab Contents */}
      <main className="max-w-[1440px] mx-auto px-6 py-12 min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                  <div className="flex flex-col gap-5">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight leading-tight dark:text-gray-100">
                      Welcome to the AI Hack Lab 2026
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      The AI Hackathon, conducted by AI Research Lab, challenges student developers to move beyond simple boilerplate code. Our 24-hour physical sprint offers direct access to top deep learning mentors, cloud infrastructure, and a dedicated platform workspace.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      This year, we focus on <span className="font-bold">Agentic Intelligence</span>—autonomous software agents that can reason, orchestrate APIs, and deliver end-to-end user flows.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700 mt-2 dark:text-gray-300">
                      <span className="flex items-center gap-1 bg-card-bg px-3 py-1.5 rounded-lg border border-input-border/20">
                        <MapPin className="h-4 w-4 text-primary-green" /> Main Research Lab
                      </span>
                      <span className="flex items-center gap-1 bg-card-bg px-3 py-1.5 rounded-lg border border-input-border/20">
                        <Calendar className="h-4 w-4 text-primary-green" /> 24 Hrs Physical
                      </span>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl border border-input-border/30 bg-card-bg/25 flex flex-col gap-4 relative overflow-hidden shadow-inner">
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-accent-yellow/10 blur-3xl" />
                      <h3 className="text-lg font-extrabold text-primary-dark tracking-tight flex items-center gap-2 dark:text-gray-100">
                      <BookOpen className="h-5 w-5 text-primary-green" /> Participant Journey Map
                    </h3>
                    <ul className="flex flex-col gap-3.5 text-xs text-primary-dark font-bold mt-2 dark:text-gray-200">
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">1</span>
                        <span>Form team & submit idea abstract</span>
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Claim GPU credits on shortlisting</span>
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Iterate prototype with live mentor feedback</span>
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Submit repos and pitch to judges</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Prizes (moved from standalone tab) */}
                <div>
                  <div className="text-center mb-10 flex flex-col items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Winner Recognition</h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">Competitors stand a chance to claim trophies and cash prize allocations.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {prizes.map((p, idx) => (
                      <div key={idx} className={`border rounded-3xl p-6 text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all dark:bg-gray-900 dark:border-gray-700 ${p.glow}`}>
                        <div className="h-12 w-12 rounded-full bg-linear-to-tr from-primary-green to-accent-green text-white font-extrabold flex items-center justify-center text-sm shadow">
                          <Award className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-primary-dark mt-1 dark:text-gray-100">{p.title}</h4>
                        <span className="text-xl sm:text-2xl font-black text-primary-green">{p.amount}</span>
                        <p className="text-xs text-gray-500 leading-relaxed font-semibold dark:text-gray-400">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === "timeline" && (
              <div>
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Interactive Timeline</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">Stay updated on submission closings and review stages.</p>
                </div>
                
                {/* Live Timer & Host Info */}
                <div className="max-w-2xl mx-auto bg-card-bg/30 border border-input-border/30 rounded-3xl p-8 mb-12 shadow-sm text-center">
                  <h3 className="text-lg font-extrabold text-primary-dark dark:text-gray-100 mb-6 flex items-center justify-center gap-2">
                    <Calendar className="h-5 w-5 text-primary-green" /> 
                    Countdown to Hackathon Day
                  </h3>
                  <div className="flex gap-4 sm:gap-6 justify-center mb-8">
                    <CountdownTimer targetDate={activeHackathonId ? hackathons.find(h => h.id === activeHackathonId)?.startDate || "2026-07-06T00:00:00" : "2026-07-06T00:00:00"} />
                  </div>
                  <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 dark:border-emerald-800">
                    <MapPin className="h-4 w-4" /> 
                    Hosted by: {activeHackathonId ? hackathons.find(h => h.id === activeHackathonId)?.venue || "AI Research Lab, SIET" : "AI Research Lab, SIET"}
                  </div>
                </div>
                
                <div className="relative max-w-3xl mx-auto">
                  {/* Vertical line */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="flex flex-col gap-0">
                    {timelineSteps.map((step, idx) => {
                      const style = statusStyles[step.status] ?? statusStyles.upcoming;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -30 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, amount: 0.3 }}
                          transition={{ duration: 0.4, delay: idx * 0.1 }}
                          className="relative flex gap-5 py-6"
                        >
                          {/* Status dot */}
                          <div className="relative z-10 flex items-start pt-1">
                            <div className={`w-10 h-10 rounded-full border-2 ${style.border} bg-white dark:bg-gray-900 flex items-center justify-center`}>
                              <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                            </div>
                          </div>

                          {/* Content */}
                          <div className={`flex-1 p-4 rounded-2xl border ${style.border} bg-white hover:shadow-md transition-all duration-200 dark:bg-gray-900`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark dark:text-gray-100">{step.title}</h4>
                              <span className="text-[10px] text-gray-400 font-bold dark:text-gray-500">{step.date}</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1 dark:text-gray-400">{step.desc}</p>
                            <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider ${style.text}`}>
                              {step.status}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* RULES TAB */}
            {activeTab === "rules" && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Guidelines & Integrity</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">All participating teams must comply with the academic guidelines vetted by the college board.</p>
                </div>
                <div className="rounded-3xl border border-red-150/40 bg-red-50/5 p-6 flex flex-col gap-4">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-3 items-start hover:bg-gray-50 p-2.5 rounded-xl transition-colors dark:hover:bg-gray-800">
                      <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold dark:text-gray-400">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ TAB */}
            {activeTab === "faq" && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Frequently Asked Questions</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">Find answers regarding schedules, rules, support desks, and logistics.</p>
                </div>
                <div className="flex flex-col gap-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white border border-input-border/20 rounded-2xl p-5 flex flex-col gap-2 shadow-sm dark:bg-gray-900 dark:border-gray-700">
                      <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark flex gap-2 items-center dark:text-gray-100">
                        <HelpCircle className="h-4.5 w-4.5 text-primary-green shrink-0" />
                        <span>{faq.q}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold pl-6 dark:text-gray-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PROBLEMS TAB */}
            {activeTab === "problems" && (
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Problem Statements</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">
                    Official problem statements published by the organizing team. Expand each card to read the full explanation and download any attached materials.
                  </p>
                </div>

                {publishedPs.length === 0 ? (
                  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-input-border/20 dark:border-gray-700 p-16 text-center shadow-sm">
                    <BookOpen className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 font-semibold text-sm">No problem statements published yet.</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Check back closer to the hackathon start date.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {publishedPs.map((ps, idx) => {

                      const isExpanded = expandedPs === ps.id;
                      return (
                        <motion.div
                          key={ps.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.06 }}
                          className="bg-white dark:bg-gray-900 rounded-3xl border border-input-border/20 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                          <button
                            onClick={() => setExpandedPs(isExpanded ? null : ps.id)}
                            className="w-full p-6 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-green/20 to-teal-500/20 flex items-center justify-center shrink-0 border border-primary-green/10">
                                <BookOpen className="h-6 w-6 text-primary-green" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <h3 className="text-sm sm:text-base font-extrabold text-primary-dark dark:text-gray-100">{ps.title}</h3>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                                  {ps.description}
                                </p>
                              </div>
                            </div>
                            <ChevronDown className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-5 space-y-4">
                                  {/* Full description */}
                                  <div className="bg-gradient-to-br from-gray-50 to-emerald-50/30 dark:from-gray-800/60 dark:to-emerald-900/10 rounded-2xl p-5">
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Full Problem Statement</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{ps.description}</p>
                                  </div>

                                  {/* Attachments */}
                                  {ps.attachments && ps.attachments.length > 0 && (
                                    <div>
                                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                        <Paperclip className="h-3 w-3" /> Attached Files ({ps.attachments.length})
                                      </p>
                                      <div className="flex flex-col gap-2">
                                        {ps.attachments.map((att) => (
                                          <div key={att.id} className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                                <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                                              </div>
                                              <div className="min-w-0">
                                                <p className="font-bold text-sm text-gray-800 dark:text-gray-100 truncate">{att.name}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{formatFileSize(att.size)}</p>
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => downloadAttachment(att)}
                                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-green text-white text-xs font-bold hover:bg-primary-dark cursor-pointer transition-colors shrink-0"
                                            >
                                              <Download className="h-3.5 w-3.5" /> Download
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </PageWrapper>
  );
}
