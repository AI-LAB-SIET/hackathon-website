"use client";

/**
 * components/ui/AIChatWindow.tsx
 *
 * Phase 2 changes:
 * - Generates a stable sessionId (UUID) per chat window mount for server-side
 *   conversation tracking.
 * - Fixed the double-call bug: previously sendMessage was called twice
 *   (once for streaming preview, once for final text). Now a single call
 *   accumulates the streamed text and persists it.
 * - Added "Regenerate" button on the last AI message.
 * - Added per-message "Copy" button on AI messages.
 * - Added error state: red banner with a Retry button when the API fails.
 * - Updated status line from "Simulated Service" → "Online".
 * - On clear conversation, also calls DELETE /api/chat to clear server-side history.
 * - All existing UI (markdown renderer, suggestions, typing indicator, layout) preserved.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, X, Minimize2, Trash2, Bot, User, CornerDownLeft,
  Sparkles, Check, Copy, RefreshCw, AlertTriangle,
} from "lucide-react";
import { useAppState } from "@/components/layout/StateProvider";
import { aiService, AIMessage } from "@/lib/services/aiService";

interface AIChatWindowProps {
  onClose: () => void;
  onMinimize: () => void;
}

// ── Stable UUID generator (no external dependency) ───────────────────────────
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ── Markdown Renderer (unchanged from Phase 1) ────────────────────────────────
const MarkdownRenderer = React.memo(({ text }: { text: string }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const parseInline = (line: string) => {
    const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g;
    const matches = line.split(regex);
    return matches.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**"))
        return <strong key={i} className="font-extrabold text-slate-900 dark:text-white">{token.slice(2, -2)}</strong>;
      if (token.startsWith("`") && token.endsWith("`"))
        return <code key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-red dark:text-red-400 font-mono text-sm">{token.slice(1, -1)}</code>;
      const linkMatch = token.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch)
        return (
          <a key={i} href={linkMatch[2]} className="text-blue hover:underline font-semibold"
            target={linkMatch[2].startsWith("/") ? "_self" : "_blank"} rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        );
      return token;
    });
  };

  const parseStructure = () => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let currentCodeBlock: { lang: string; code: string[] } | null = null;
    let inList = false;
    let listItems: React.ReactNode[] = [];

    const flushList = (key: number) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-slate-700 dark:text-slate-300">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, idx) => {
      if (line.trim().startsWith("```")) {
        if (currentCodeBlock) {
          const codeString = currentCodeBlock.code.join("\n");
          const blockId = `code-${idx}`;
          const isCopied = copiedId === blockId;
          elements.push(
            <div key={blockId} className="my-3 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 font-mono text-sm shadow-md">
              <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 select-none">
                <span>{currentCodeBlock.lang || "code"}</span>
                <button onClick={() => handleCopy(codeString, blockId)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer" title="Copy Code">
                  {isCopied ? <Check className="w-3.5 h-3.5 text-primary-green" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto scrollbar-none font-mono"><code>{codeString}</code></pre>
            </div>
          );
          currentCodeBlock = null;
        } else {
          flushList(idx);
          currentCodeBlock = { lang: line.trim().slice(3).trim(), code: [] };
        }
        return;
      }
      if (currentCodeBlock) { currentCodeBlock.code.push(line); return; }

      if (line.startsWith("### ")) { flushList(idx); elements.push(<h4 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5">{parseInline(line.slice(4))}</h4>); return; }
      if (line.startsWith("## ")) { flushList(idx); elements.push(<h3 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{parseInline(line.slice(3))}</h3>); return; }
      if (line.startsWith("# ")) { flushList(idx); elements.push(<h2 key={idx} className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2">{parseInline(line.slice(2))}</h2>); return; }

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        inList = true;
        listItems.push(<li key={`li-${idx}`}>{parseInline(line.trim().slice(2))}</li>);
        return;
      }

      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        flushList(idx);
        elements.push(
          <div key={idx} className="flex gap-2 my-1 pl-1 text-slate-700 dark:text-slate-300">
            <span className="font-bold text-primary-green">{numMatch[1]}.</span>
            <div>{parseInline(numMatch[2])}</div>
          </div>
        );
        return;
      }

      if (line.trim() === "" && inList) return;
      if (!line.trim().startsWith("- ") && !line.trim().startsWith("* ") && inList) flushList(idx);
      if (line.trim() === "") { elements.push(<div key={idx} className="h-2" />); return; }

      elements.push(<p key={idx} className="my-1.5 leading-relaxed text-slate-700 dark:text-slate-300">{parseInline(line)}</p>);
    });

    flushList(lines.length);
    return elements;
  };

  return <div className="text-sm font-normal wrap-break-word">{parseStructure()}</div>;
});
MarkdownRenderer.displayName = "MarkdownRenderer";

// ── Main chat window ──────────────────────────────────────────────────────────

export default function AIChatWindow({ onClose, onMinimize }: AIChatWindowProps) {
  const { session } = useAppState();

  // Stable session ID — one per chat window mount
  const sessionId = useMemo(() => generateUUID(), []);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Load chat session history from session storage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("siet_ai_chat_v2");
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch { /* ignore */ }
    } else {
      const welcome: AIMessage = {
        id: "welcome",
        sender: "ai",
        text: `Welcome, **${session.name || "Guest"}**! 👋 I am your AI Hackathon assistant.\n\nHow can I assist you with your hackathon journey today? Ask me about rules, deadlines, check-ins, or submissions!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages([welcome]);
    }
  }, [session.name]);

  // Persist messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("siet_ai_chat_v2", JSON.stringify(messages));
    }
  }, [messages]);

  // Load contextual suggestions
  useEffect(() => {
    setSuggestions(aiService.getSuggestions(session.role));
  }, [session.role]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);
  useEffect(() => { scrollToBottom(); }, [messages, isTyping, streamedText, scrollToBottom]);

  // Copy message text to clipboard
  const handleCopyMessage = useCallback((msgId: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    });
  }, []);

  // Core send logic — single streaming call
  const handleSend = useCallback(async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    setApiError(null);
    setLastUserMessage(textToSend.trim());

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
    setStreamedText("");

    try {
      const result = await aiService.sendMessage(
        textToSend.trim(),
        session.role,
        (chunk) => setStreamedText(chunk),
        sessionId
      );

      const aiMsg: AIMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        error: result.error,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setStreamedText("");

      if (result.error) {
        setApiError(result.text);
      }
    } catch {
      const errMsg: AIMessage = {
        id: `msg-${Date.now()}-err`,
        sender: "ai",
        text: "⚠️ Sorry, there was an issue processing your request. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        error: true,
      };
      setMessages((prev) => [...prev, errMsg]);
      setApiError("Connection failed. Please check your network and try again.");
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, session.role, sessionId]);

  // Regenerate last AI response
  const handleRegenerate = useCallback(() => {
    if (!lastUserMessage || isTyping) return;
    // Remove the last AI message before resending
    setMessages((prev) => {
      const lastAiIdx = [...prev].reverse().findIndex((m) => m.sender === "ai");
      if (lastAiIdx === -1) return prev;
      const idx = prev.length - 1 - lastAiIdx;
      return prev.filter((_, i) => i !== idx);
    });
    setApiError(null);
    handleSend(lastUserMessage);
  }, [lastUserMessage, isTyping, handleSend]);

  // Keyboard shortcut
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputText);
    }
  };

  // ESC to close
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onClose]);

  // Clear conversation (local + server-side history)
  const handleClearChat = useCallback(async () => {
    sessionStorage.removeItem("siet_ai_chat_v2");
    setApiError(null);
    setLastUserMessage("");

    // Clear server-side conversation history
    fetch("/api/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    }).catch(() => { /* best effort */ });

    const welcome: AIMessage = {
      id: "welcome",
      sender: "ai",
      text: `Chat cleared. How can I help you, **${session.name || "Guest"}**?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([welcome]);
  }, [session.name, sessionId]);

  // Find index of last AI message for Regenerate button
  const lastAiMsgIdx = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "ai") return i;
    }
    return -1;
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: 50, x: 20 }}
      transition={{ type: "spring", damping: 25, stiffness: 220 }}
      className="fixed bottom-24 right-6 z-9999 w-[92vw] sm:w-[420px] h-[580px] max-h-[78vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden glassmorphism"
      role="dialog"
      aria-modal="true"
      aria-label="AI Platform Assistant Dialog"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 bg-linear-to-r from-primary-dark to-slate-900 text-white select-none">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary-green/20 border border-primary-green text-primary-green">
            <Bot className="w-4.5 h-4.5" />
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary-green border border-primary-dark animate-pulse" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight flex items-center gap-1.5">
              <span>Hack Lab Copilot</span>
              {session.role && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-primary-green border border-primary-green/30 font-semibold uppercase tracking-wider">
                  {session.role}
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-green" />
              Online
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={handleClearChat}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-red transition-colors cursor-pointer"
            title="Clear Conversation" aria-label="Clear chat conversation history">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={onMinimize}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Minimize Chat" aria-label="Minimize Chat Window">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Chat" aria-label="Close Chat Window">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {apiError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-4 py-2 bg-red/10 border-b border-red/20 text-red text-xs"
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 line-clamp-2">{apiError}</span>
            {lastUserMessage && (
              <button
                onClick={handleRegenerate}
                disabled={isTyping}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-red/10 hover:bg-red/20 text-red font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => {
            const isAI = msg.sender === "ai";
            const prevMsg = messages[i - 1];
            const showSenderHeader = !prevMsg || prevMsg.sender !== msg.sender;
            const isLastAi = i === lastAiMsgIdx;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isAI ? "items-start" : "items-end"}`}
              >
                {showSenderHeader && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mb-1 px-1.5">
                    {isAI ? <Bot className="w-3 h-3 text-primary-green" /> : <User className="w-3 h-3" />}
                    {isAI ? "Hack Lab Copilot" : session.name || "You"}
                  </span>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                  isAI
                    ? msg.error
                      ? "bg-red/5 dark:bg-red/10 text-slate-800 dark:text-slate-200 border border-red/20 rounded-tl-sm"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-sm"
                    : "bg-primary-green text-white rounded-tr-sm"
                }`}>
                  <MarkdownRenderer text={msg.text} />
                  <div className={`text-[9px] mt-1 text-right select-none ${isAI ? "text-slate-400 dark:text-slate-500" : "text-white/70"}`}>
                    {msg.timestamp}
                  </div>
                </div>

                {/* AI message actions: Copy + Regenerate (last message only) */}
                {isAI && !msg.error && (
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.text)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copy message"
                    >
                      {copiedMsgId === msg.id ? (
                        <><Check className="w-3 h-3 text-primary-green" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                    {isLastAi && lastUserMessage && !isTyping && (
                      <button
                        onClick={handleRegenerate}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Regenerate response"
                      >
                        <RefreshCw className="w-3 h-3" /> Regenerate
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Streaming Text Placeholder */}
          {isTyping && streamedText && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start">
              <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mb-1 px-1.5">
                <Bot className="w-3 h-3 text-primary-green" /> Hack Lab Copilot
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 shadow-sm text-sm">
                <MarkdownRenderer text={streamedText} />
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-primary-green animate-pulse align-middle" />
              </div>
            </motion.div>
          )}

          {/* Typing Indicator (before first delta arrives) */}
          {isTyping && !streamedText && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm w-16">
              <span className="w-2 h-2 rounded-full bg-primary-green animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-primary-green animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-primary-green animate-bounce" />
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompts */}
      {suggestions.length > 0 && !isTyping && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 flex gap-1.5 overflow-x-auto scrollbar-none select-none">
          {suggestions.map((prompt, i) => (
            <button key={i} onClick={() => handleSend(prompt)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border border-slate-200 dark:border-slate-800 hover:border-primary-green dark:hover:border-primary-green bg-slate-50 hover:bg-primary-green/5 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:text-primary-green dark:hover:text-primary-green transition-all whitespace-nowrap cursor-pointer">
              <Sparkles className="w-3 h-3 text-primary-green" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 flex items-end gap-2">
        <div className="flex-1 relative flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a question..."
            disabled={isTyping}
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm outline-none focus:border-primary-green dark:focus:border-primary-green resize-none max-h-24 scrollbar-none disabled:opacity-60"
            style={{ height: "auto" }}
          />
          <span className="absolute right-3.5 bottom-3.5 hidden md:flex items-center gap-1 text-[9px] text-slate-400 select-none pointer-events-none">
            <span>Enter</span>
            <CornerDownLeft className="w-2.5 h-2.5" />
          </span>
        </div>
        <button
          onClick={() => handleSend(inputText)}
          disabled={!inputText.trim() || isTyping}
          className="flex items-center justify-center p-3 rounded-xl bg-primary-green hover:bg-green-hover text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 transition-colors duration-150 cursor-pointer shadow-sm disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </div>
    </motion.div>
  );
}
