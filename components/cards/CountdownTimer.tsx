"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set target date 10 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 9);
    targetDate.setHours(targetDate.getHours() + 14);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const timeBlocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className="flex gap-3 sm:gap-5 justify-center items-center select-none">
      {timeBlocks.map((block, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-white border border-input-border/40 text-primary-dark shadow-[0_8px_20px_-6px_rgba(0,100,0,0.1)] flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-0 right-0 h-px bg-input-border/20 z-10" />
            <AnimatePresence mode="popLayout">
              <motion.span
                key={block.value}
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -15, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="text-2xl sm:text-4xl font-extrabold tracking-tight z-20 text-primary-dark"
              >
                {String(block.value).padStart(2, "0")}
              </motion.span>
            </AnimatePresence>
            {/* Subtle glow orb */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-accent-green/5 blur-md" />
          </motion.div>
          <span className="text-[10px] sm:text-xs font-bold text-primary-green uppercase tracking-widest mt-2">
            {block.label}
          </span>
        </div>
      ))}
    </div>
  );
}
