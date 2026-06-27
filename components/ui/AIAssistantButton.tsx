"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Sparkles } from "lucide-react";

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
            <Sparkles className="w-6 h-6 animate-pulse-slow" />
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
