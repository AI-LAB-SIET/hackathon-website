"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CountdownTimer } from "@/components/cards/CountdownTimer";
import { FeatureCard } from "@/components/cards/FeatureCard";
import { FAQSection } from "@/components/cards/FAQSection";
import { useAppState } from "@/components/layout/StateProvider";
import { motion } from "framer-motion";
import {
  Cpu,
  Brain,
  Zap,
  Award,
  Calendar,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const { session } = useAppState();
  const [stats, setStats] = useState({ teams: 0, prize: 0, hours: 0, mentors: 0 });

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
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative lg:min-h-[calc(100vh-4rem)] flex items-center py-10 md:py-16 overflow-hidden gradient-mesh">
        {/* Floating gradient background shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary-green/5 glow-orb animate-float" />
        <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-accent-yellow/5 glow-orb animate-float-reverse" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-accent-green/5 glow-orb animate-pulse-slow" />

        <div className="max-w-[1440px] mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center text-left w-full">
          {/* Left Column (Hero Content) */}
          <div className="lg:col-span-7 flex flex-col items-start gap-4 text-left">
            {/* Badge indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-bg text-primary-dark border border-input-border/30 shadow-sm self-start"
            >
              <Sparkles className="h-4 w-4 text-primary-green animate-pulse" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                SIET Annual AI Hackathon 2026
              </span>
            </motion.div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary-dark leading-[1.1] md:leading-[1.05] text-left">
              Architecting the Future of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-green via-accent-green to-emerald-600 drop-shadow-[0_2px_10px_rgba(76,175,80,0.1)]">
                Agentic Intelligence
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium leading-relaxed mt-2 text-left max-w-xl">
              Join Coimbatore&apos;s premier 24-hour student AI hackathon. Collaborate, innovate, and deploy production-ready AI solutions with professional mentoring and cloud GPU support.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-start items-center mt-2 w-full sm:w-auto">
              {session.isLoggedIn ? (
                <Link
                  href={session.role === "admin" ? "/admin" : "/dashboard"}
                  className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl bg-primary-green text-white font-bold text-sm shadow-[0_4px_14px_0_rgba(0,100,0,0.25)] hover:bg-primary-dark transition-all"
                >
                  Go to Workspace
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl bg-primary-green text-white font-bold text-sm shadow-[0_4px_14px_0_rgba(0,100,0,0.25)] hover:bg-primary-dark transition-all"
                  >
                    Register Your Team
                  </Link>
                  <Link
                    href="/hackathon"
                    className="w-full sm:w-auto text-center px-8 py-3.5 rounded-xl bg-card-bg text-primary-dark border border-input-border/30 font-bold text-sm hover:bg-emerald-100/50 transition-all flex items-center justify-center gap-1.5"
                  >
                    Learn More <ChevronRight className="h-4 w-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Countdown Clock */}
            <div className="mt-2 p-5 sm:p-6 rounded-3xl glassmorphism shadow-[0_12px_40px_-10px_rgba(0,100,0,0.04)] w-full max-w-md">
              <h3 className="text-xs font-bold text-primary-green uppercase tracking-widest mb-4 text-center sm:text-left">
                Idea Submissions Close In
              </h3>
              <CountdownTimer />
            </div>
          </div>

          {/* Right Column (Banner/Visuals) */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="w-full max-w-md rounded-3xl p-3 glassmorphism shadow-[0_20px_50px_rgba(0,77,0,0.08)]"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/40 aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] shadow-inner w-full">
                <Image
                  src="/siet_hackathon_banner.png"
                  alt="Sri Shakthi Institute of Engineering and Technology AI Lab Hackathon Banner"
                  fill
                  priority
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/40 to-transparent flex flex-col justify-end p-5 text-left">
                  <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-accent-yellow mb-1">
                    Physical Sprint Venue
                  </span>
                  <h4 className="text-sm sm:text-lg font-extrabold text-white leading-tight">
                    Sri Shakthi Institute of Engineering and Technology
                  </h4>
                  <p className="text-[10px] sm:text-xs text-white/80 font-medium">
                    Main AI Research Lab, L&T Bypass Road, Coimbatore, Tamil Nadu, India
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-12 bg-card-bg/35 border-y border-input-border/20 relative">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: `${stats.teams}+`, label: "Expected Teams", icon: <Users className="h-5 w-5" /> },
            { value: `₹${stats.prize}K+`, label: "Cash Prize Pool", icon: <Award className="h-5 w-5" /> },
            { value: `${stats.hours} Hrs`, label: "Live Hacking", icon: <Clock className="h-5 w-5" /> },
            { value: `${stats.mentors}+`, label: "Industry Mentors", icon: <Cpu className="h-5 w-5" /> },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1 p-4">
              <div className="h-10 w-10 rounded-xl bg-white border border-input-border/20 text-primary-green flex items-center justify-center shadow-sm">
                {item.icon}
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight mt-2">
                {item.value}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-6">
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight">
            Why Participate in SIET AI_LAB?
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 leading-relaxed">
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

      {/* Timeline Snapshot Section */}
      <section className="py-16 bg-card-bg/20 border-t border-input-border/10">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex flex-col items-start gap-4 max-w-md">
            <span className="px-2.5 py-1 rounded-lg bg-primary-green/10 text-primary-green font-bold text-[10px] sm:text-xs uppercase tracking-wider">
              Roadmap Preview
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight leading-tight">
              A Structured Journey to Prototype Deployment
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              We guide you from standard idea abstracts to functional deployment. Shortlisted groups will undergo structured developer clinics and live test reviews.
            </p>
            <Link
              href="/timeline"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary-green hover:text-primary-dark transition-colors mt-2"
            >
              Explore interactive timeline <ExternalLink className="h-4 w-4" />
            </Link>
          </div>

          {/* Vertical Preview Stack */}
          <div className="flex flex-col gap-4 w-full max-w-lg">
            {[
              { num: "01", title: "Registrations & Profile Audit", desc: "Submit member handles and department logs.", active: true },
              { num: "02", title: "Ideation & Technical Layouts", desc: "Draft a system design diagram and flow description.", active: false },
              { num: "03", title: "Final Physical Prototype Hacking", desc: "24 hours inside the College AI Lab to deploy models.", active: false },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all duration-200 flex gap-4 bg-white
                  ${
                    step.active
                      ? "border-primary-green shadow-md shadow-primary-green/5"
                      : "border-gray-200/60"
                  }
                `}
              >
                <span className={`text-sm font-extrabold ${step.active ? "text-primary-green" : "text-gray-400"}`}>
                  {step.num}
                </span>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark">{step.title}</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24 max-w-[1440px] mx-auto px-6">
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 leading-relaxed">
            Have questions about formatting, cloud platform credits, or criteria? Find quick resolutions below.
          </p>
        </div>
        <FAQSection />
      </section>

      <Footer />
    </PageWrapper>
  );
}
