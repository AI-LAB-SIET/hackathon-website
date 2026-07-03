"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CinematicHero } from "@/components/layout/CinematicHero";
import { FeatureCard } from "@/components/cards/FeatureCard";
import { FAQSection } from "@/components/cards/FAQSection";
import { useAppState } from "@/components/layout/StateProvider";
import {
  Cpu,
  Brain,
  Zap,
  Award,
  Users,
  Clock,
  ExternalLink,
  BookOpen,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [isLive, setIsLive] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
        setIsLive(true);
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

  if (isLive) {
    return (
      <span className="text-emerald-500 font-extrabold flex items-center gap-1 text-[10px] animate-pulse">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> LIVE NOW
      </span>
    );
  }

  return (
    <div className="flex gap-1.5 text-[10px] font-bold text-gray-300">
      <span>Starts in:</span>
      {timeLeft.d > 0 && <span>{timeLeft.d}d</span>}
      <span>{timeLeft.h.toString().padStart(2, "0")}h</span>
      <span>{timeLeft.m.toString().padStart(2, "0")}m</span>
      <span>{timeLeft.s.toString().padStart(2, "0")}s</span>
    </div>
  );
};

export default function Home() {
  const { session, hackathons, teams } = useAppState();
  const [stats, setStats] = useState({ events: 0, participants: 0, projects: 0, prizePool: 0 });
  const [activeStep, setActiveStep] = useState(0);

  const getTopThreeTeams = (hackathonId: string) => {
    const filtered = teams.filter((t) => t.hackathonId === hackathonId && t.status === "APPROVED");
    const scored = filtered.map((t) => {
      const evals = t.evaluations || [];
      if (evals.length === 0) return { ...t, avgScore: 0 };
      const sum = evals.reduce((acc, ev) => {
        const scoreSum = ev.innovation + ev.feasibility + ev.presentation + (ev.technicalDepth ?? 0) + (ev.aiUsage ?? 0);
        return acc + scoreSum / 5;
      }, 0);
      return { ...t, avgScore: Math.round((sum / evals.length) * 10) / 10 };
    });
    return scored.sort((a, b) => b.avgScore - a.avgScore).slice(0, 3);
  };

  const statsRef = useRef(null);
  const isInView = useInView(statsRef, { once: true, margin: "-100px" });

  // Stagger stats counting upwards
  useEffect(() => {
    if (!isInView) return;

    const duration = 1200; // ms
    let startTime: number;

    const animateStats = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const easedProgress = progress * (2 - progress);

      setStats({
        events: Math.floor(easedProgress * 80),
        participants: Math.floor(easedProgress * 100),
        projects: Math.floor(easedProgress * 24),
        prizePool: Math.floor(easedProgress * 15),
      });

      if (progress < 1) {
        requestAnimationFrame(animateStats);
      }
    };

    requestAnimationFrame(animateStats);
  }, [isInView]);

  const features = [
    {
      title: "For Organizers",
      description: "Easily spin up, customized, trackable hackathons. Manage registrations, review submissions, and coordinate judging tables.",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "For Participants",
      description: "Discover upcoming challenges, form cross-functional teams, and deploy production-grade software projects.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "For Judges & Mentors",
      description: "Structured evaluation frameworks, live review queues, and direct communication lines to mentor builders.",
      icon: <Award className="h-6 w-6" />,
    },
    {
      title: "Developer Integrations",
      description: "Seamless access to cloud credits, Git repository verification, and deployment pipelines.",
      icon: <Cpu className="h-6 w-6" />,
    },
  ];

  return (
    <PageWrapper className="dark relative bg-gray-950 min-h-screen text-white">
      <Navbar />

      {/* Hero Section — cinematic looping video background */}
      <CinematicHero session={session} />

      {/* <section ref={statsRef} className="py-12 bg-white/5 backdrop-blur-md border-y border-white/10 relative"> ... </section> */}
      {/* <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-6 relative"> ... </section> */}

      {/* Featured Hackathons Section */}
      <section className="py-24 bg-background relative z-10">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-4 mb-16">
            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-muted-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Events
            </span>
            <h2 className="text-4xl sm:text-6xl font-normal text-foreground tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Featured Hackathons
            </h2>
            <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
              Explore current and upcoming developer sprints. Register, join a team, and showcase your solutions.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-5 mb-8">
            {hackathons.filter(h => h.status === 'active' || h.status === 'upcoming').slice(0, 3).map((hackathon, idx) => {
              const isLive = hackathon.status === 'active';
              const topTeams = isLive ? getTopThreeTeams(hackathon.id) : [];
              return (
                <motion.div
                  key={hackathon.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -4, border: "1px solid rgba(255,255,255,0.2)" }}
                  className="liquid-glass rounded-[2rem] p-8 flex flex-col gap-5 transition-all duration-300 min-h-[360px] w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] max-w-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                     <div className="flex items-start gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                        <Calendar className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                        <h3 className="font-medium text-foreground text-base leading-tight mb-0.5 truncate">{hackathon.name}</h3>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                          {new Date(hackathon.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {isLive ? (
                      <span className="shrink-0 text-[10px] font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" /> LIVE
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-white/5 border border-white/10 px-2.5 py-1 rounded-full uppercase">
                        UPCOMING
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {hackathon.description}
                  </p>

                  {/* Dynamic Content Pane: Countdown vs Live Leaderboard */}
                  <div className="flex-1 flex flex-col justify-center py-2">
                    {!isLive ? (
                      <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-1.5">
                        <CountdownTimer targetDate={hackathon.startDate} />
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                        <h4 className="text-xs text-foreground font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                          🏆 Live Leaderboard
                        </h4>
                        {topTeams.length === 0 ? (
                          <p className="text-[11px] text-muted-foreground italic">Leaderboard updating live...</p>
                        ) : (
                          <div className="space-y-2 text-sm">
                            {topTeams.map((team, rankIndex) => {
                              const badge = rankIndex === 0 ? "🥇" : rankIndex === 1 ? "🥈" : "🥉";
                              return (
                                <div key={team.id} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-xl border border-white/5">
                                  <span className="truncate font-medium max-w-[130px] text-foreground">{badge} {team.name}</span>
                                  <span className="font-medium text-muted-foreground text-xs">{team.avgScore > 0 ? `${team.avgScore}/10` : "Unevaluated"}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={isLive ? `/results?h=${hackathon.slug}` : `/register?h=${hackathon.slug}`}
                    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-foreground bg-white/5 hover:bg-white/10 border border-white/10 transition-colors py-3.5 rounded-full text-center w-full mt-auto"
                  >
                    {isLive ? "View Full Standings" : "Register Now"} <ChevronRight className="h-4 w-4" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="text-center">
            <Link
              href="/hackathon"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-primary-green text-primary-green font-bold text-sm hover:bg-primary-green hover:text-white transition-all duration-200"
            >
              View all hackathons <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white/2 backdrop-blur-md border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-start gap-4 max-w-md">
            <span className="px-2.5 py-1 rounded-lg bg-primary-green/10 text-primary-green font-bold text-[10px] sm:text-xs uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              A Structured Journey from Idea to Deployment
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              We guide participants from finding the right hackathon to deploying functional projects. Our platform connects you with mentors and provides essential tools.
            </p>
            <Link
              href="/hackathon"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-green hover:text-white transition-colors mt-2"
            >
              Explore the platform <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex-1 w-full flex flex-col gap-4 max-w-lg">
            {[
              { num: "01", title: "Find a Hackathon", desc: "Browse featured events and register your team.", detail: "Explore upcoming events in AI, Web3, and more." },
              { num: "02", title: "Build a Team", desc: "Collaborate with talented developers.", detail: "Invite friends or join a team seeking your skills." },
              { num: "03", title: "Submit Project", desc: "Upload your code and demo video.", detail: "Submit your final architecture, repository, and pitches." },
              { num: "04", title: "Win Prizes", desc: "Get evaluated by experts.", detail: "Track your live leaderboard ranking and receive feedback." },
            ].map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <motion.div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex gap-4 cursor-pointer select-none
                    ${
                      isActive
                        ? "border-primary-green bg-primary-green/5 shadow-lg shadow-primary-green/5"
                        : "border-white/5 bg-white/5 hover:border-primary-green/20 hover:bg-white/10"
                    }
                  `}
                  whileHover={{ x: 6 }}
                >
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black border transition-colors ${isActive ? "bg-primary-green text-white border-primary-green" : "bg-transparent text-gray-400 border-white/10"}`}>
                      {step.num}
                    </div>
                    {idx !== 3 && <div className={`w-0.5 h-full min-h-[30px] rounded-full transition-colors ${isActive ? "bg-primary-green/30" : "bg-white/10"}`}></div>}
                  </div>
                  <div className="flex flex-col py-1 pb-4">
                    <h4 className={`text-sm font-extrabold mb-1 transition-colors ${isActive ? "text-white" : "text-gray-400"}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400 font-semibold mb-2">
                      {step.desc}
                    </p>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[11px] text-gray-400 leading-relaxed border-l-2 border-primary-green/30 pl-3 mt-1"
                        >
                          {step.detail}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 max-w-[1440px] mx-auto px-6">
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-400 leading-relaxed">
            Have questions about formatting, cloud platform credits, or criteria? Find quick resolutions below.
          </p>
        </div>
        <FAQSection />
      </section>

      <Footer />
    </PageWrapper>
  );
}
