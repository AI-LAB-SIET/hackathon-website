"use client";

import React, { useEffect, useState, useRef } from "react";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const trailRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const glowDomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Disable trail glow on mobile/touch devices for accessibility and performance
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    setMounted(true);
    setIsVisible(true);

    const handleMouseMove = (e: MouseEvent) => {
      cursorRef.current.x = e.clientX;
      cursorRef.current.y = e.clientY;
      
      // Performant hover detection (no getComputedStyle/reflow triggers)
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = !!target.closest("a, button, input, select, textarea, [role='button'], .cursor-pointer");
        setIsHovered(isInteractive);
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    // High performance animation loop
    let rafId: number;
    const updatePosition = () => {
      const dx = cursorRef.current.x - trailRef.current.x;
      const dy = cursorRef.current.y - trailRef.current.y;
      
      trailRef.current.x += dx * 0.2;
      trailRef.current.y += dy * 0.2;

      if (glowDomRef.current) {
        glowDomRef.current.style.transform = `translate3d(${trailRef.current.x}px, ${trailRef.current.y}px, 0)`;
      }

      rafId = requestAnimationFrame(updatePosition);
    };
    
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
      cancelAnimationFrame(rafId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-99999 hidden md:block transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Glowing Ambient Aura trailing the standard pointer */}
      {/* 
        CRITICAL: We only transition scale, bg, filter, and shadow. 
        We do NOT transition 'transform' because it is updated continuously by JS at 60fps.
        Transitioning transform causes severe visual jitter/glitching.
      */}
      <div
        ref={glowDomRef}
        className={`fixed top-0 left-0 w-16 h-16 -mt-8 -ml-8 rounded-full pointer-events-none will-change-transform transition-all duration-300 ease-out
          ${isHovered 
            ? 'bg-primary-green/22 blur-sm scale-[1.5] shadow-[0_0_20px_rgba(88,204,2,0.25)]' 
            : 'bg-primary-green/12 blur-[10px] scale-100'
          }
        `}
        style={{
          transitionProperty: "scale, background-color, filter, box-shadow",
          transform: `translate3d(${trailRef.current.x}px, ${trailRef.current.y}px, 0)`,
        }}
      />
    </div>
  );
}
