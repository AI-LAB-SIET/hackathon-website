"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { UserSession } from "@/types";

interface CinematicHeroProps {
  session: UserSession;
}

const VIDEO_URL =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260328_083109_283f3553-e28f-428b-a723-d639c617eb2b.mp4";

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

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
  }, []);

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
    <section className="relative w-full h-screen overflow-hidden bg-white">
      {/* ── Video background (z-0): covers the whole hero ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          ref={videoRef}
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: videoOpacity }}
        />
        {/* Gentle fades so the type stays readable. White at top (behind text),
            transparent in the middle (video shows through), soft white at bottom. */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white via-white/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white via-white/30 to-transparent" />
      </div>

      {/* ── Editorial content (z-10): anchored to the UPPER portion ── */}
      <div className="relative z-10 h-full mx-auto max-w-3xl px-6 flex flex-col items-center text-center justify-start pt-[12vh]">
        {/* Badge */}
        <div className="animate-fade-rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-black/5">
          <Sparkles className="h-3 w-3 text-primary-green" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6F6F6F]">
            SIET Annual AI Hackathon 2026
          </span>
        </div>

        {/* Headline — single line, Instrument Serif, elegant, tight */}
        <h1
          className="animate-fade-rise-delay mt-5 font-serif text-black whitespace-nowrap"
          style={{
            fontWeight: 400,
            fontSize: "clamp(1.5rem, 3.2vw, 2.5rem)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Architecting the Future of{" "}
          <em className="font-serif italic text-[#9b9b9b]">Agentic Intelligence</em>
        </h1>

        {/* CTA — understated, premium */}
        <div className="animate-fade-rise-delay-2 mt-6">
          {session.isLoggedIn ? (
            <Link
              href={session.role === "admin" ? "/admin" : "/dashboard"}
              className="inline-flex items-center justify-center px-7 py-2.5 rounded-full text-sm font-medium bg-black text-white transition-all duration-300 hover:bg-[#222] hover:-translate-y-0.5"
            >
              Go to Workspace
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-7 py-2.5 rounded-full text-sm font-medium bg-black text-white transition-all duration-300 hover:bg-[#222] hover:-translate-y-0.5"
              >
                Register Your Team
              </Link>
              <Link
                href="/hackathon"
                className="inline-flex items-center justify-center px-7 py-2.5 rounded-full text-sm font-medium bg-transparent text-[#6F6F6F] border border-black/10 transition-all duration-300 hover:text-black hover:border-black/20"
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
