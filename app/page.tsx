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
    <PageWrapper className="relative bg-white min-h-screen dark:bg-gray-950">
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
            <div key={idx} className="flex flex-col items-center gap-1 p-4">
              <div className="h-10 w-10 rounded-xl bg-white border border-input-border/20 text-primary-green flex items-center justify-center shadow-sm dark:bg-gray-900 dark:border-gray-700">
                {item.icon}
              </div>
              <span className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight mt-2 dark:text-gray-100">
                {item.value}
              </span>
              <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider dark:text-gray-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-6">
        <div className="text-center flex flex-col items-center gap-3 mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight dark:text-gray-100">
            Why Participate in SIET AI_LAB?
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
              { num: "01", title: "Registrations & Profile Audit", desc: "Submit member handles and department logs.", active: true },
              { num: "02", title: "Ideation & Technical Layouts", desc: "Draft a system design diagram and flow description.", active: false },
              { num: "03", title: "Final Physical Prototype Hacking", desc: "24 hours inside the College AI Lab to deploy models.", active: false },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all duration-200 flex gap-4 bg-white dark:bg-gray-900 dark:border-gray-700
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
                  <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark dark:text-gray-100">{step.title}</h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
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
