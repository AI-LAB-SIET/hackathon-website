"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "./StateProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Shield, Bell, QrCode, CheckCircle, Clock, AlertTriangle, Info } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";
import { useToast } from "../ui/toast";
import { AttendancePanel } from "../ui/AttendancePanel";
import { Team } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout, notifications, markNotificationRead, markAllNotificationsRead } = useAppState();
  useTheme();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [attendanceTeam, setAttendanceTeam] = useState<Team | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check immediately on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navLinks = [
    { name: "Overview", href: "/" },
    { name: "Hackathon", href: "/hackathon" },
    { name: "Contact", href: "/contact" },
  ];

  const rolePortalHref =
    session.role === "admin" ? "/admin"
    : session.role === "judge" ? "/judge"
    : session.role === "organizer" ? "/organizer"
    : session.role === "volunteer" ? "/volunteer"
    : "/dashboard";

  const rolePortalLabel =
    session.role === "admin" ? "Admin Panel"
    : session.role === "judge" ? "Judge Portal"
    : session.role === "organizer" ? "Organizer Portal"
    : session.role === "volunteer" ? "Volunteer Portal"
    : "My Dashboard";

  const handleLogout = () => {
    logout();
    toast("Successfully logged out.", "info");
    router.push("/");
    setMobileMenuOpen(false);
  };

  // Close bell on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifIconMap: Record<string, React.ReactNode> = {
    approval: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
    deadline: <Clock className="h-3.5 w-3.5 text-amber-500" />,
    action: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
    judge: <CheckCircle className="h-3.5 w-3.5 text-blue-500" />,
    mentor: <User className="h-3.5 w-3.5 text-purple-500" />,
    system: <Info className="h-3.5 w-3.5 text-gray-400" />,
  };

  const handleQRSelect = (team: Team) => {
    if (session.role === "organizer") {
      setAttendanceTeam(team);
    } else if (session.role === "judge") {
      router.push("/judge");
      toast(`Opening evaluation for ${team.name}`, "info");
    } else if (session.role === "admin") {
      router.push("/admin");
      toast(`Viewing full profile for ${team.name}`, "info");
    }
  };

  const isHome = pathname === "/";
  const useTransparent = isHome && !scrolled;

  return (
    <>
      <header className={isHome ? (useTransparent ? "fixed top-0 left-0 right-0 z-40 w-full bg-transparent border-none shadow-none transition-all duration-300" : "fixed top-0 left-0 right-0 z-40 w-full glassmorphism border-b border-input-border/10 dark:border-gray-800 transition-all duration-300") : "sticky top-0 z-40 w-full glassmorphism"}>
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 select-none group">
            <div className="relative h-7 w-7 overflow-hidden">
              <Image src="/siet_logo.png" alt="AI Lab Logo" fill sizes="28px" priority className="object-contain" />
            </div>
            <span className={`font-serif text-xl tracking-tight transition-colors duration-300 ${useTransparent ? "text-white" : "text-black dark:text-white"}`}>
              SIET<span className="text-primary-green">_HACKATHONS</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-9">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] font-medium tracking-wide transition-colors duration-300 ${
                    useTransparent
                      ? isActive
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                      : isActive
                      ? "text-black dark:text-white"
                      : "text-[#6F6F6F] hover:text-black dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {session.isLoggedIn ? (
              <>

                 {/* Notification Bell */}
                <div ref={bellRef} className="relative">
                  <button
                    onClick={() => setBellOpen(!bellOpen)}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                    className={
                      useTransparent
                        ? "relative p-2 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        : "relative p-2 rounded-full text-[#6F6F6F] hover:text-black hover:bg-black/5 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                    }
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4.5 w-4.5 min-w-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Bell Dropdown */}
                  <AnimatePresence>
                    {bellOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 dark:bg-gray-900 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <span className="font-bold text-primary-dark text-sm dark:text-gray-100">Notifications</span>
                          {unreadCount > 0 && (
                            <button onClick={markAllNotificationsRead} aria-label="Mark all notifications as read" className="text-xs text-primary-green font-semibold hover:underline cursor-pointer">
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          {notifications.slice(0, 6).map((n) => (
                            <button
                              key={n.id}
                              onClick={() => { markNotificationRead(n.id); }}
                              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer border-b border-gray-50 last:border-0 dark:hover:bg-gray-800 dark:border-gray-800 ${!n.read ? "bg-emerald-50/40 dark:bg-emerald-900/20" : ""}`}
                            >
                              <div className="mt-0.5 shrink-0">{notifIconMap[n.type] || notifIconMap.system}</div>
                              <div className="flex-1 min-w-0">
                                <div className={`text-xs font-semibold ${!n.read ? "text-primary-dark" : "text-gray-600"} truncate dark:text-gray-200`}>{n.title}</div>
                                <div className="text-xs text-gray-400 truncate dark:text-gray-500">{n.body}</div>
                              </div>
                              {!n.read && <div className="h-2 w-2 rounded-full bg-primary-green shrink-0 mt-1" />}
                            </button>
                          ))}
                        </div>
                        <Link
                          href={rolePortalHref}
                          onClick={() => setBellOpen(false)}
                          className="block text-center text-xs font-semibold text-primary-green py-3 hover:bg-emerald-50 transition-colors border-t border-gray-100 dark:hover:bg-emerald-900/20 dark:border-gray-700"
                        >
                          View all notifications →
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Theme Toggle */}
                <ThemeToggle transparent={useTransparent} />

                <Link
                  href={rolePortalHref}
                  className={
                    useTransparent
                      ? "inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                      : "inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full text-[#6F6F6F] hover:text-black hover:bg-black/5 transition-colors dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                  }
                >
                  {session.role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {rolePortalLabel}
                </Link>
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
             ) : (
              <>
                <Link
                  href="/login"
                  className={`text-[13px] font-medium transition-colors duration-300 px-1 ${
                    useTransparent ? "text-white/60 hover:text-white" : "text-[#6F6F6F] hover:text-black dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className={`inline-flex items-center text-[13px] font-medium px-5 py-2 rounded-full transition-all duration-300 hover:-translate-y-0.5 ${
                    useTransparent
                      ? "bg-white text-[#001f2d] hover:bg-white/90"
                      : "bg-black text-white hover:bg-[#222] dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                  }`}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className={`md:hidden p-1.5 rounded-xl transition-colors cursor-pointer ${
              useTransparent
                ? "text-white hover:bg-white/10"
                : "text-gray-700 hover:bg-card-bg hover:text-primary-dark dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            }`}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-30 bg-black md:hidden" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-35 w-3/4 max-w-sm bg-white p-6 shadow-2xl border-l border-input-border/20 md:hidden flex flex-col pt-20 dark:bg-gray-900 dark:border-gray-700"
            >
              <div className="flex flex-col gap-6 flex-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-bold py-2 border-b border-gray-100 dark:border-gray-700 ${pathname === link.href ? "text-primary-green" : "text-gray-800 dark:text-gray-200"}`}
                  >{link.name}</Link>
                ))}
              </div>
              <div className="flex flex-col gap-3 mt-auto">
                {session.isLoggedIn ? (
                  <>
                    <Link href={rolePortalHref} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card-bg dark:bg-gray-800 text-primary-dark dark:text-gray-100 font-bold text-sm border border-input-border/30 dark:border-gray-700"
                    >
                      {session.role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      {rolePortalLabel}
                    </Link>
                    <button onClick={handleLogout}
                      aria-label="Log out"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold text-sm border border-red-150 dark:border-red-800 cursor-pointer"
                    ><LogOut className="h-4 w-4" /> Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full py-3 rounded-xl border border-input-border/40 dark:border-gray-700 text-primary-dark dark:text-gray-100 font-bold text-sm hover:bg-card-bg dark:hover:bg-gray-800 transition-colors"
                    >Login</Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full py-3 rounded-xl bg-primary-green text-white font-bold text-sm shadow-md hover:bg-primary-dark transition-all"
                    >Sign Up</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Attendance Panel (organizer) */}
      {attendanceTeam && (
        <AttendancePanel
          team={attendanceTeam}
          open={!!attendanceTeam}
          onClose={() => setAttendanceTeam(null)}
          scannerName={session.name || session.email || "Organizer"}
        />
      )}
    </>
  );
}
