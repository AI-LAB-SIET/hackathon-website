"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

interface AIAssistantButtonProps {
  onClick: () => void;
  isOpen: boolean;
  hasUnread: boolean;
}

export default function AIAssistantButton({ onClick, isOpen, hasUnread }: AIAssistantButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-14 h-14 rounded-full bg-primary-green hover:bg-green-hover text-white shadow-[0_8px_32px_rgba(88,204,2,0.3)] hover:shadow-[0_12px_40px_rgba(88,204,2,0.55)] border-2 border-white dark:border-primary-dark cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-4 focus-visible:ring-primary-green/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0f172a]"
      // Smooth floating idle animation when closed
      animate={isOpen ? { scale: 0.95 } : {
        y: [0, -6, 0],
        transition: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
      whileTap={{ scale: 0.9 }}
    >
      <div className="relative">
        {isOpen ? (
          <motion.div
            initial={{ rotate: -45, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 45, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <MessageSquare className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-center"
          >
            <CuteRoboIcon />
          </motion.div>
        )}

        {/* Unread Message Badge */}
        {!isOpen && hasUnread && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 flex h-4 w-4"
          >
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red border border-white dark:border-primary-dark"></span>
          </motion.span>
        )}
      </div>
    </motion.button>
  );
}

function CuteRoboIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      {/* Antenna */}
      <rect x="17" y="3" width="2" height="5" rx="1" fill="currentColor" />
      <motion.circle
        cx="18"
        cy="3"
        r="2"
        fill="#fcd34d"
        animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      />
      
      {/* Ears */}
      <rect x="4" y="15" width="3" height="8" rx="1.5" fill="#a7f3d0" />
      <rect x="29" y="15" width="3" height="8" rx="1.5" fill="#a7f3d0" />

      {/* Head Body */}
      <rect
        x="6"
        y="8"
        width="24"
        height="22"
        rx="6"
        fill="currentColor"
        stroke="#100f3e"
        strokeWidth="2"
      />

      {/* Glass Face Screen */}
      <rect
        x="9"
        y="11"
        width="18"
        height="13"
        rx="4"
        fill="#100f3e"
      />

      {/* Eyes */}
      <motion.circle
        cx="14"
        cy="17"
        r="2"
        fill="#58cc02"
        animate={{ scaleY: [1, 1, 0.1, 1] }}
        transition={{ repeat: Infinity, duration: 4, repeatDelay: 1.5 }}
      />
      <motion.circle
        cx="22"
        cy="17"
        r="2"
        fill="#58cc02"
        animate={{ scaleY: [1, 1, 0.1, 1] }}
        transition={{ repeat: Infinity, duration: 4, repeatDelay: 1.5 }}
      />

      {/* Rosy Cheeks */}
      <circle cx="11" cy="20" r="1" fill="#f43f5e" opacity="0.6" />
      <circle cx="25" cy="20" r="1" fill="#f43f5e" opacity="0.6" />

      {/* Happy Mouth */}
      <motion.path
        d="M16 21 Q18 23 20 21"
        stroke="#58cc02"
        strokeWidth="1.5"
        strokeLinecap="round"
        animate={{ d: ["M16 21 Q18 23 20 21", "M15 21 H21", "M16 21 Q18 23 20 21"] }}
        transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
      />
    </svg>
  );
}
