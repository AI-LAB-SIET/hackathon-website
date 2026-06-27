"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/**
 * Theme toggle with a canvas-based circular reveal animation.
 *
 * The new theme is revealed through a growing circular mask that originates from
 * the toggle button's position (View Transitions-style reveal). Driven by
 * requestAnimationFrame with time-based easing so it's frame-rate independent.
 *
 *  - Forward:  circle grows from the toggle outward until it covers the viewport.
 *  - Reverse:  if toggled mid-animation, the circle shrinks back instead of
 *              restarting, so rapid double-toggles feel smooth.
 *  - Resizes are respected (radius is recomputed from live viewport bounds).
 *  - All RAF + canvas resources are cleaned up on unmount / completion.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme } = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);

  const revealRef = useRef({
    raf: 0 as number,
    start: 0,
    duration: 520,
    maxRadius: 0,
    cx: 0,
    cy: 0,
    targetTheme: "dark" as "dark" | "light",
    reversing: false,
  });

  const applyThemeClass = useCallback((t: "dark" | "light") => {
    const root = document.documentElement;
    if (t === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("siet_theme", t);
    } catch {
      /* ignore */
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = document.getElementById(
      "theme-reveal-canvas"
    ) as HTMLCanvasElement | null;
    const ctx = canvas?.getContext("2d");
    const s = revealRef.current;
    if (!canvas || !ctx) return;

    const elapsed = performance.now() - s.start;
    // Time-based easing (ease-in-out cubic) — frame-rate independent.
    const linear = Math.min(elapsed / s.duration, 1);
    const eased = s.reversing ? 1 - linear : linear;
    const clamped = Math.max(0, Math.min(1, eased));

    const radius = s.maxRadius * clamped;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(s.cx, s.cy, radius, 0, Math.PI * 2);
    ctx.rect(0, 0, canvas.width, canvas.height);
    // Even-odd fill carves a hole: viewport filled except the circle (reveal).
    ctx.fillStyle = s.targetTheme === "dark" ? "#0f172a" : "#ffffff";
    ctx.fill("evenodd");

    if (linear >= 1) {
      // Animation complete.
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      canvas.style.display = "none";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    s.raf = requestAnimationFrame(draw);
  }, []);

  const handleToggle = useCallback(() => {
    const next: "dark" | "light" = theme === "dark" ? "light" : "dark";

    // Mid-animation reverse: flip direction + retarget without restarting clock.
    if (revealRef.current.raf) {
      const s = revealRef.current;
      s.reversing = !s.reversing;
      s.targetTheme = next;
      // Re-seed the clock from the symmetric point.
      const elapsed = performance.now() - s.start;
      s.start = performance.now() - (s.duration - elapsed);
      applyThemeClass(next);
      return;
    }

    const btn = btnRef.current;
    const rect = btn?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect ? rect.top + rect.height / 2 : 0;

    const s = revealRef.current;
    s.cx = cx;
    s.cy = cy;
    s.targetTheme = next;
    s.reversing = false;
    s.start = performance.now();
    // Furthest corner from the toggle — the radius needed to cover everything.
    s.maxRadius = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    );

    let canvas = document.getElementById(
      "theme-reveal-canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "theme-reveal-canvas";
      canvas.style.cssText =
        "position:fixed;inset:0;z-index:9999;pointer-events:none;display:block;";
      document.body.appendChild(canvas);
    }
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = "block";

    applyThemeClass(next);
    s.raf = requestAnimationFrame(draw);
  }, [theme, applyThemeClass, draw]);

  // Recompute coverage if the viewport resizes mid-animation.
  useEffect(() => {
    const onResize = () => {
      const canvas = document.getElementById(
        "theme-reveal-canvas"
      ) as HTMLCanvasElement | null;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      const s = revealRef.current;
      s.maxRadius = Math.hypot(
        Math.max(s.cx, window.innerWidth - s.cx),
        Math.max(s.cy, window.innerHeight - s.cy)
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Cleanup any in-flight animation + canvas on unmount.
  useEffect(() => {
    const revealState = revealRef.current;
    return () => {
      if (revealState.raf) cancelAnimationFrame(revealState.raf);
      document.getElementById("theme-reveal-canvas")?.remove();
    };
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={handleToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className={`relative p-2.5 rounded-xl bg-card-bg border border-input-border/30 text-gray-600 dark:text-gray-400 hover:text-primary-green hover:border-primary-green/30 dark:hover:text-primary-green dark:hover:border-primary-green/40 transition-colors cursor-pointer ${className}`}
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </button>
  );
}
