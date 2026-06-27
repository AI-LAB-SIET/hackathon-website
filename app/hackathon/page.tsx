"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { datasets } from "@/lib/resources";
import {
  Info,
  MapPin,
  Layers,
  Calendar,
  ShieldAlert,
  Award,
  HelpCircle,
  BookOpen,
  Database,
  ExternalLink,
} from "lucide-react";

type TabType = "overview" | "tracks" | "timeline" | "rules" | "datasets" | "faq";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Info className="h-4 w-4" /> },
  { id: "tracks", label: "Tracks", icon: <Layers className="h-4 w-4" /> },
  { id: "timeline", label: "Schedule", icon: <Calendar className="h-4 w-4" /> },
  { id: "rules", label: "Guidelines", icon: <ShieldAlert className="h-4 w-4" /> },
  { id: "datasets", label: "Datasets", icon: <Database className="h-4 w-4" /> },
  { id: "faq", label: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
];

const tracks = [
  { title: "Generative AI & LLMs", desc: "Build systems utilizing localized Large Language Models, custom agents, RAG pipelines, or autonomous tool callers.", color: "from-emerald-600 to-teal-500" },
  { title: "AI in Healthcare", desc: "Predictive diagnostics, lab report parsing, bioinformatics molecular docking, or real-time patient monitoring tools.", color: "from-blue-600 to-indigo-500" },
  { title: "Smart Campus Solutions", desc: "Automate college logistics, smart library records, academic advisory chatbots, or classroom analytics platforms.", color: "from-amber-500 to-orange-500" },
  { title: "Decentralized AI Agents", desc: "Develop autonomous software agents running multi-agent negotiations, smart grid controls, or autonomous web scrapers.", color: "from-purple-600 to-violet-500" },
];

