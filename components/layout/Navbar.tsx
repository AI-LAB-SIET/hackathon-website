"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "./StateProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Shield } from "lucide-react";
import { useToast } from "../ui/toast";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAppState();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about-us" },
    { name: "Timeline", href: "/timeline" },
    { name: "Rules", href: "/rules" },
    { name: "Contact", href: "/contact" },
  ];

  const handleLogout = () => {
    logout();
    toast("Successfully logged out.", "info");
    router.push("/");
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glassmorphism">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none group">
            <div className="relative h-9 w-9 overflow-hidden group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/siet_logo.png"
                alt="SIET Logo"
                fill
                sizes="36px"
                priority
                className="object-contain"
              />
            </div>
            <span className="font-extrabold tracking-tight text-primary-dark text-base sm:text-lg">
              SIET<span className="text-accent-green"> AI_LAB</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-sm font-semibold text-gray-700 hover:text-primary-green transition-colors py-2"
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavBorder"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-green rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {session.isLoggedIn ? (
              <>
                <Link
                  href={session.role === "admin" ? "/admin" : "/dashboard"}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-card-bg border border-input-border/30 text-primary-dark hover:bg-emerald-100/50 transition-colors"
                >
                  {session.role === "admin" ? (
                    <Shield className="h-4 w-4 text-primary-green" />
                  ) : (
                    <User className="h-4 w-4 text-primary-green" />
                  )}
                  {session.role === "admin" ? "Admin Panel" : "My Dashboard"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-transparent border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-primary-dark hover:text-primary-green transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary-green text-white shadow-md hover:bg-primary-dark transition-all duration-200"
                >
                  Register Team
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburguer */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-700 hover:bg-card-bg hover:text-primary-dark rounded-xl transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-30 bg-black md:hidden"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-35 w-3/4 max-w-sm bg-white p-6 shadow-2xl border-l border-input-border/20 md:hidden flex flex-col pt-20"
            >
              <div className="flex flex-col gap-6 flex-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`text-base font-bold py-2 border-b border-gray-100 ${
                      pathname === link.href ? "text-primary-green" : "text-gray-800"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="flex flex-col gap-3 mt-auto">
                {session.isLoggedIn ? (
                  <>
                    <Link
                      href={session.role === "admin" ? "/admin" : "/dashboard"}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card-bg text-primary-dark font-bold text-sm border border-input-border/30"
                    >
                      {session.role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      {session.role === "admin" ? "Admin Console" : "My Dashboard"}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 text-red-600 font-bold text-sm border border-red-150 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full py-3 rounded-xl border border-input-border/40 text-primary-dark font-bold text-sm hover:bg-card-bg transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center w-full py-3 rounded-xl bg-primary-green text-white font-bold text-sm shadow-md hover:bg-primary-dark transition-all"
                    >
                      Register Team
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
