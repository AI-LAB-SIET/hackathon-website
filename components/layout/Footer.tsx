"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Github, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Github className="h-4 w-4" />, href: "https://github.com", name: "GitHub" },
    { icon: <Twitter className="h-4 w-4" />, href: "https://twitter.com", name: "Twitter" },
    { icon: <Linkedin className="h-4 w-4" />, href: "https://linkedin.com", name: "LinkedIn" },
  ];

  return (
    <footer className="relative bg-white border-t border-input-border/30 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-72 h-72 rounded-full bg-primary-green/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-accent-yellow/5 blur-[140px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2 select-none">
              <div className="relative h-9 w-9 overflow-hidden">
                <Image
                  src="/siet_logo.png"
                  alt="SIET Logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold tracking-tight text-primary-dark text-lg">
                SIET<span className="text-accent-green"> AI_LAB</span>
              </span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              Empowering undergraduate research, machine learning exploration, and agentic intelligence projects at the Sri Shakthi Institute of Engineering and Technology.
            </p>
            <div className="flex gap-3 mt-2">
              {socialLinks.map((s, idx) => (
                <motion.a
                  key={idx}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-8 w-8 rounded-lg bg-card-bg text-primary-green border border-input-border/30 flex items-center justify-center hover:bg-primary-green hover:text-white transition-colors duration-250 cursor-pointer"
                  title={s.name}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Quick Links Col */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-primary-dark uppercase tracking-wider">Event Navigator</h4>
            <div className="flex flex-col gap-2">
              {[
                { name: "Overview", href: "/" },
                { name: "Hackathon Details", href: "/hackathon" },
                { name: "Resources Hub", href: "/resources" },
                { name: "Contact & Support", href: "/contact" },
              ].map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className="text-xs text-gray-500 hover:text-primary-green hover:translate-x-1 transition-all duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources Col */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-primary-dark uppercase tracking-wider">Resources</h4>
            <div className="flex flex-col gap-2">
              {[
                { name: "College AI Portal", href: "#" },
                { name: "Idea Slide Deck Template", href: "#" },
                { name: "API Documentation", href: "#" },
                { name: "FAQ Support", href: "/#faq" },
              ].map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  className="text-xs text-gray-500 hover:text-primary-green hover:translate-x-1 transition-all duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Contact Col */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-primary-dark uppercase tracking-wider">Get in Touch</h4>
            <div className="flex flex-col gap-2.5 text-xs text-gray-500">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary-green shrink-0 mt-0.5" />
                <span className="leading-relaxed">SIET AI Research Lab, Main Block, Coimbatore, TN, India</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-primary-green shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-primary-green shrink-0" />
                <a href="mailto:ailab@siet.ac.in" className="hover:text-primary-green transition-colors">
                  ailab@siet.ac.in
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-input-border/30 to-transparent my-10" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] sm:text-xs text-gray-400">
            &copy; {currentYear} SIET AI Lab. All rights reserved. Designed for portfolios.
          </p>
          <div className="flex gap-6 text-[10px] sm:text-xs text-gray-400">
            <a href="#" className="hover:text-primary-green transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-green transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