const timelineSteps = [
  { num: "01", date: "June 25, 2026", title: "Registrations Open", desc: "Submit member registry, department details, and roll numbers.", status: "completed" },
  { num: "02", date: "July 05, 2026", title: "Idea Abstract Deadline", desc: "Upload a 2-page PDF detailing your AI solution architecture & datasets.", status: "ongoing" },
  { num: "03", date: "July 12, 2026", title: "Shortlist Broadcast", desc: "Top 20 teams selected to receive cloud GPU credit credentials.", status: "upcoming" },
  { num: "04", date: "July 18, 2026", title: "24-Hour Physical Hackathon", desc: "Live coding sprint, mentor clinics, and review checkpoints at SIET AI Lab.", status: "upcoming" },
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
  { q: "What is the registration fee?", a: "There is absolutely no registration fee. The event is fully sponsored by the SIET AI Research Lab." },
  { q: "What hardware support will be provided?", a: "Each shortlisted team will be provided with high-speed Wi-Fi, desk space, and power connections in the AI Lab. All teams also receive ₹5,000 in GPU cloud credits." },
  { q: "Can we modify our team members after registration?", a: "Team rosters can be managed inside the workspace up until the abstract submission deadline on July 5th." },
  { q: "Who can I contact if I face errors?", a: "You can submit support tickets directly from the dashboard workspace, join our official Discord server, or email the organizing desk." },
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

export default function HackathonPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);

  const selectedTrackData = selectedTrack !== null ? tracks[selectedTrack] : null;

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="relative py-16 bg-card-bg/20 border-b border-input-border/15 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-green/5 blur-[120px]" />
        <div className="max-w-[1440px] mx-auto px-6 text-center flex flex-col items-center gap-3 relative z-10">
          <span className="text-[10px] sm:text-xs font-bold text-primary-green uppercase tracking-widest bg-card-bg px-3 py-1 rounded-full border border-input-border/20">
            Ecosystem Directory
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark">
            Hackathon Blueprint
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-semibold leading-relaxed">
            Everything you need to understand about the AI Hack Lab rules, timeline, tracks, evaluation models, and prizes.
          </p>
        </div>
      </section>

      {/* Tabs Selector Navigation */}
      <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 py-4 shadow-sm">
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
                    : "bg-card-bg/40 text-gray-600 hover:bg-card-bg hover:text-primary-dark"
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
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight leading-tight">
                      Welcome to the AI Hack Lab 2026
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      The SIET AI Research Lab Hackathon challenges student developers to move beyond simple boilerplate code. Our 24-hour physical sprint offers direct access to top deep learning mentors, cloud infrastructure, and a dedicated platform workspace.
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-medium">
                      This year, we focus on <span className="font-bold">Agentic Intelligence</span>—autonomous software agents that can reason, orchestrate APIs, and deliver end-to-end user flows.
                    </p>
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700 mt-2">
                      <span className="flex items-center gap-1 bg-card-bg px-3 py-1.5 rounded-lg border border-input-border/20">
                        <MapPin className="h-4 w-4 text-primary-green" /> Main Research Lab, SIET
                      </span>
                      <span className="flex items-center gap-1 bg-card-bg px-3 py-1.5 rounded-lg border border-input-border/20">
                        <Calendar className="h-4 w-4 text-primary-green" /> 24 Hrs Physical
                      </span>
                    </div>
                  </div>

                  <div className="p-8 rounded-3xl border border-input-border/30 bg-card-bg/25 flex flex-col gap-4 relative overflow-hidden shadow-inner">
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-accent-yellow/10 blur-3xl" />
                    <h3 className="text-lg font-extrabold text-primary-dark tracking-tight flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary-green" /> Participant Journey Map
                    </h3>
                    <ul className="flex flex-col gap-3.5 text-xs text-primary-dark font-bold mt-2">
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
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">Winner Recognition</h2>
                    <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg">Competitors stand a chance to claim trophies and cash prize allocations.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {prizes.map((p, idx) => (
                      <div key={idx} className={`border rounded-3xl p-6 text-center flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all ${p.glow}`}>
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary-green to-accent-green text-white font-extrabold flex items-center justify-center text-sm shadow">
                          <Award className="h-6 w-6" />
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-primary-dark mt-1">{p.title}</h4>
                        <span className="text-xl sm:text-2xl font-black text-primary-green">{p.amount}</span>
                        <p className="text-xs text-gray-500 leading-relaxed font-semibold">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TRACKS TAB */}
            {activeTab === "tracks" && (
              <div>
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">Event Tracks</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg">Choose a track that matches your team interest and outline it in your slide deck abstract.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {tracks.map((t, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTrack(idx)}
                      className="border border-input-border/30 rounded-3xl p-6 bg-white shadow-sm flex flex-col gap-3 relative overflow-hidden group hover:border-primary-green/30 transition-all duration-300 text-left cursor-pointer"
                    >
                      <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${t.color}`} />
                      <h4 className="text-base sm:text-lg font-extrabold text-primary-dark ml-2 group-hover:text-primary-green transition-colors">{t.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold ml-2">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TRACK MODAL */}
            <Modal
              isOpen={selectedTrackData !== null}
              onClose={() => setSelectedTrack(null)}
              title={selectedTrackData?.title ?? ""}
            >
              {selectedTrackData && (
                <div className="flex flex-col gap-4">
                  <div className={`h-1.5 w-full rounded-full bg-gradient-to-r ${selectedTrackData.color}`} />
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {selectedTrackData.desc}
                  </p>
                </div>
              )}
            </Modal>

            {/* TIMELINE TAB */}
            {activeTab === "timeline" && (
              <div>
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">Interactive Timeline</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg">Stay updated on submission closings and review stages.</p>
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
                            <div className={`w-10 h-10 rounded-full border-2 ${style.border} bg-white flex items-center justify-center`}>
                              <div className={`w-3 h-3 rounded-full ${style.dot}`} />
                            </div>
                          </div>

                          {/* Content */}
                          <div className={`flex-1 p-4 rounded-2xl border ${style.border} bg-white hover:shadow-md transition-all duration-200`}>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                              <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark">{step.title}</h4>
                              <span className="text-[10px] text-gray-400 font-bold">{step.date}</span>
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">{step.desc}</p>
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
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">Guidelines & Integrity</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg">All participating teams must comply with the academic guidelines vetted by the college board.</p>
                </div>
                <div className="rounded-3xl border border-red-150/40 bg-red-50/5 p-6 flex flex-col gap-4">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex gap-3 items-start hover:bg-gray-50 p-2.5 rounded-xl transition-colors">
                      <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold">{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DATASETS TAB */}
            {activeTab === "datasets" && (
              <div>
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">Curated Datasets</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg">Curated open datasets across all hackathon tracks. Download, stream, or query directly in your notebooks.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                  {datasets.map((item, i) => (
                    <motion.a
                      key={item.title}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.35 }}
                      className="group flex flex-col gap-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-primary-green/30 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-primary-dark text-base leading-tight group-hover:text-primary-green transition-colors">
                          {item.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                              {item.badge}
                            </span>
                          )}
                          <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-green transition-colors" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ TAB */}
            {activeTab === "faq" && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10 flex flex-col items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">Frequently Asked Questions</h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-semibold max-w-lg">Find answers regarding schedules, rules, support desks, and logistics.</p>
                </div>
                <div className="flex flex-col gap-4">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-white border border-input-border/20 rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                      <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark flex gap-2 items-center">
                        <HelpCircle className="h-4.5 w-4.5 text-primary-green shrink-0" />
                        <span>{faq.q}</span>
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold pl-6">{faq.a}</p>
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
