"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Key,
  Database,
  Settings,
  Shield,
  Server,
  Terminal,
  RotateCw,
  Plus
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { session } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Local state
  const [keys, setKeys] = useState([
    { name: "Anthropic Claude API Key", service: "Claude 3.5 Sonnet", token: "sk-ant-sid2026x99abc...xyz", status: "Active" },
    { name: "Supabase DB Key", service: "PostgreSQL Database", token: "sb-anon-pub-siet2026...123", status: "Active" },
    { name: "GitHub Integration Token", service: "GitHub API v3", token: "gh-oauth-siet-org...987", status: "Active" }
  ]);
  const [auditLogs, setAuditLogs] = useState([
    { id: 1, time: "Just now", user: "organizer@college.edu", action: "Approved registration for team 'Abhishek's Team'", type: "info" },
    { id: 2, time: "10 mins ago", user: "judge@college.edu", action: "Graded 'Abhishek's Team' (Avg 8.3/10)", type: "success" },
    { id: 3, time: "30 mins ago", user: "abhishek@college.edu", action: "Updated project repository URL", type: "warning" },
    { id: 4, time: "1 hour ago", user: "mentor@college.edu", action: "Scheduled office hour session on July 05", type: "info" }
  ]);

  const [users] = useState([
    { name: "System Admin", email: "admin@college.edu", role: "admin" },
    { name: "Event Organizer", email: "organizer@college.edu", role: "organizer" },
    { name: "AI Mentor", email: "mentor@college.edu", role: "mentor" },
    { name: "Evaluation Judge", email: "judge@college.edu", role: "judge" },
    { name: "Abhishek Sharma", email: "abhishek@college.edu", role: "participant" },
    { name: "Siddharth", email: "sid@college.edu", role: "participant" }
  ]);

  const [newKey, setNewKey] = useState({ name: "", service: "", token: "" });

  useEffect(() => {
    setMounted(true);
    if (mounted && (!session.isLoggedIn || session.role !== "admin")) {
      router.push("/login");
    }
  }, [session, router, mounted]);

  if (!mounted || !session.isLoggedIn || session.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white text-sm font-semibold text-gray-500">
        Loading admin console...
      </div>
    );
  }

  const handleRotateKey = (name: string) => {
    toast(`Rotated token for: ${name}`, "success");
    setAuditLogs([
      { id: Date.now(), time: "Just now", user: session.email || "Admin", action: `Rotated credentials key: ${name}`, type: "warning" },
      ...auditLogs
    ]);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.name || !newKey.service || !newKey.token) {
      toast("Please fill in key name, service, and token value.", "error");
      return;
    }
    setKeys([...keys, { ...newKey, status: "Active" }]);
    toast(`Registered new API key: ${newKey.name}`, "success");
    setNewKey({ name: "", service: "", token: "" });
    setAuditLogs([
      { id: Date.now(), time: "Just now", user: session.email || "Admin", action: `Registered key configuration: ${newKey.name}`, type: "success" },
      ...auditLogs
    ]);
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Mobile Nav */}
        <div className="md:hidden flex overflow-x-auto pb-3 mb-6 border-b border-gray-150 gap-2 scrollbar-none shrink-0">
          {[
            { id: "dashboard", label: "Dashboard" },
            { id: "users", label: "Users" },
            { id: "keys", label: "API Keys" },
            { id: "storage", label: "Storage" },
            { id: "audit", label: "Audit Logs" },
            { id: "settings", label: "Settings" }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === item.id 
                  ? "bg-primary-green text-white" 
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Workspace Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight capitalize">
              {activeTab === "dashboard" ? "Admin Console" : activeTab.replace("-", " ")}
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Logged in as: <strong>{session.email}</strong> | Role: {session.role?.toUpperCase()}
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* ==================== DASHBOARD TAB ==================== */}
            {activeTab === "dashboard" && (
              <div className="flex flex-col gap-6">
                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                  {[
                    { label: "Active Roles", val: 5, icon: <Shield className="h-5 w-5" /> },
                    { label: "Total Users", val: users.length, icon: <Users className="h-5 w-5 text-emerald-600" /> },
                    { label: "Credentials Keyrings", val: keys.length, icon: <Key className="h-5 w-5 text-amber-500" /> },
                    { label: "Database Health", val: "Optimal (12ms)", icon: <Server className="h-5 w-5 text-indigo-650" /> }
                  ].map((stat, idx) => (
                    <div key={idx} className="p-5 rounded-2xl border border-input-border/30 bg-white shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-card-bg text-primary-green flex items-center justify-center border border-input-border/10 shrink-0">
                        {stat.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
                        <span className="text-sm font-extrabold text-primary-dark">{stat.val}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* System Audit logs short view */}
                <div className="rounded-3xl border border-input-border/30 bg-white p-5 shadow-sm flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                    <Terminal className="h-4.5 w-4.5 text-primary-green" /> Recent Audit Activities
                  </h3>
                  
                  <div className="flex flex-col gap-3.5">
                    {auditLogs.slice(0, 3).map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-3 rounded-2xl border border-gray-100 bg-white text-xs">
                        <div className="flex gap-3 items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            log.type === "warning" ? "bg-amber-500" : log.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                          }`} />
                          <div>
                            <p className="font-bold text-gray-800">{log.action}</p>
                            <p className="text-[9px] text-gray-400 font-semibold">{log.user}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold">{log.time}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveTab("audit")}
                      className="text-xs font-bold text-primary-green hover:underline cursor-pointer border-0 bg-transparent text-center"
                    >
                      View all system audit logs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== USERS TAB ==================== */}
            {activeTab === "users" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-5">
                <h3 className="text-base font-bold text-primary-dark border-b border-gray-150 pb-3">Users & Accounts Registry</h3>
                
                <div className="flex flex-col gap-3.5">
                  {users.map((user, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="font-extrabold text-primary-dark">{user.name}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{user.email}</p>
                        </div>
                      </div>
                      
                      <Badge variant={user.role === "admin" ? "danger" : user.role === "organizer" ? "warning" : "primary"}>
                        {user.role.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== API KEYS TAB ==================== */}
            {activeTab === "keys" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Keys list */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                    <h3 className="text-base font-bold text-primary-dark border-b border-gray-150 pb-2">Active Service Credentials</h3>
                    
                    <div className="flex flex-col gap-4">
                      {keys.map((key, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-white flex flex-col gap-2 text-xs">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-extrabold text-primary-dark">{key.name}</h4>
                              <p className="text-[10px] text-gray-400 font-semibold">{key.service}</p>
                            </div>
                            <Badge variant="success">{key.status}</Badge>
                          </div>
                          <div className="flex justify-between items-center bg-card-bg/30 border border-input-border/10 p-2.5 rounded-xl font-mono text-[10px] text-gray-600 mt-1 select-all overflow-x-auto">
                            <span>{key.token}</span>
                            <button
                              onClick={() => handleRotateKey(key.name)}
                              className="p-1 rounded hover:bg-gray-250/20 text-primary-green shrink-0 cursor-pointer border-0 bg-transparent"
                              title="Rotate Key"
                            >
                              <RotateCw className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Add Key Form */}
                <div className="flex flex-col gap-6">
                  <div className="rounded-3xl border border-input-border/30 bg-white p-5 shadow-sm flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                      <Plus className="h-4.5 w-4.5 text-primary-green" /> Register API Key
                    </h3>
                    
                    <form onSubmit={handleCreateKey} className="flex flex-col gap-4">
                      <Input
                        label="Key Name"
                        placeholder="e.g. Supabase Secret Key"
                        value={newKey.name}
                        onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                      />
                      <Input
                        label="Service Provider"
                        placeholder="e.g. Supabase Admin"
                        value={newKey.service}
                        onChange={(e) => setNewKey({ ...newKey, service: e.target.value })}
                      />
                      <Input
                        label="Token Value"
                        placeholder="sk-..."
                        value={newKey.token}
                        onChange={(e) => setNewKey({ ...newKey, token: e.target.value })}
                      />
                      <Button type="submit" className="text-xs mt-2">
                        Save Credential
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== STORAGE TAB ==================== */}
            {activeTab === "storage" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-8 shadow-sm flex flex-col gap-6">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-3">
                  <Database className="h-5 w-5 text-primary-green" /> Storage & Database Monitor
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-semibold">
                  <div className="p-4 bg-card-bg/25 border border-input-border/10 rounded-2xl flex flex-col gap-2">
                    <span className="text-gray-400 uppercase text-[9px] tracking-widest font-extrabold">Postgres Tables Size</span>
                    <span className="text-lg font-extrabold text-primary-dark">2.4 MB / 500 MB</span>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-green h-full" style={{ width: "2%" }} />
                    </div>
                  </div>

                  <div className="p-4 bg-card-bg/25 border border-input-border/10 rounded-2xl flex flex-col gap-2">
                    <span className="text-gray-400 uppercase text-[9px] tracking-widest font-extrabold">Static Roster Assets</span>
                    <span className="text-lg font-extrabold text-primary-dark">142.1 MB / 5 GB</span>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-green h-full" style={{ width: "4%" }} />
                    </div>
                  </div>

                  <div className="p-4 bg-card-bg/25 border border-input-border/10 rounded-2xl flex flex-col gap-2">
                    <span className="text-gray-400 uppercase text-[9px] tracking-widest font-extrabold">Serverless Logs limits</span>
                    <span className="text-lg font-extrabold text-primary-dark">14% utilised</span>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary-green h-full" style={{ width: "14%" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== AUDIT LOGS TAB ==================== */}
            {activeTab === "audit" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-4">
                <h3 className="text-base font-bold text-primary-dark border-b border-gray-150 pb-3">Complete System Audit Logs</h3>
                
                <div className="flex flex-col gap-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-2xl border border-gray-100 bg-white flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`h-2 w-2 rounded-full ${
                          log.type === "warning" ? "bg-amber-500" : log.type === "success" ? "bg-emerald-500" : "bg-blue-500"
                        }`} />
                        <div>
                          <p className="font-bold text-gray-800">{log.action}</p>
                          <p className="text-[9px] text-gray-400 font-semibold">{log.user}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== SETTINGS TAB ==================== */}
            {activeTab === "settings" && (
              <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col gap-6 max-w-xl">
                <h3 className="text-base font-bold text-primary-dark flex items-center gap-2 border-b border-gray-150 pb-2">
                  <Settings className="h-5 w-5 text-primary-green" /> Portal Preferences
                </h3>
                <div className="flex flex-col gap-4 text-xs font-semibold">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-800">System Logs Rotate</p>
                      <p className="text-gray-400 font-normal">Rotate server logs every 7 days automatically.</p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded border-input-border text-primary-green focus:ring-primary-green h-4.5 w-4.5 cursor-pointer" />
                  </div>
                  <Button
                    onClick={() => {
                      toast("Preferences saved.", "success");
                    }}
                    className="mt-2 text-xs"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </PageWrapper>
  );
}
