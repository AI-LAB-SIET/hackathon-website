"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles, Volume2, VolumeX, ArrowUpRight } from "lucide-react";
import type { UserSession } from "@/types";

interface CinematicHeroProps {
  session: UserSession;
}

const VIDEO_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4";

export function CinematicHero({ session }: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  useState(true); // reserved for future video control
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  }, []);

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className="velorah-theme relative w-full min-h-[92vh] sm:min-h-screen overflow-hidden flex flex-col items-center justify-center bg-[#001f2d]"
    >
      {/* ── Fullscreen Background Video (inset-0, object-cover, z-0) ── */}
      <video
        ref={videoRef}
        src={VIDEO_URL}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />
      {/* Subtle tint to guarantee readable contrast while maintaining deep cinematic depth */}
      <div className="absolute inset-0 bg-black/10 mix-blend-multiply z-0 pointer-events-none" />

      {/* Interactive Cursor Spotlight Glow */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovering ? 0.35 : 0,
          background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, rgba(88, 204, 2, 0.18), transparent 80%)`,
        }}
      />

      {/* ── Content Area (z-10): Centered, editorial ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center pt-24 pb-20">

        {/* Animated Badge */}
        <div className="animate-fade-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 shadow-sm transition-all duration-300">
          <Sparkles className="h-3.5 w-3.5 text-white/80 animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-white">
            SIET SPECIAL LABS
          </span>
        </div>

        {/* Cinematic Heading (Instrument Serif, inline style) */}
        <h1
          className="animate-fade-rise mt-8 text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-7xl font-normal text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          The Premier <em className="not-italic text-muted-foreground">Platform for</em> SIET <em className="not-italic text-muted-foreground">Hackathons.</em>
        </h1>

        {/* Cinematic Subtext */}
        <p className="animate-fade-rise-delay mt-8 text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed font-normal">
          Empowering developers to discover events, form teams, and deploy production-grade code. Host, join, and manage hackathons seamlessly.
        </p>

        {/* CTA Actions (Liquid Glass, animate-fade-rise-delay-2) */}
        <div className="animate-fade-rise-delay-2 mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
          {session.isLoggedIn ? (
            <Link
              href={
                session.role === "admin"
                  ? "/admin"
                  : session.role === "judge"
                    ? "/judge"
                    : session.role === "organizer"
                      ? "/organizer"
                      : session.role === "volunteer"
                        ? "/volunteer"
                        : "/dashboard"
              }
              className="liquid-glass rounded-full px-14 py-5 text-base font-semibold text-white hover:scale-[1.03] active:scale-[0.98] transition-transform duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xl"
            >
              Go to Workspace
              <ArrowUpRight className="w-5 h-5 text-white/80" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="liquid-glass rounded-full px-14 py-5 text-base font-semibold text-white hover:scale-[1.03] active:scale-[0.98] transition-transform duration-300 inline-flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                Sign Up
                <ArrowUpRight className="w-5 h-5 text-white/80" />
              </Link>
              <Link
                href="/hackathon"
                className="rounded-full px-10 py-5 text-base font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
              >
                Learn More
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Floating Audio Controller */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={toggleMute}
          className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/25 text-white/80 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title={isMuted ? "Unmute video sound" : "Mute video sound"}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
}


