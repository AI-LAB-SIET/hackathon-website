"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "./StateProvider";
import { useToast } from "../ui/toast";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Bell,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Avatar } from "../ui/avatar";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAppState();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast("Logged out successfully.", "info");
    router.push("/");
  };

  const getLinks = () => {
    if (session.role === "admin") {
      return [
        { name: "Admin Dashboard", href: "/admin", icon: <Shield className="h-5 w-5" /> },
        { name: "Go to Home", href: "/", icon: <Home className="h-5 w-5" /> },
      ];
    } else {
      return [
        { name: "My Dashboard", href: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
        { name: "Team Management", href: "/dashboard/team", icon: <Users className="h-5 w-5" /> },
        { name: "Go to Home", href: "/", icon: <Home className="h-5 w-5" /> },
      ];
    }
  };

  const links = getLinks();

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-input-border/30 shadow-[4px_0_20px_rgba(0,100,0,0.015)] z-20"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 bg-card-bg/50">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="relative h-8 w-8 overflow-hidden">
              <Image
                src="/siet_logo.png"
                alt="SIET Logo"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
            <span className="font-extrabold tracking-tight text-primary-dark text-sm">
              SIET<span className="text-accent-green"> AI_LAB</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto relative h-8 w-8 overflow-hidden">
            <Image
              src="/siet_logo.png"
              alt="SIET Logo"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-gray-500 hover:bg-emerald-100 hover:text-primary-dark cursor-pointer transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 flex flex-col gap-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative
                ${
                  isActive
                    ? "bg-primary-green text-white shadow-md shadow-primary-green/10"
                    : "text-gray-600 hover:bg-card-bg hover:text-primary-dark"
                }
              `}
            >
              <div className="shrink-0">{link.icon}</div>
              {!collapsed && <span>{link.name}</span>}
              {collapsed && (
                <div className="absolute left-16 bg-primary-dark text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                  {link.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info / Logout */}
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
        {!collapsed && session.isLoggedIn && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-card-bg/30 border border-input-border/10 mb-2">
            <Avatar name={session.email || "User"} size="sm" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-primary-dark truncate">
                {session.role === "admin" ? "System Admin" : "Hackathon Team"}
              </p>
              <p className="text-[10px] text-gray-500 truncate">{session.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors group relative w-full"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
          {collapsed && (
            <div className="absolute left-16 bg-red-600 text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
