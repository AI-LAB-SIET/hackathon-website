"use client";

import React, { useState } from "react";
import Link from "next/link";
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


type TabType = "overview" | "tracks" | "timeline" | "rules" | "faq";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },

  { id: "timeline", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
  { id: "rules", label: "Guidelines", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "faq", label: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
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
  { title: "Cash Rewards", amount: "Varies", desc: "Each hackathon features its own cash prize pool dedicated to rewarding top solutions.", glow: "border-amber-400 bg-amber-500/5" },
  { title: "Certificate Credentials", amount: "Verified", desc: "Earn official blockchain-verifiable certificates validating your project submission and role.", glow: "border-gray-300 bg-gray-500/5" },
  { title: "Incubation & Internships", amount: "Direct Access", desc: "Top builders gain direct entry to incubation reviews and internship pipelines at SIET partner labs.", glow: "border-emerald-400 bg-emerald-500/5" },
];

const faqs = [
  { q: "What is the registration fee?", a: "There is absolutely no registration fee. All hackathons hosted on SIET_HACKATHONS are free to join for eligible students." },
  { q: "How are the events conducted?", a: "Depending on the specific hackathon, events can be fully virtual, hybrid, or physical sprints hosted at the college campuses (like the AI Research Lab)." },
  { q: "Can I participate in multiple hackathons?", a: "Yes, you can register for any active hackathon. However, you can only belong to one team per specific hackathon." },
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
            SIET_HACKATHONS Directory
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed dark:text-gray-400">
            Explore active hackathons, review general platform guidelines, and find answers to frequently asked questions.
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
                      Welcome to SIET_HACKATHONS
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      Our platform brings together the brightest minds to solve challenging problems. Host, manage, or participate in physical, hybrid, and virtual developer sprints designed to push your technical capabilities to the next level.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      Gain access to dedicated student communities, collaborate on open-source code repositories, receive expert engineering mentorship, and showcase working prototypes to industry experts.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700 mt-2 dark:text-gray-300">
                      <span className="flex items-center gap-1 bg-card-bg px-3 py-1.5 rounded-lg border border-input-border/20">
                        <MapPin className="h-4 w-4 text-primary-green" /> Partner Campus Labs
                      </span>
                      <span className="flex items-center gap-1 bg-card-bg px-3 py-1.5 rounded-lg border border-input-border/20">
                        <Calendar className="h-4 w-4 text-primary-green" /> Active Hackathons
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
                        <span>Find an active hackathon and register</span>
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">2</span>
                        <span>Form a team or join an open roster</span>
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">3</span>
                        <span>Build and iterate with mentor guidance</span>
                      </li>
                      <li className="flex gap-2.5 items-center">
                        <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-[10px]">4</span>
                        <span>Submit repository and present layout</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Prizes (moved from standalone tab) */}
                <div>
                  <div className="text-center mb-10 flex flex-col items-center gap-2">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Platform Benefits</h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">Stand out, earn credentials, and showcase your engineering prowess.</p>
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
              <div className="flex flex-col gap-8">
                <div className="text-center mb-6 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">Hackathon Schedule</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg dark:text-gray-400">List of all active and upcoming hackathons. Join and build something amazing!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                  {hackathons
                    .filter((h) => h.status === "active" || h.status === "upcoming")
                    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                    .map((h) => (
                      <div key={h.id} className="bg-card-bg/30 border border-input-border/30 rounded-3xl p-8 shadow-sm flex flex-col gap-6 text-center justify-between">
                        <div>
                          <h3 className="text-xl font-extrabold text-primary-dark dark:text-gray-100 mb-2">
                            {h.name}
                          </h3>
                          <p className="text-xs text-gray-400 mb-4 dark:text-gray-500">
                            {h.venue || "SIET"} | {new Date(h.startDate).toLocaleDateString()} - {new Date(h.endDate).toLocaleDateString()}
                          </p>
                          <div className="flex gap-3 justify-center mb-6">
                            <CountdownTimer targetDate={h.startDate} />
                          </div>
                        </div>
                        <Link
                          href={`/register?h=${h.slug}`}
                          className="w-full py-3 px-4 rounded-xl bg-primary-green hover:bg-primary-dark text-white text-xs font-bold text-center transition-colors shadow-md shadow-primary-green/10"
                        >
                          Login
                        </Link>
                      </div>
                    ))}
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


          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </PageWrapper>
  );
}
