"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

export default function AboutUs() {
  const patrons = [
    {
      name: "Dr. S. Thangavelu",
      role: "Chairman",
      dept: "Sri Shakthi Institute of Engineering & Technology",
      email: "chairman@srishakthi.ac.in",
      bio: "Former Professor at Tamil Nadu Agricultural University (TNAU) with over 28 years of academic leadership. A visionary academician and entrepreneur.",
      citation: "Empowering students through advanced research, engineering excellence, and entrepreneurial drive to shape the future of technology.",
      gradient: "from-emerald-600 to-amber-500",
      glow: "bg-amber-500/10",
    },
    {
      name: "Er. Dheepan Thangavelu",
      role: "Vice Chairman",
      dept: "Sri Shakthi Institute of Engineering & Technology",
      email: "vicechairman@srishakthi.ac.in",
      bio: "Second-generation entrepreneur driving strategic global partnerships, venture incubation, and industry-oriented engineering talent.",
      citation: "Bridging the gap between academic innovation and industry scale, fostering world-class engineering talent at SIET.",
      gradient: "from-emerald-600 to-teal-500",
      glow: "bg-teal-500/10",
    },
    {
      name: "Shri Sheelan Thangavelu",
      role: "Joint Secretary",
      dept: "Sri Shakthi Institute of Engineering & Technology",
      email: "jointsecretary@srishakthi.ac.in",
      bio: "Actively directs entrepreneurship development cells (EDC) and specialized student research laboratory clinics.",
      citation: "Developing an ecosystem of constant curiosity, entrepreneurship, and hands-on learning inside our specialized Research Labs.",
      gradient: "from-emerald-600 to-emerald-400",
      glow: "bg-emerald-500/10",
    },
  ];

  const organizers = [
    {
      name: "Dr. A. Rajesh",
      role: "Director, SIET AI Research Lab",
      dept: "Artificial Intelligence & Data Science",
      email: "rajesh.a@srishakthi.ac.in",
      bio: "Leading advanced AI research projects, specialized lab internships, and collaborative deep learning development initiatives at SIET.",
      citation: "Nurturing research, publication, and patenting in edge AI and deep neural architectures.",
      gradient: "from-indigo-600 to-blue-500",
      glow: "bg-blue-500/10",
    },
    {
      name: "Prof. Sarah Mathew",
      role: "Event Coordinator",
      dept: "Computer Science & Engineering",
      email: "sarah.mathew@srishakthi.ac.in",
      bio: "Enthusiastic educator organizing hackathons, technical symposiums, and bridging student developers with industry mentors.",
      citation: "Connecting code, collaboration, and creativity to design impactful real-world platforms.",
      gradient: "from-violet-600 to-purple-500",
      glow: "bg-purple-500/10",
    },
    {
      name: "Siddharth Roy",
      role: "AI Student Lead",
      dept: "AI & Data Science (Final Year)",
      email: "siddharth.roy@student.srishakthi.ac.in",
      bio: "Student coordinator and lead developer for student AI initiatives, specialized in autonomous agents and web scrapers.",
      citation: "Empowering peers to build, deploy, and showcase autonomous systems.",
      gradient: "from-cyan-600 to-teal-400",
      glow: "bg-cyan-500/10",
    },
  ];

  const renderCard = (org: typeof patrons[0], idx: number) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.1 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white border border-input-border/30 rounded-3xl p-6 flex flex-col items-center text-center gap-4 shadow-sm hover:shadow-xl hover:border-primary-green/30 transition-all duration-300 overflow-hidden"
    >
      {/* Decorative Glow Dot */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 ${org.glow} rounded-full blur-xl group-hover:scale-125 transition-transform duration-500`} />

      {/* Avatar Initials Box */}
      <div className={`h-16 w-16 rounded-2xl bg-gradient-to-tr ${org.gradient} text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0 relative z-10 group-hover:scale-110 transition-transform duration-300`}>
        {org.name.replace(/^(Dr\.|Er\.|Prof\.|Shri)\s+/, "")[0]}
      </div>

      <div className="relative z-10">
        <h4 className="text-base sm:text-lg font-extrabold text-primary-dark tracking-tight">{org.name}</h4>
        <span className="text-xs text-primary-green font-bold uppercase tracking-wider block mt-1">{org.role}</span>
        <span className="text-[10px] sm:text-xs text-gray-400 font-semibold block mt-0.5 leading-tight">{org.dept}</span>
      </div>

      {/* Blockquote Citation Box */}
      <div className="relative w-full p-4 pb-5 rounded-2xl bg-card-bg/20 border border-input-border/10 italic text-[11px] sm:text-xs text-primary-dark font-medium leading-relaxed my-1 relative z-10">
        <span className="absolute -top-1 left-2 text-2xl font-serif text-primary-green/35 leading-none select-none">&ldquo;</span>
        <p className="px-1.5">{org.citation}</p>
        <span className="absolute -bottom-4 right-2 text-2xl font-serif text-primary-green/35 leading-none select-none">&rdquo;</span>
      </div>

      <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed font-medium relative z-10 mt-1">
        {org.bio}
      </p>

      <a
        href={`mailto:${org.email}`}
        className="mt-auto w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary-dark hover:text-white transition-all bg-card-bg/40 hover:bg-primary-green px-3 py-2 rounded-xl border border-input-border/10 relative z-10"
      >
        <Mail className="h-3.5 w-3.5" />
        <span>{org.email}</span>
      </a>
    </motion.div>
  );

  return (
    <PageWrapper className="relative bg-white min-h-screen">
      <Navbar />

      {/* Page Title Header */}
      <section className="relative py-16 md:py-24 bg-card-bg/15 border-b border-input-border/15 overflow-hidden">
        {/* Decorative backdrop mesh */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary-green/5 blur-[120px]" />
        <div className="absolute -bottom-10 left-10 w-72 h-72 rounded-full bg-accent-yellow/5 blur-[100px]" />
        
        <div className="max-w-[1440px] mx-auto px-6 relative z-10 text-center flex flex-col items-center gap-3">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-primary-dark"
          >
            About Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl text-xs sm:text-sm md:text-base text-gray-500 font-semibold leading-relaxed"
          >
            Meet the administrative leadership, academic patrons, and the organizing council of Sri Shakthi Institute of Engineering and Technology (SIET).
          </motion.p>
        </div>
      </section>

      {/* Patrons & Leadership Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12 flex flex-col items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-primary-green uppercase tracking-widest bg-card-bg px-3 py-1 rounded-full border border-input-border/20">
              Patrons
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight">
              Administrative Leadership
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold">
              The visionary management guiding and supporting engineering excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {patrons.map((patron, idx) => renderCard(patron, idx))}
          </div>
        </div>
      </section>

      {/* Separator Line */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="w-full h-px bg-input-border/20" />
      </div>

      {/* Organizing Council Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="text-center mb-12 flex flex-col items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold text-primary-green uppercase tracking-widest bg-card-bg px-3 py-1 rounded-full border border-input-border/20">
              Committee
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-primary-dark tracking-tight">
              Organizing Council
            </h2>
            <p className="max-w-xl text-xs sm:text-sm text-gray-500 leading-relaxed font-semibold">
              Coordinators and leads managing the SIET College AI Lab Hackathon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {organizers.map((org, idx) => renderCard(org, idx))}
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
