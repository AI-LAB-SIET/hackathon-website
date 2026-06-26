"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Search, Users, Gavel, ClipboardCheck, ShieldCheck, ChevronRight } from "lucide-react";
import { useAppState } from "@/components/layout/StateProvider";
import { Team } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onSelectTeam: (team: Team) => void;
}

export function QRScanner({ open, onClose, onSelectTeam }: QRScannerProps) {
  const { teams, session } = useAppState();
  const [search, setSearch] = useState("");

  const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    judge: { label: "Open Team Evaluation", icon: <Gavel className="h-4 w-4" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
    organizer: { label: "Open Team Management", icon: <ClipboardCheck className="h-4 w-4" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
    admin: { label: "Open Full Team Profile", icon: <ShieldCheck className="h-4 w-4" />, color: "text-purple-600 bg-purple-50 border-purple-200" },
    mentor: { label: "Open Team Workspace", icon: <Users className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  };

  const roleInfo = roleLabels[session.role || ""] || roleLabels["organizer"];

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.qrToken || "").toLowerCase().includes(search.toLowerCase()) ||
    t.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSelect = (team: Team) => {
    onSelectTeam(team);
    onClose();
    setSearch("");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-dark to-emerald-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <QrCode className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-sm">Scan Team QR</div>
                  <div className="text-emerald-200 text-xs">Select a team to proceed</div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Role badge */}
            <div className="px-5 pt-4 pb-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${roleInfo.color}`}>
                {roleInfo.icon}
                {roleInfo.label}
              </div>
            </div>

            {/* Search */}
            <div className="px-5 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by team name, ID, or member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green"
                />
              </div>
            </div>

            {/* Team List */}
            <div className="max-h-72 overflow-y-auto px-5 pb-5 flex flex-col gap-2">
              {filtered.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-8">No teams match your search.</div>
              )}
              {filtered.map((team) => {
                const track = HACK_TRACKS.find((tr) => tr.id === team.trackId);
                const leader = team.members.find((m) => m.isLeader) || team.members[0];
                const displayId = team.qrToken?.split("-").slice(0, 3).join("-") || team.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => handleSelect(team)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary-green/30 hover:bg-emerald-50/50 transition-all group text-left cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {team.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-primary-dark text-sm truncate">{team.name}</div>
                      <div className="text-gray-400 text-xs font-mono">{displayId}</div>
                      <div className="text-gray-500 text-xs">{leader?.name} · {track?.label || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${team.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : team.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {team.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary-green transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
