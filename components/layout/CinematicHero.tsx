"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { UserSession } from "@/types";

interface CinematicHeroProps {
  session: UserSession;
}

const VIDEO_URL = "/hero-bg.mp4";

/**
 * Cinematic, editorial hero.
 *
 * Visual composition (faithful to the reference):
 *  - Typography sits HIGH in the upper third, in generous white space.
 *  - The video is NOT a full-bleed background. It is positioned lower on the
 *    page (top: 300px) so it reads as scenery emerging from beneath the type.
 *  - The video is shown at its natural framing (object-fit cover, no aggressive
 *    zoom/crop) and never overpowers the typography.
 *  - Overlay is a very subtle fade: white → transparent → video → white.
 *
 * Fade loop: visibility-first (starts at opacity 1). A requestAnimationFrame
 * loop drives smooth fade in/out for a seamless manual loop; if `duration` is
 * unknown for the stream, the video simply stays fully visible and loops.
 */
export function CinematicHero({ session }: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoError) return;

    const FADE_DURATION = 0.5; // seconds

    const tick = () => {
      const { currentTime, duration } = video;
      if (duration && Number.isFinite(duration) && duration > 0) {
        let target = 1;
        if (currentTime < FADE_DURATION) {
          target = currentTime / FADE_DURATION; // fade in at start
        } else if (duration - currentTime < FADE_DURATION) {
          target = (duration - currentTime) / FADE_DURATION; // fade out before end
        }
        const newOpacity = Math.max(0, Math.min(1, target));
        setVideoOpacity(newOpacity);
        if (Math.abs(newOpacity - target) < 0.01 && (target === 0 || target === 1)) {
          return; // stop loop when at steady state
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [videoError]);

  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;
    setVideoOpacity(0);
    window.setTimeout(() => {
      try {
        video.currentTime = 0;
        void video.play();
      } catch {
        /* autoplay may be blocked; ignore */
      }
    }, 100);
  };

  return (
    <section className="relative w-full h-[85vh] sm:h-screen overflow-hidden bg-white dark:bg-primary-dark transition-colors duration-300">
      {/* ── Ambient Glow Background (always present or fallback) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden gradient-mesh">
        {/* Glow orbs for premium visual aesthetic */}
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-primary-green/10 dark:bg-primary-green/5 glow-orb animate-float" />
        <div className="absolute bottom-[20%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-blue/10 dark:bg-blue/5 glow-orb animate-float-reverse" />
        
        {!videoError ? (
          <video
            ref={videoRef}
            src={VIDEO_URL}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onEnded={handleEnded}
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: videoOpacity }}
          />
        ) : null}

        {/* Dynamic theme-aware gradients so the type remains readable. */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-[#100f3e] dark:via-[#100f3e]/80" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/40 to-transparent dark:from-[#100f3e] dark:via-[#100f3e]/40" />
      </div>

      {/* ── Editorial content (z-10): anchored to the UPPER portion ── */}
      <div className="relative z-10 h-full mx-auto max-w-3xl px-6 flex flex-col items-center text-center justify-start pt-[14vh] sm:pt-[18vh]">
        {/* Badge */}
        <div className="animate-fade-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-sm transition-all duration-300">
          <Sparkles className="h-3.5 w-3.5 text-primary-green" />
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] text-[#6F6F6F] dark:text-slate-300">
            SIET Annual AI Hackathon 2026
          </span>
        </div>

        {/* Headline — single line, Instrument Serif, elegant, tight */}
        <h1
          className="animate-fade-rise-delay mt-6 font-serif text-black dark:text-white transition-colors duration-300"
          style={{
            fontWeight: 400,
            fontSize: "clamp(1.75rem, 4.5vw, 3.25rem)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Architecting the Future of{" "}
          <em className="font-serif italic text-primary-green dark:text-accent-green">Agentic Intelligence</em>
        </h1>

        <p className="animate-fade-rise-delay mt-4 text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
          Join the premier College AI Lab Hackathon. Collaborate with brilliant minds, build next-gen AI projects, and showcase your solutions.
        </p>

        {/* CTA — understated, premium */}
        <div className="animate-fade-rise-delay-2 mt-8">
          {session.isLoggedIn ? (
            <Link
              href={session.role === "admin" ? "/admin" : session.role === "judge" ? "/judge" : session.role === "organizer" ? "/organizer" : session.role === "volunteer" ? "/volunteer" : "/dashboard"}
              className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold bg-black dark:bg-white text-white dark:text-black transition-all duration-300 hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5 shadow-md"
            >
              Go to Workspace
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold bg-black dark:bg-white text-white dark:text-black transition-all duration-300 hover:bg-slate-800 dark:hover:bg-slate-100 hover:-translate-y-0.5 shadow-md"
              >
                Register Your Team
              </Link>
              <Link
                href="/hackathon"
                className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold bg-transparent text-[#6F6F6F] dark:text-slate-300 border border-black/15 dark:border-white/15 transition-all duration-300 hover:text-black dark:hover:text-white hover:border-black/35 dark:hover:border-white/35 hover:-translate-y-0.5"
              >
                Learn More
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
