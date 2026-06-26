"use client";

import React from "react";
import { motion } from "framer-motion";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

export function FeatureCard({ title, description, icon, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-start gap-4 glassmorphism-card hover:bg-emerald-50/40 hover:shadow-[0_12px_45px_rgba(0,77,0,0.06)] hover:border-primary-green/45 transition-all duration-300"
    >
      {/* Decorative Glow Orb */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-accent-green/5 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

      {/* Icon Wrapper */}
      <div className="h-12 w-12 rounded-2xl bg-card-bg text-primary-green border border-input-border/20 flex items-center justify-center shadow-inner shrink-0">
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2">
        <h3 className="text-base sm:text-lg font-extrabold text-primary-dark tracking-tight leading-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Hover visual cue */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-green via-accent-green to-accent-yellow scale-x-0 origin-left hover:scale-x-100 transition-transform duration-300" />
    </motion.div>
  );
}
