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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const { session, problemStatements } = useAppState();
  const [stats, setStats] = useState({ teams: 0, prize: 0, hours: 0, mentors: 0 });
  const [activeStep, setActiveStep] = useState(0);
  const publishedPs = problemStatements.filter((ps) => ps.status === "published");

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
        teams: Math.floor(easedProgress * 80),
        prize: Math.floor(easedProgress * 100),
        hours: Math.floor(easedProgress * 24),
        mentors: Math.floor(easedProgress * 15),
      });

      if (progress < 1) {
        requestAnimationFrame(animateStats);
      }
    };

    requestAnimationFrame(animateStats);
  }, []);

  const features = [
    {
      title: "Generative AI Focus",
      description: "Build cutting-edge applications using LLMs, autonomous agents, diffusion models, or custom neural architectures.",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      title: "GPU Cloud Credits",
      description: "All shortlisted teams receive ₹5,000 in cloud GPU credits to accelerate training and inference capabilities.",
      icon: <Zap className="h-6 w-6" />,
    },
    {
      title: "Cash Prizes",
      description: "Compete for a pool of ₹1,00,000 cash, with special recognition awards for Best Agent and Innovation.",
      icon: <Award className="h-6 w-6" />,
    },
    {
      title: "Expert Mentorship",
      description: "Interact directly with AI engineers and research scientists from top tech giants during coding sprints.",
      icon: <Cpu className="h-6 w-6" />,
    },
  ];

  return (
    <PageWrapper className="dark relative bg-gray-950 min-h-screen text-white">
      <Navbar />

      {/* Hero Section — cinematic looping video background */}
      <CinematicHero session={session} />

      {/* Statistics Section */}
      <section className="py-12 bg-card-bg/35 border-y border-input-border/20 relative dark:bg-gray-800/35 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: `${stats.teams}+`, label: "Expected Teams", icon: <Users className="h-5 w-5" /> },
            { value: `₹${stats.prize}K+`, label: "Cash Prize Pool", icon: <Award className="h-5 w-5" /> },
            { value: `${stats.hours} Hrs`, label: "Live Hacking", icon: <Clock className="h-5 w-5" /> },
            { value: `${stats.mentors}+`, label: "Industry Mentors", icon: <Cpu className="h-5 w-5" /> },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -6, scale: 1.03, boxShadow: "0 8px 30px rgba(88,204,2,0.12)", borderColor: "rgba(88,204,2,0.3)" }}
              className="flex flex-col items-center gap-1 p-4 rounded-2xl border border-transparent transition-all duration-300 bg-white/5 backdrop-blur-[2px] dark:bg-gray-900/10 hover:bg-white/40 dark:hover:bg-gray-800/40"
            >
              <div className="h-10 w-10 rounded-xl bg-white border border-input-border/20 text-primary-green flex items-center justify-center shadow-sm dark:bg-gray-900 dark:border-gray-700">
                {item.icon}
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight mt-2 dark:text-gray-100">
                {item.value}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider dark:text-gray-400">
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-6">
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">
            Why Participate in the AI Hackathon?
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 leading-relaxed dark:text-gray-400">
            Gain hands-on developer experience, accelerate your AI research projects, and collaborate with like-minded student developers in a highly competitive environment.
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

      {/* Problem Statements Preview Section — only shown when PS are published */}
      {publishedPs.length > 0 && (
        <section className="py-16 bg-gradient-to-br from-primary-green/5 to-teal-500/5 border-y border-primary-green/10 dark:from-emerald-900/10 dark:to-teal-900/5 dark:border-emerald-800/20">
          <div className="max-w-[1440px] mx-auto px-6">
            <div className="text-center flex flex-col items-center gap-3 mb-10">
              <span className="px-3 py-1.5 rounded-full bg-primary-green/10 border border-primary-green/20 text-primary-green text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Official Problem Statements
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">
                Challenges Await You
              </h2>
              <p className="max-w-2xl text-xs sm:text-sm text-gray-500 leading-relaxed dark:text-gray-400">
                The organizing team has published {publishedPs.length} problem statement{publishedPs.length > 1 ? "s" : ""} for this hackathon. Pick your challenge and start building.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {publishedPs.slice(0, 3).map((ps, idx) => (
                <motion.div
                  key={ps.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(88,204,2,0.10)" }}
                  className="bg-white dark:bg-gray-900 rounded-3xl border border-input-border/20 dark:border-gray-700 p-6 flex flex-col gap-4 shadow-sm transition-all duration-300"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-green/10 flex items-center justify-center shrink-0 border border-primary-green/10">
                      <BookOpen className="h-5 w-5 text-primary-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-primary-dark dark:text-gray-100 text-sm leading-tight mb-1">{ps.title}</h3>
                      <p className="text-[10px] text-primary-green font-bold uppercase tracking-wide">
                        PS-{String(idx + 1).padStart(2, "0")}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex-1 line-clamp-3">
                    {ps.description}
                  </p>
                  <Link
                    href="/hackathon"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-green hover:text-primary-dark transition-colors mt-auto"
                  >
                    Read full statement <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {publishedPs.length > 3 && (
              <div className="text-center">
                <Link
                  href="/hackathon"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-primary-green text-primary-green font-bold text-sm hover:bg-primary-green hover:text-white transition-all duration-200"
                >
                  View all {publishedPs.length} problem statements <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Timeline Snapshot Section */}
      <section className="py-16 bg-card-bg/20 border-t border-input-border/10 dark:bg-gray-800/20 dark:border-gray-700">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-start gap-4 max-w-md">
            <span className="px-2.5 py-1 rounded-lg bg-primary-green/10 text-primary-green font-bold text-[10px] sm:text-xs uppercase tracking-wider">
              Roadmap Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight leading-tight dark:text-gray-100">
              A Structured Journey to Prototype Deployment
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed dark:text-gray-400">
              We guide you from standard idea abstracts to functional deployment. Shortlisted groups will undergo structured developer clinics and live test reviews.
            </p>
            <Link
              href="/hackathon"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-green hover:text-primary-dark transition-colors mt-2"
            >
              Explore interactive timeline <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* Vertical Preview Stack */}
          <div className="flex flex-col gap-4 w-full max-w-lg">
            {[
              { 
                num: "01", 
                title: "Registrations & Faculty Approval", 
                desc: "Complete your participant registration and get your academic mentor to sign off on your department log.",
                detail: "All members must submit their rolls and department codes. Faculty approval is verified online before abstract uploads are unlocked."
              },
              { 
                num: "02", 
                title: "Ideation & Technical Layouts", 
                desc: "Draft a system design diagram and flow description.",
                detail: "Prepare a clear architectural map of your solution including deep learning models, datasets used, and layout pipelines."
              },
              { 
                num: "03", 
                title: "Final Physical Prototype Hacking", 
                desc: "24 hours inside the College AI Lab to deploy models.",
                detail: "Enter the physical hacking floor, plug into our high-speed compute clusters, and deploy your live working agentic prototypes."
              },
            ].map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <motion.div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex gap-4 cursor-pointer select-none
                    ${
                      isActive
                        ? "border-primary-green bg-emerald-50/10 dark:bg-emerald-950/10 shadow-md shadow-primary-green/5"
                        : "border-gray-250 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-primary-green/30 hover:bg-gray-50/50 dark:hover:bg-gray-850/50"
                    }
                  `}
                  whileHover={{ x: 6 }}
                  layout
                >
                  <span className={`text-sm font-extrabold ${isActive ? "text-primary-green" : "text-gray-400"}`}>
                    {step.num}
                  </span>
                  <div className="flex flex-col gap-1 w-full">
                    <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark dark:text-gray-100">{step.title}</h4>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{step.desc}</p>
                    
                    {/* Expandable detail section */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.p
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: "auto", opacity: 0.85, marginTop: 8 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-[10px] sm:text-[11px] text-gray-450 dark:text-gray-300 border-t border-input-border/10 pt-2 leading-relaxed"
                        >
                          {step.detail}
                        </motion.p>
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
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">
            Frequently Asked Questions
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 leading-relaxed dark:text-gray-400">
            Have questions about formatting, cloud platform credits, or criteria? Find quick resolutions below.
          </p>
        </div>
        <FAQSection />
      </section>

      <Footer />
    </PageWrapper>
  );
}
