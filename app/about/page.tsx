"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import { Target, Award, ShieldAlert, Users2, Cpu, ChevronRight } from "lucide-react";

export default function About() {
  const objectives = [
    {
      title: "Encourage Research & Innovation",
      desc: "Promote hands-on experimentation in artificial intelligence, neural modeling, and autonomous software agents.",
      icon: <Target className="h-5 w-5 text-primary-green" />,
    },
    {
      title: "Facilitate Team Collaboration",
      desc: "Connect students from diverse departments (Computer Science, AI & DS, Electronics, IT) to build interdisciplinary prototypes.",
      icon: <Users2 className="h-5 w-5 text-primary-green" />,
    },
    {
      title: "Enable Industry Readiness",
      desc: "Provide industry-grade coding scenarios with live mentoring from engineering leaders to enhance student employability.",
      icon: <Cpu className="h-5 w-5 text-primary-green" />,
    },
  ];

  const benefits = [
    "₹1,00,000 total cash prize pool distributed among top entries.",
    "Potential internship shortlisting at SIET's collaborative AI Research Incubators.",
    "Free Cloud GPU computing credits (Nebius / RunPod) for shortlisted groups.",
    "Individual AI Lab completion certificates and digital participant badges.",
    "Direct mentorship sessions with deep learning researchers.",
  ];

  const organizers = [
    { name: "Dr. A. Rajesh", role: "Director, SIET AI Research Lab", dept: "Artificial Intelligence & Data Science" },
    { name: "Prof. Sarah Mathew", role: "Event Coordinator", dept: "Computer Science & Engineering" },
    { name: "Siddharth Roy", role: "AI Student Lead", dept: "AI & Data Science (Final Year)" },
  ];

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      {/* Page Title Header */}
      <section className="relative py-12 md:py-20 bg-card-bg/25 border-b border-input-border/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary-green/5 blur-[120px]" />
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark">
            About the AI Hack Lab
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-medium">
            Discover the vision, learning pathways, eligibility requirements, and the organizing team behind SIET's premier artificial intelligence hackathon.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col gap-4">
          <span className="text-xs font-bold text-primary-green uppercase tracking-widest">Our Mission</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight leading-tight">
            Fostering Next-Generation AI Developers
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            The SIET College AI Lab Hackathon is designed to challenge students to move beyond standard textbook exercises. We provide a workspace where teams are encouraged to build complex, functional systems utilizing state-of-the-art developer frameworks.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            Whether your project incorporates localized language databases (RAG), autonomous web scrapers, computer vision monitors, or custom diffusion interfaces, we provide the computing resources and expert engineering critiques required to bring it to life.
          </p>
        </div>
        <div className="relative rounded-3xl border border-input-border/30 bg-card-bg p-8 sm:p-10 overflow-hidden shadow-inner flex flex-col gap-4">
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-accent-yellow/10 blur-2xl" />
          <h3 className="text-lg font-extrabold text-primary-dark tracking-tight">Key Pillars</h3>
          <ul className="flex flex-col gap-3 text-xs sm:text-sm text-primary-dark font-semibold">
            <li className="flex gap-2.5 items-start">
              <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-xs font-extrabold">✓</span>
              <span>100% Student-Driven Prototypes</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-xs font-extrabold">✓</span>
              <span>Cloud Deployments Ready for Public Portals</span>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="h-5 w-5 rounded-full bg-primary-green text-white flex items-center justify-center text-xs font-extrabold">✓</span>
              <span>Ethics-Compliant AI Applications Only</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Objectives Section */}
      <section className="py-16 bg-card-bg/10 border-t border-input-border/10">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12 flex flex-col items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Event Objectives
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-gray-500 leading-relaxed">
              We structure the hackathon guidelines around three core milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {objectives.map((obj, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                className="bg-white border border-input-border/30 rounded-2xl p-6 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,100,0,0.01)]"
              >
                <div className="h-10 w-10 rounded-xl bg-card-bg flex items-center justify-center border border-input-border/10 shrink-0">
                  {obj.icon}
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-primary-dark">{obj.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{obj.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Eligibility */}
      <section className="py-16 max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Benefits */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-primary-green">
            <Award className="h-5 w-5 shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Participant Benefits</h3>
          </div>
          <div className="flex flex-col gap-3 mt-2">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:border-input-border/40 transition-colors">
                <span className="text-xs font-bold px-2 py-1 rounded bg-card-bg text-primary-green border border-input-border/10 shrink-0">
                  0{idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <h3 className="text-lg sm:text-xl font-bold tracking-tight">Eligibility Guidelines</h3>
          </div>
          <div className="p-6 rounded-2xl border border-red-100 bg-red-50/10 flex flex-col gap-4 mt-2">
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              To maintain academic integrity and fair competition, all registration forms are vetted by the AI Lab council:
            </p>
            <ul className="flex flex-col gap-3 text-xs sm:text-sm text-gray-500 list-disc pl-5 leading-relaxed font-medium">
              <li>Open to all current undergraduate and postgraduate engineering & science students.</li>
              <li>Teams must register 2 to 4 members. Individual entries will be removed.</li>
              <li>All project source code must be hosted on public repositories and authored during the 24-hour sprint. Pre-made prototypes are disqualified.</li>
              <li>Plagiarism of code or dataset manipulation will lead to immediate disqualification.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Organizers Section */}
      <section className="py-16 bg-card-bg/25 border-t border-input-border/10">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12 flex flex-col items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Organizing Council
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-gray-500 leading-relaxed">
              Reach out to our coordinators inside the Research Lab for guidelines verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {organizers.map((org, idx) => (
              <div
                key={idx}
                className="bg-white border border-input-border/30 rounded-2xl p-5 text-center flex flex-col items-center gap-2 shadow-sm"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary-green to-accent-green text-white font-extrabold flex items-center justify-center text-sm shadow">
                  {org.name[0]}
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark mt-2">{org.name}</h4>
                <span className="text-[10px] sm:text-xs text-primary-green font-bold uppercase">{org.role}</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold">{org.dept}</span>
              </div>
            ))}
          </div>

          {/* Link to administrative Patrons / Leadership */}
          <div className="text-center mt-10 flex flex-col items-center justify-center">
            <Link
              href="/about-us"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-green/10 text-primary-green hover:bg-primary-green hover:text-white border border-primary-green/20 text-xs font-bold transition-all duration-200"
            >
              <span>Meet administrative Patrons & Leadership</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
