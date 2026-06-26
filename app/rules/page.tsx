"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, BookOpen, UserCheck, ShieldAlert } from "lucide-react";

export default function Rules() {
  const dos = [
    "Commit all project progress and source code to public GitHub repositories.",
    "Form teams of 2 to 4 students, optionally from cross-departments.",
    "Attribute any open-source pre-trained model checkpoint (e.g. Hugging Face).",
    "Bring your own hardware laptops for physical coding rounds.",
    "Actively participate in live mentorship checkpoints and reviews.",
  ];

  const donts = [
    "Do not present existing, pre-built websites or pre-trained proprietary projects.",
    "Do not commit API keys or private student credentials to public logs.",
    "Do not utilize plagiarized codebases or engage in hostile code manipulation.",
    "Do not exceed the maximum allowed team size of 4 members.",
    "Do not bypass local AI Lab computing safety measures or firewalls.",
  ];

  const guidelines = [
    {
      title: "Model Usage Criteria",
      desc: "Teams may leverage existing pre-trained weights (e.g. Llama-3, Phi-3, Stable Diffusion) but all application orchestrations, fine-tunes, UI components, and API routing must be developed during the event.",
      icon: <BookOpen className="h-5 w-5 text-primary-green" />,
    },
    {
      title: "Intellectual Property",
      desc: "All source code generated during this event belongs to the respective student creators. However, code must be published under standard open-source licenses (MIT/Apache 2.0).",
      icon: <UserCheck className="h-5 w-5 text-primary-green" />,
    },
    {
      title: "Workspace Guidelines",
      desc: "Physical participants must adhere to standard AI Lab computing guidelines: preserve hardware settings, clear temporary storage files, and avoid disrupting fellow competing teams.",
      icon: <ShieldAlert className="h-5 w-5 text-primary-green" />,
    },
  ];

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      {/* Page Title Header */}
      <section className="relative py-12 md:py-20 bg-card-bg/25 border-b border-input-border/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-85 h-85 rounded-full bg-primary-green/5 blur-[125px]" />
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark">
            Rules & Regulations
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-medium">
            Review our academic guidelines, system development criteria, code of conduct, and submission requirements.
          </p>
        </div>
      </section>

      {/* DOs & DONTs Grid */}
      <section className="py-16 max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* DOs Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-3xl border border-input-border/30 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-5 hover:border-primary-green/20 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-primary-green">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <h3 className="text-lg font-bold tracking-tight">The Do&apos;s</h3>
          </div>
          <div className="flex flex-col gap-3">
            {dos.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-card-bg/30 border border-input-border/10">
                <span className="h-5 w-5 rounded-full bg-primary-green text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✓</span>
                <p className="text-xs sm:text-sm text-primary-dark font-medium leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* DONTs Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-3xl border border-red-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col gap-5 hover:border-red-200 transition-colors"
        >
          <div className="flex items-center gap-2.5 text-red-600">
            <AlertTriangle className="h-6 w-6 shrink-0 animate-bounce-slow" />
            <h3 className="text-lg font-bold tracking-tight">The Don&apos;ts</h3>
          </div>
          <div className="flex flex-col gap-3">
            {donts.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50/20 border border-red-100/50">
                <span className="h-5 w-5 rounded-full bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 mt-0.5">✗</span>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Code of Conduct Details */}
      <section className="py-16 bg-card-bg/10 border-t border-input-border/10">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12 flex flex-col items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Evaluation & System Guidelines
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-gray-500 leading-relaxed">
              We focus on build usability, technical innovation, and fair play.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guidelines.map((guide, idx) => (
              <div
                key={idx}
                className="bg-white border border-input-border/30 rounded-2xl p-6 flex flex-col gap-3 shadow-sm hover:border-primary-green/20 transition-colors duration-200"
              >
                <div className="h-10 w-10 rounded-xl bg-card-bg flex items-center justify-center border border-input-border/10 shrink-0">
                  {guide.icon}
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-primary-dark leading-tight">{guide.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{guide.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
