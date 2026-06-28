"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Database,
  Cpu,
  Cloud,
  Code2,
  Video,
  ExternalLink,
  Sparkles,
  Brain,
  Server,
  FileText,
  Layers,
  Github,
  Globe,
  Terminal,
} from "lucide-react";
import {
  apis,
  datasets,
  tools,
  learning,
  templates,
  cloud,
  type ResourceCard,
} from "@/lib/resources";

type TabType = "apis" | "datasets" | "tools" | "learning" | "templates" | "cloud";

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: "apis", label: "AI APIs", icon: <Brain className="h-4 w-4" /> },
  { id: "datasets", label: "Datasets", icon: <Database className="h-4 w-4" /> },
  { id: "tools", label: "Dev Tools", icon: <Terminal className="h-4 w-4" /> },
  { id: "learning", label: "Learning", icon: <BookOpen className="h-4 w-4" /> },
  { id: "templates", label: "Templates", icon: <Code2 className="h-4 w-4" /> },
  { id: "cloud", label: "Cloud Credits", icon: <Cloud className="h-4 w-4" /> },
];


const tabData: Record<TabType, ResourceCard[]> = {
  apis,
  datasets,
  tools,
  learning,
  templates,
  cloud,
};

const tabDescriptions: Record<TabType, string> = {
  apis: "Pre-approved AI APIs with free tiers — use these to power your LLM, vision, and audio features without API cost barriers.",
  datasets: "Curated open datasets across all hackathon tracks. Download, stream, or query directly in your notebooks.",
  tools: "Frameworks, libraries, and dev tools recommended by the organizing team to accelerate your build.",
  learning: "Video lectures, courses, and documentation to upskill fast during the hackathon. All free.",
  templates: "Starter codebases and GitHub repositories to fork and build on. Don&apos;t start from zero.",
  cloud: "Free cloud compute, hosting, and credits available to hackathon participants.",
};

function ResourceGrid({ items }: { items: ResourceCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {items.map((item, i) => (
        <motion.a
          key={item.title}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className="group flex flex-col gap-3 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-lg hover:border-primary-green/30 transition-all duration-300 cursor-pointer dark:bg-gray-900 dark:border-gray-700 dark:hover:border-primary-green/40"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-primary-dark text-base leading-tight group-hover:text-primary-green transition-colors">
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.badge && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-primary-green transition-colors" />
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed flex-1">{item.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {item.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
                {tag}
              </span>
            ))}
          </div>
        </motion.a>
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("apis");

  const tabIcons: Record<TabType, React.ReactNode> = {
    apis: <Brain className="h-5 w-5" />,
    datasets: <Database className="h-5 w-5" />,
    tools: <Terminal className="h-5 w-5" />,
    learning: <Video className="h-5 w-5" />,
    templates: <Github className="h-5 w-5" />,
    cloud: <Server className="h-5 w-5" />,
  };

  return (
    <PageWrapper>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-14 px-6">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="absolute top-10 right-20 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-56 h-56 rounded-full bg-teal-200/20 blur-3xl -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-700 text-sm font-semibold mb-6"
          >
            <Sparkles className="h-4 w-4" />
            Hackathon Resource Hub
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-extrabold text-primary-dark mb-4 leading-tight"
          >
            Everything You Need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"> Build & Win</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg text-gray-500 max-w-2xl mx-auto"
          >
            Curated APIs, datasets, tools, cloud credits, and starter templates — handpicked by the AI Research Lab organizing team to help you ship faster.
          </motion.p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "AI APIs", value: "6+", icon: <Globe className="h-5 w-5 text-emerald-500" /> },
            { label: "Datasets", value: "6+", icon: <Database className="h-5 w-5 text-blue-500" /> },
            { label: "Dev Tools", value: "6+", icon: <Cpu className="h-5 w-5 text-purple-500" /> },
            { label: "Free Credits", value: "$3K+", icon: <Cloud className="h-5 w-5 text-amber-500" /> },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gray-50">{stat.icon}</div>
              <div>
                <div className="text-xl font-extrabold text-primary-dark">{stat.value}</div>
                <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary-green text-white shadow-md shadow-emerald-200"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-primary-green/40 hover:text-primary-green"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-primary-green">
                {tabIcons[activeTab]}
              </div>
              <p className="text-sm text-gray-500 max-w-2xl">{tabDescriptions[activeTab]}</p>
            </div>

            <ResourceGrid items={tabData[activeTab]} />
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-br from-primary-dark to-emerald-900 py-14 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold mb-5">
            <FileText className="h-4 w-4" />
            Need Something Specific?
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Can&apos;t find what you need?
          </h2>
          <p className="text-white/70 text-base mb-8">
            Reach out to the organizing team on Discord or at the help desk during the hackathon. We&apos;ll source it for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-green text-white font-bold text-sm shadow-lg hover:bg-emerald-500 transition-all"
            >
              <Layers className="h-4 w-4" />
              Contact Organizers
            </a>
            <a
              href="https://github.com/AI-LAB-SIET"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-bold text-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </PageWrapper>
  );
}
