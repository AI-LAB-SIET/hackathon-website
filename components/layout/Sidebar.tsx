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
  Inbox,
  Calendar,
  BookOpen,
  Megaphone,
  MessageSquare,
  HelpCircle,
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
          { id: "deliverables", name: "Deliverables", icon: <Inbox className="h-5 w-5" /> },
          { id: "timeline", name: "Timeline", icon: <Calendar className="h-5 w-5" /> },
          { id: "resources", name: "Resources", icon: <BookOpen className="h-5 w-5" /> },
          { id: "announcements", name: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
          { id: "messages", name: "Messages", icon: <MessageSquare className="h-5 w-5" /> },
          { id: "support", name: "Support", icon: <HelpCircle className="h-5 w-5" /> },
          { id: "settings", name: "Settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "judge":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "assigned", name: "Assigned Projects", icon: <FolderCode className="h-5 w-5" /> },
          { id: "evaluation", name: "Evaluation", icon: <Gavel className="h-5 w-5" /> },
          { id: "leaderboard", name: "Leaderboard", icon: <Activity className="h-5 w-5" /> },
          { id: "messages", name: "Messages", icon: <MessageSquare className="h-5 w-5" /> },
          { id: "settings", name: "Settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "mentor":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "teams", name: "Assigned Teams", icon: <Users className="h-5 w-5" /> },
          { id: "schedules", name: "Schedules", icon: <Calendar className="h-5 w-5" /> },
          { id: "feedback", name: "Feedback Logs", icon: <MessageSquare className="h-5 w-5" /> },
          { id: "settings", name: "Settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "organizer":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "approvals", name: "Approvals Queue", icon: <UserCheck className="h-5 w-5" /> },
          { id: "teams", name: "Teams Directory", icon: <Users className="h-5 w-5" /> },
          { id: "projects", name: "Projects Directory", icon: <FolderCode className="h-5 w-5" /> },
          { id: "announcements", name: "Announcements", icon: <Megaphone className="h-5 w-5" /> },
          { id: "resources", name: "Resources", icon: <BookOpen className="h-5 w-5" /> },
          { id: "stats", name: "Analytics & Stats", icon: <Activity className="h-5 w-5" /> },
          { id: "settings", name: "Settings", icon: <Settings className="h-5 w-5" /> },
        ];
      case "admin":
        return [
          { id: "dashboard", name: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
          { id: "users", name: "Users & Roles", icon: <Users className="h-5 w-5" /> },
          { id: "keys", name: "API Keys Panel", icon: <Key className="h-5 w-5" /> },
          { id: "storage", name: "Storage Monitor", icon: <Database className="h-5 w-5" /> },
          { id: "audit", name: "System Audit Logs", icon: <Activity className="h-5 w-5" /> },
          { id: "settings", name: "Settings", icon: <Settings className="h-5 w-5" /> },
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
      className="hidden md:flex flex-col h-screen sticky top-0 bg-white border-r border-input-border/30 shadow-[4px_0_20px_rgba(0,100,0,0.015)] z-20 shrink-0"
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
                      : "text-gray-600 hover:bg-card-bg hover:text-primary-dark"
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
            className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-gray-600 hover:bg-card-bg hover:text-primary-dark"
          >
            <Home className="h-5 w-5" />
            {!collapsed && <span>Go to Home</span>}
          </Link>
        )}
      </nav>

      {/* User Info / Logout */}
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2">
        {!collapsed && session.isLoggedIn && (
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-card-bg/30 border border-input-border/10">
            <Avatar name={session.email || "User"} size="sm" />
            <div className="overflow-hidden">
              <p className="text-[10px] font-bold text-primary-dark truncate capitalize">
                {session.role} Portal
              </p>
              <p className="text-[9px] text-gray-500 truncate font-medium">{session.email}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer transition-colors group relative w-full"
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
