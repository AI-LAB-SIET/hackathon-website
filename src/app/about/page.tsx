"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import {
  Brain,
  Cpu,
  Layers,
  Compass,
  Code,
  Github,
  Sparkles,
  Zap,
} from "lucide-react";

export default function About() {
  const [mounted, setMounted] = useState(false);
  const [devProfiles, setDevProfiles] = useState<{ login: string; name?: string; bio?: string; avatar_url?: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    
    // Fetch live GitHub profiles
    const fetchProfiles = async () => {
      try {
        const logins = ["NITISH-R-G", "bala-2305", "PRABHUSIDDARTH", "bsrikumar855-dot", "Siva9664"];
        const promises = logins.map(login => 
          fetch(`https://api.github.com/users/${login}`, { cache: "no-store" }).then(res => res.json())
        );
        const results = await Promise.all(promises);
        setDevProfiles(results);
      } catch (err) {
        console.error("Failed to fetch dev profiles", err);
      }
    };
    
    fetchProfiles();
  }, []);

  const stats = [
    { value: "10+", label: "Active Hackathons", desc: "Successfully hosted and managed large-scale events." },
    { value: "500+", label: "Participants", desc: "Builders leveraging our platform for team collaboration." },
    { value: "50+", label: "Expert Judges", desc: "Evaluating projects through our streamlined assessment pipeline." },
    { value: "100%", label: "Cloud Uptime", desc: "Highly available infrastructure ensuring zero downtime during events." },
  ];

  const focusTracks = [
    {
      title: "Seamless Event Management",
      description: "End-to-end hackathon lifecycle management, from participant registration to final project submissions, all in one centralized dashboard.",
      icon: <Brain className="h-6 w-6 text-primary-green" />,
      color: "from-emerald-500/20 to-teal-500/20",
    },
    {
      title: "Real-time Judging Pipeline",
      description: "Customized evaluation rubrics, automated score aggregation, and live leaderboards to ensure fair and transparent judging processes.",
      icon: <Cpu className="h-6 w-6 text-blue" />,
      color: "from-blue/20 to-indigo-500/20",
    },
    {
      title: "Dynamic Team Building",
      description: "Intelligent matchmaking, automated team assignment, and collaborative workspaces to foster innovation and cross-functional synergy.",
      icon: <Layers className="h-6 w-6 text-accent-yellow" />,
      color: "from-accent-yellow/20 to-orange/20",
    },
  ];

  const developers = [
    {
      name: "Nitish R.G.",
      login: "NITISH-R-G",
      role: "Lead Platform Developer & Architect",
      bio: "Focuses on core system architecture, routing orchestration, and state design patterns.",
      avatar: "https://avatars.githubusercontent.com/u/225521762?v=4",
      github: "https://github.com/NITISH-R-G",
    },
    {
      name: "Mahibala",
      login: "bala-2305",
      role: "Full-Stack AI Engineer",
      bio: "Fusing machine learning integrations, React workflows, and agentic assistant paradigms.",
      avatar: "https://avatars.githubusercontent.com/u/172978374?v=4",
      github: "https://github.com/bala-2305",
    },
    {
      name: "Prabhu Siddarth A V",
      login: "PRABHUSIDDARTH",
      role: "Backend Engineer",
      bio: "Designing elite, dark-themed responsive dashboards and smooth framer-motion micro-animations.",
      avatar: "https://avatars.githubusercontent.com/u/89624285?v=4",
      github: "https://github.com/PRABHUSIDDARTH",
    },
    {
      name: "Shreekumar B",
      login: "bsrikumar855-dot",
      role: "Backend & Database Engineer",
      bio: "Architecting local database structures, session caching, and mock environment routines.",
      avatar: "https://avatars.githubusercontent.com/u/243531451?v=4",
      github: "https://github.com/bsrikumar855-dot",
    },
    {
      name: "Sivaranjith",
      login: "Siva9664",
      role: "Full-Stack Developer & QA Engineer",
      bio: "Designing database schema migrations, input sanitizations, and executing test suites.",
      avatar: "https://avatars.githubusercontent.com/u/224603939?v=4",
      github: "https://github.com/Siva9664",
    },
  ];

  if (!mounted) return null;

  return (
    <PageWrapper className="relative bg-white min-h-screen dark:bg-gray-950 text-gray-800 dark:text-gray-100">
      <Navbar />

      {/* Hero Header Section */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-card-bg/15 dark:bg-gray-900/30 border-b border-input-border/20 dark:border-gray-800/80">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-primary-green/5 dark:bg-primary-green/10 blur-[130px] -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-accent-yellow/5 dark:bg-accent-yellow/10 blur-[110px] -z-10 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary-green/10 text-primary-green text-[10px] font-extrabold uppercase tracking-widest mb-2"
          >
            <Sparkles className="h-3 w-3" /> SIET AI Research Lab
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-primary-dark dark:text-white"
          >
            The Ultimate <span className="text-primary-green">Hackathon Platform</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium leading-relaxed"
          >
            SIET_HACKATHONS is a professional-grade hosting environment designed for organizing high-octane engineering events. From participant registration to live project judging, our platform scales to meet the demands of global developer communities.
          </motion.p>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl border border-input-border/30 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-xs hover:border-primary-green/30 dark:hover:border-primary-green/30 transition-all duration-300 flex flex-col gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary-green/10 text-primary-green flex items-center justify-center">
              <Compass className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary-dark dark:text-white">Our Vision</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              To provide a seamless, scalable infrastructure that empowers organizers to host world-class hackathons. We believe in reducing friction so that both participants and event managers can focus on what truly matters: building revolutionary tech.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-8 rounded-3xl border border-input-border/30 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-xs hover:border-primary-green/30 dark:hover:border-primary-green/30 transition-all duration-300 flex flex-col gap-4"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary-green/10 text-primary-green flex items-center justify-center">
              <Code className="h-6 w-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-primary-dark dark:text-white">Our Mission</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              To deliver an intuitive, end-to-end event lifecycle suite. From dynamic team formations to automated judging pipelines, our mission is to orchestrate intense coding marathons with unparalleled technical efficiency.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Focus Tracks Grid */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/20 border-y border-input-border/10 dark:border-gray-800/60 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-3 mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark dark:text-white tracking-tight">
              Core Platform Features
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
              Everything you need to run high-quality developer events without the operational overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {focusTracks.map((track, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6 }}
                className="p-6 rounded-3xl border border-input-border/30 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-4 transition-all duration-300 shadow-xs"
              >
                <div className={`h-11 w-11 rounded-xl bg-linear-to-br ${track.color} flex items-center justify-center`}>
                  {track.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-primary-dark dark:text-white">
                  {track.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {track.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lab Infrastructure Section */}
      <section className="py-20 max-w-5xl mx-auto px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-primary-green/5 blur-[120px] pointer-events-none" />

        <div className="text-center flex flex-col items-center gap-3 mb-16 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark dark:text-white tracking-tight">
            Proven Scale & Reliability
          </h2>
          <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
            Built to handle concurrent participants, real-time updates, and resource-intensive project submissions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -4, borderColor: "rgba(88,204,2,0.3)" }}
              className="flex flex-col items-center gap-2 p-6 rounded-3xl border border-input-border/30 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-2xs hover:shadow-xs transition-all duration-300"
            >
              <span className="text-3xl sm:text-4xl font-extrabold text-primary-green tracking-tight">
                {item.value}
              </span>
              <span className="text-xs text-primary-dark dark:text-white font-bold tracking-tight">
                {item.label}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 leading-normal font-medium">
                {item.desc}
              </span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Leadership & Organizers Section - Now Platform Developers */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/20 border-t border-input-border/10 dark:border-gray-800/60 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center flex flex-col items-center gap-3 mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark dark:text-white tracking-tight">
              Core Platform Developers
            </h2>
            <p className="max-w-2xl text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold">
              Meet the engineering team who designed, developed, and maintained the SIET Hack Lab ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {developers.map((member, idx) => {
              const liveProfile = devProfiles.find(p => p.login === member.login);
              const displayName = liveProfile?.name || member.name;
              const displayBio = liveProfile?.bio || member.bio;
              const displayAvatar = liveProfile?.avatar_url || member.avatar;
              
              return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{ y: -6, borderColor: "rgba(88,204,2,0.25)" }}
                className="p-5 rounded-3xl border border-input-border/30 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 border border-input-border/20 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayAvatar}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-primary-dark dark:text-white truncate">
                    {displayName}
                  </h3>
                  <span className="text-[10px] text-primary-green font-extrabold uppercase tracking-wide block mb-1">
                    {member.role}
                  </span>
                  <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold tracking-tight mb-3">
                    @{member.login}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal font-medium mb-5">
                    {displayBio}
                  </p>
                </div>

                <div className="flex gap-2.5 border-t border-input-border/20 dark:border-gray-800/80 pt-4 mt-auto">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-black dark:hover:text-white transition-colors duration-250 cursor-pointer"
                    title="GitHub Profile"
                  >
                    <Github className="h-3.5 w-3.5" />
                  </a>
                </div>
              </motion.div>
            );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 max-w-5xl mx-auto px-6 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-green/5 dark:bg-primary-green/10 blur-[130px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-primary-green/10 text-primary-green flex items-center justify-center shadow-xs">
            <Zap className="h-6 w-6" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark dark:text-white tracking-tight">
            Host Your Next Big Hackathon
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
            Leverage our unified platform to manage participants, streamline judging, and accelerate developer success.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mt-2 w-full max-w-xs sm:max-w-md">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3 rounded-full bg-primary-green hover:bg-green-hover text-white font-extrabold text-xs tracking-wider transition-all duration-300 shadow-md shadow-primary-green/15 hover:-translate-y-0.5"
            >
              CONTACT SALES
            </Link>
            <Link
              href="/hackathon"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3 rounded-full border border-input-border/30 dark:border-gray-800 bg-white dark:bg-gray-900 text-primary-dark dark:text-white font-extrabold text-xs tracking-wider transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:-translate-y-0.5"
            >
              VIEW LIVE EVENTS
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
