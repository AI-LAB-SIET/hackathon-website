"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import AIAssistantButton from "./AIAssistantButton";

// Lazy load the chat window to minimize initial performance footprint
const AIChatWindow = dynamic(() => import("./AIChatWindow"), {
  ssr: false,
  loading: () => null // Render nothing or a tiny skeleton while loading
});

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  // Show an unread badge 1.5 seconds after initial mount to gently invite interaction
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isOpen && !sessionStorage.getItem("siet_ai_chat_v2")) {
        setHasUnread(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const nextState = !prev;
      if (nextState) {
        setHasUnread(false);
      }
      return nextState;
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsOpen(false);
    // User minimized, we can set hasUnread if they left in-progress or minimized the chat
    setHasUnread(true);
  }, []);

  return (
    <>
      {/* Floating Action Button - Always Mounted, Lightweight */}
      <AIAssistantButton onClick={handleToggle} isOpen={isOpen} hasUnread={hasUnread} />

      {/* Lazy-loaded Chat Window - Mounted dynamically upon user interaction */}
      <AnimatePresence>
        {isOpen && (
          <AIChatWindow onClose={handleClose} onMinimize={handleMinimize} />
        )}
      </AnimatePresence>
    </>
  );
}
