"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAppState } from "./StateProvider";
import { useToast } from "../ui/toast";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderCode,
  Calendar,
  BookOpen,
  Megaphone,
  MessageSquare,
  Settings,
  Gavel,
  UserCheck,
  Activity,
  Key,
  Database,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  User,
  ListChecks,
  Shield,
  QrCode,
} from "lucide-react";
import { Avatar } from "../ui/avatar";

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const { session, logout } = useAppState();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast("Logged out successfully.", "info");
    router.push("/");
  };

  // Get role-specific tabs
  const getTabs = () => {
    switch (session.role) {
      case "participant":
        return [
          { id: "home", name: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "team", name: "My Team", icon: <Users className="h-5 w-5" /> },
          { id: "project", name: "Project", icon: <FolderCode className="h-5 w-5" /> },
          { id: "resources", name: "Resources", icon: <BookOpen className="h-5 w-5" /> },
          { id: "support", name: "Support", icon: <LifeBuoy className="h-5 w-5" /> },
          { id: "profile", name: "Profile", icon: <User className="h-5 w-5" /> },
        ];
      case "judge":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "queue", name: "Review Queue", icon: <ListChecks className="h-5 w-5" /> },
          { id: "profile", name: "Profile", icon: <User className="h-5 w-5" /> },
        ];
      case "volunteer":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "tickets", name: "Tickets", icon: <LifeBuoy className="h-5 w-5" /> },
          { id: "profile", name: "Profile", icon: <User className="h-5 w-5" /> },
        ];
      case "organizer":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "teams", name: "Teams Directory", icon: <Users className="h-5 w-5" /> },
          { id: "approval", name: "Approval Queue", icon: <UserCheck className="h-5 w-5" /> },
          { id: "volunteers", name: "Volunteers", icon: <UserCheck className="h-5 w-5" /> },
          { id: "tickets", name: "Tickets", icon: <LifeBuoy className="h-5 w-5" /> },
          { id: "profile", name: "Profile", icon: <User className="h-5 w-5" /> },
        ];
      case "admin":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "members", name: "Members & Roles", icon: <Users className="h-5 w-5" /> },
          { id: "participants", name: "Participants", icon: <UserCheck className="h-5 w-5" /> },
          { id: "announcements", name: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
          { id: "problems", name: "Problems", icon: <BookOpen className="h-5 w-5" /> },
          { id: "scanner", name: "QR Scanner", icon: <QrCode className="h-5 w-5" /> },
          { id: "teams", name: "Approved Teams", icon: <Shield className="h-5 w-5" /> },
          { id: "profile", name: "Profile", icon: <User className="h-5 w-5" /> },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  // If there's no session role, just display general links
  const displayTabs = tabs.length > 0;

  return (
    <motion.aside
      animate={{ width: collapsed ? 80 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-input-border/30 shadow-[4px_0_20px_rgba(0,100,0,0.015)] z-20 shrink-0 dark:bg-gray-900 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100 bg-card-bg/50 dark:border-gray-700 dark:bg-gray-800/50">
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
            <span className="font-extrabold tracking-tight text-primary-dark text-sm dark:text-gray-100">
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
          className="p-1 rounded-lg text-gray-500 hover:bg-emerald-100 hover:text-primary-dark cursor-pointer transition-colors dark:text-gray-400 dark:hover:bg-emerald-900/30 dark:hover:text-white"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-180px)] scrollbar-thin">
        {displayTabs ? (
          tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition-all duration-150 group relative text-left w-full cursor-pointer
                  ${
                    isActive
                      ? "bg-primary-green text-white shadow-md shadow-primary-green/10"
                      : "text-gray-600 hover:bg-card-bg hover:text-primary-dark dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                  }
                `}
              >
                <div className="shrink-0">{tab.icon}</div>
                {!collapsed && <span>{tab.name}</span>}
                {collapsed && (
                  <div className="absolute left-16 bg-primary-dark text-white text-[10px] px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
                    {tab.name}
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-card-bg hover:text-primary-dark dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Home className="h-5 w-5" />
            {!collapsed && <span>Go to Home</span>}
          </Link>
        )}
      </nav>

      {/* User Info / Logout */}
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2 dark:border-gray-700">
        {!collapsed && session.isLoggedIn && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card-bg/30 border border-input-border/10 dark:bg-gray-800/30 dark:border-gray-700">
            <Avatar name={session.email || "User"} size="sm" />
            <div className="overflow-hidden">
              <p className="text-[9px] text-gray-500 truncate font-medium dark:text-gray-400">{session.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors group relative w-full dark:hover:bg-red-900/20"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
          {collapsed && (
            <div className="absolute left-16 bg-red-600 text-white text-[10px] px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-md">
              Logout
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
