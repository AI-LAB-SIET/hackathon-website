"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "./StateProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Shield, Bell, QrCode, CheckCircle, Clock, AlertTriangle, Info } from "lucide-react";
import { useToast } from "../ui/toast";
import { QRScanner } from "../ui/QRScanner";
import { AttendancePanel } from "../ui/AttendancePanel";
import { Team } from "@/types";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout, notifications, markNotificationRead, markAllNotificationsRead } = useAppState();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [attendanceTeam, setAttendanceTeam] = useState<Team | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);

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

  const showQRScan = session.isLoggedIn && ["judge", "organizer", "admin"].includes(session.role || "");

  return (
    <>
      <header className="sticky top-0 z-40 w-full glassmorphism">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 select-none group">
            <div className="relative h-7 w-7 overflow-hidden">
              <Image src="/siet_logo.png" alt="SIET Logo" fill sizes="28px" priority className="object-contain" />
            </div>
            <span className="font-serif text-xl tracking-tight text-black dark:text-white">
              SIET<span className="text-primary-green"> AI_LAB</span>
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
                  className={`text-[13px] font-medium tracking-wide transition-colors duration-300 ${isActive ? "text-black dark:text-white" : "text-[#6F6F6F] hover:text-black dark:text-gray-400 dark:hover:text-white"}`}
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
                {/* QR Scanner */}
                {showQRScan && (
                  <button
                    onClick={() => setScannerOpen(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-full bg-primary-green/10 text-primary-green hover:bg-primary-green/20 transition-colors cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" />
                    Scan QR
                  </button>
                )}

                {/* Notification Bell */}
                <div ref={bellRef} className="relative">
                  <button
                    onClick={() => setBellOpen(!bellOpen)}
                    className="relative p-2 rounded-full text-[#6F6F6F] hover:text-black hover:bg-black/5 transition-colors cursor-pointer dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
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
                            <button onClick={markAllNotificationsRead} className="text-xs text-primary-green font-semibold hover:underline cursor-pointer">
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

                <Link
                  href={rolePortalHref}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full text-[#6F6F6F] hover:text-black hover:bg-black/5 transition-colors dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10"
                >
                  {session.role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  {rolePortalLabel}
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-[13px] font-medium text-[#6F6F6F] hover:text-black transition-colors duration-300 px-1 dark:text-gray-400 dark:hover:text-white">Login</Link>
                <Link href="/register" className="inline-flex items-center text-[13px] font-medium px-5 py-2 rounded-full bg-black text-white transition-all duration-300 hover:bg-[#222] hover:-translate-y-0.5 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200">
                  Register Team
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-700 hover:bg-card-bg hover:text-primary-dark rounded-xl transition-colors cursor-pointer dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
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
                    {showQRScan && (
                      <button onClick={() => { setScannerOpen(true); setMobileMenuOpen(false); }}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm border border-emerald-200 dark:border-emerald-800"
                      ><QrCode className="h-4 w-4" /> Scan QR</button>
                    )}
                    <Link href={rolePortalHref} onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card-bg dark:bg-gray-800 text-primary-dark dark:text-gray-100 font-bold text-sm border border-input-border/30 dark:border-gray-700"
                    >
                      {session.role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      {rolePortalLabel}
                    </Link>
                    <button onClick={handleLogout}
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
                    >Register Team</Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* QR Scanner Modal */}
      <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onSelectTeam={handleQRSelect} />

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
