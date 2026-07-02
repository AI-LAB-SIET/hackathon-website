"use client";

import React, { useEffect, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { session, hackathons } = useAppState();
  const [stats, setStats] = useState({ events: 0, participants: 0, projects: 0, prizePool: 0 });
  const [activeStep, setActiveStep] = useState(0);

  // Stagger stats counting upwards
  useEffect(() => {
    const duration = 1200; // ms
    const startTime = performance.now();

    const animateStats = (currentTime: number) => {
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
  }, []);

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

      {/* Statistics Section */}
      <section className="py-12 bg-white/5 backdrop-blur-md border-y border-white/10 relative">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: `${stats.events}+`, label: "Events Hosted", icon: <Users className="h-5 w-5" /> },
            { value: `${stats.participants}+`, label: "Active Hackers", icon: <Award className="h-5 w-5" /> },
            { value: `${stats.projects}`, label: "Projects Built", icon: <Clock className="h-5 w-5" /> },
            { value: `₹${stats.prizePool}L+`, label: "Cash Prizes", icon: <Cpu className="h-5 w-5" /> },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -6, scale: 1.03, boxShadow: "0 8px 30px rgba(88,204,2,0.15)", borderColor: "rgba(88,204,2,0.3)" }}
              className="flex flex-col items-center gap-1 p-6 rounded-3xl border border-white/5 transition-all duration-300 bg-white/5 hover:bg-white/10"
            >
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-primary-green flex items-center justify-center shadow-sm">
                {item.icon}
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-2">
                {item.value}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-green/5 blur-[120px] pointer-events-none" />
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            The Premier Hackathon Ecosystem
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-400 leading-relaxed">
            SIET_HACKATHONS powers student innovations and collaborative coding challenges across the engineering community.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, index) => (
            <FeatureCard
              key={index}
              title={f.title}
              description={f.description}
              icon={f.icon}
              delay={index * 0.1}
            />
          ))}
        </div>
      </section>

      {/* Featured Hackathons Section */}
      <section className="py-16 bg-white/2 backdrop-blur-md border-y border-white/5 relative">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-3 mb-10">
            <span className="px-3 py-1.5 rounded-full bg-primary-green/10 border border-primary-green/20 text-primary-green text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> Active Events
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Featured Hackathons
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-gray-400 leading-relaxed">
              Explore current and upcoming developer sprints hosted on SIET_HACKATHONS. Register, join a team, and showcase your solutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {hackathons.filter(h => h.status === 'active' || h.status === 'upcoming').slice(0, 3).map((hackathon, idx) => (
              <motion.div
                key={hackathon.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -4, border: "1px solid rgba(88,204,2,0.3)", backgroundColor: "rgba(255,255,255,0.08)", boxShadow: "0 12px 40px rgba(88,204,2,0.12)" }}
                className="bg-white/5 rounded-3xl border border-white/5 p-6 flex flex-col gap-4 shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-green/10 flex items-center justify-center shrink-0 border border-primary-green/10">
                    <Calendar className="h-5 w-5 text-primary-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-white text-sm leading-tight mb-1">{hackathon.name}</h3>
                    <p className="text-[10px] text-primary-green font-bold uppercase tracking-wide">
                      {new Date(hackathon.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed flex-1 line-clamp-3">
                  {hackathon.description}
                </p>
                <Link
                  href={`/register?h=${hackathon.slug}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary-green hover:text-white transition-colors mt-auto"
                >
                  Register Now <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            ))}
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
