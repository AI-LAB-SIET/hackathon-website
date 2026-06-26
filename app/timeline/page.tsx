"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { INITIAL_MILESTONES } from "@/lib/mockData";
import { Milestone } from "@/types";
import { motion } from "framer-motion";
import { CheckCircle2, PlayCircle, Calendar, Clock, MapPin } from "lucide-react";

export default function Timeline() {
  const [milestones] = useState<Milestone[]>(INITIAL_MILESTONES);

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      <section className="relative py-12 md:py-20 bg-card-bg/25 border-b border-input-border/20 overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full bg-accent-yellow/5 blur-[120px]" />
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-3">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-primary-dark">
            Interactive Timeline
          </h1>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 font-medium">
            Track key event dates, submission deadlines, technical clinics, and final presentation times in our detailed progression chart.
          </p>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 md:py-24 max-w-4xl mx-auto px-6 relative">
        {/* Continuous center vertical timeline line */}
        <div className="absolute left-6 md:left-1/2 top-10 bottom-10 w-0.5 bg-gradient-to-b from-primary-green via-accent-green to-gray-200 -translate-x-1/2" />

        <div className="flex flex-col gap-12 md:gap-16">
          {milestones.map((m, idx) => {
            const isLeft = idx % 2 === 0;

            const iconColors = {
              completed: "bg-primary-green text-white shadow-[0_0_12px_rgba(0,100,0,0.3)]",
              ongoing: "bg-accent-yellow text-primary-dark shadow-[0_0_12px_rgba(247,224,53,0.4)] animate-pulse",
              upcoming: "bg-gray-100 text-gray-400 border border-gray-200",
            };

            const statusBadges = {
              completed: "bg-primary-green/10 text-primary-green border border-primary-green/15",
              ongoing: "bg-accent-yellow/10 text-primary-dark border border-accent-yellow/20 font-bold",
              upcoming: "bg-gray-100 text-gray-500 border border-gray-150",
            };

            return (
              <div key={m.id} className="relative flex flex-col md:flex-row items-start md:items-center">
                {/* Center timeline dot indicator */}
                <div
                  className={`absolute left-6 md:left-1/2 h-8 w-8 rounded-full z-10 flex items-center justify-center -translate-x-1/2 transition-transform duration-300
                    ${iconColors[m.status]}
                  `}
                >
                  {m.status === "completed" ? (
                    <CheckCircle2 className="h-4.5 w-4.5" />
                  ) : m.status === "ongoing" ? (
                    <PlayCircle className="h-4.5 w-4.5 animate-spin-slow" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                  )}
                </div>

                {/* Left Card content (for even indices, desktop only) */}
                <div className={`hidden md:block w-[45%] pr-10 text-right ${isLeft ? "" : "opacity-0 pointer-events-none"}`}>
                  {isLeft && (
                    <motion.div
                      initial={{ opacity: 0, x: -30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.5 }}
                      className="bg-white p-6 rounded-3xl border border-input-border/30 shadow-sm flex flex-col items-end gap-2.5"
                    >
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${statusBadges[m.status]}`}>
                        {m.status}
                      </span>
                      <h3 className="text-base sm:text-lg font-extrabold text-primary-dark tracking-tight leading-tight">
                        {m.title}
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                        {m.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-green mt-1 bg-card-bg/50 px-2.5 py-1 rounded-lg border border-input-border/10">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{m.date}</span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Right Card content (for odd indices, and both on mobile) */}
                <div className={`w-full md:w-[45%] pl-14 md:pl-10 ${!isLeft ? "md:block" : "md:hidden"}`}>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5 }}
                    className="bg-white p-6 rounded-3xl border border-input-border/30 shadow-sm flex flex-col items-start gap-2.5"
                  >
                    <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${statusBadges[m.status]}`}>
                      {m.status}
                    </span>
                    <h3 className="text-base sm:text-lg font-extrabold text-primary-dark tracking-tight leading-tight">
                      {m.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
                      {m.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-green mt-1 bg-card-bg/50 px-2.5 py-1 rounded-lg border border-input-border/10">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{m.date}</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
