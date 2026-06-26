"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Clock, AlertTriangle, Plus, Ticket } from "lucide-react";
import { useAppState } from "@/components/layout/StateProvider";
import { Team, SupportTicket } from "@/types";

interface AttendancePanelProps {
  team: Team;
  open: boolean;
  onClose: () => void;
  scannerName?: string;
}

const TICKET_CATEGORIES: SupportTicket["category"][] = [
  "Internet", "Power", "Mentor Needed", "Hardware", "Food", "Venue", "Other"
];
const TICKET_PRIORITIES: SupportTicket["priority"][] = ["Low", "Medium", "High", "Critical"];

export function AttendancePanel({ team, open, onClose, scannerName = "Organizer" }: AttendancePanelProps) {
  const { checkInTeam, raiseTicket } = useAppState();
  const [view, setView] = useState<"main" | "ticket">("main");
  const [ticketData, setTicketData] = useState({
    category: "Internet" as SupportTicket["category"],
    priority: "Medium" as SupportTicket["priority"],
    description: "",
  });
  const [checkedIn, setCheckedIn] = useState(team.attendance?.checkedIn || false);
  const [checkInTime, setCheckInTime] = useState(team.attendance?.checkInTime || "");

  const handleCheckIn = () => {
    if (checkedIn) return;
    checkInTeam(team.id, scannerName);
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setCheckedIn(true);
    setCheckInTime(t);
  };

  const handleRaiseTicket = () => {
    if (!ticketData.description.trim()) return;
    raiseTicket({
      teamId: team.id,
      category: ticketData.category,
      priority: ticketData.priority,
      description: ticketData.description,
      raisedBy: scannerName,
    });
    setTicketData({ category: "Internet", priority: "Medium", description: "" });
    setView("main");
  };

  const leader = team.members.find((m) => m.isLeader) || team.members[0];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-amber-100 text-xs font-semibold uppercase tracking-wide mb-0.5">Team Management</div>
                <div className="text-white font-bold">{team.name}</div>
                <div className="text-amber-200 text-xs">{leader?.name} · {team.size} members</div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5">
              {view === "main" && (
                <div className="flex flex-col gap-4">
                  {/* Attendance */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Attendance</div>
                    {checkedIn ? (
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-8 w-8 text-emerald-500" />
                        <div>
                          <div className="font-bold text-emerald-700 text-sm">Checked In</div>
                          <div className="text-gray-400 text-xs">{checkInTime} · by {team.attendance?.checkInBy || scannerName}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <Clock className="h-8 w-8 text-amber-400" />
                          <div>
                            <div className="font-bold text-amber-700 text-sm">Not Checked In</div>
                            <div className="text-gray-400 text-xs">Team has not arrived yet</div>
                          </div>
                        </div>
                        <button
                          onClick={handleCheckIn}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="h-4 w-4" /> Mark Present
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Support Tickets */}
                  <div className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Support Tickets</div>
                      <span className="text-xs text-gray-400">{(team.supportTickets || []).filter(t => t.status === "Open").length} open</span>
                    </div>
                    {(team.supportTickets || []).length === 0 ? (
                      <div className="text-sm text-gray-400 text-center py-2">No tickets raised</div>
                    ) : (
                      <div className="flex flex-col gap-1.5 mb-3">
                        {(team.supportTickets || []).slice(0, 3).map((tk) => (
                          <div key={tk.id} className="flex items-center gap-2 text-xs">
                            <AlertTriangle className={`h-3.5 w-3.5 ${tk.priority === "Critical" ? "text-red-500" : tk.priority === "High" ? "text-orange-500" : "text-amber-500"}`} />
                            <span className="font-medium text-gray-700">{tk.category}</span>
                            <span className={`ml-auto px-1.5 py-0.5 rounded-full font-semibold ${tk.status === "Open" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>{tk.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setView("ticket")}
                      className="w-full py-2 rounded-xl border border-amber-200 text-amber-700 font-semibold text-sm hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> New Ticket
                    </button>
                  </div>
                </div>
              )}

              {view === "ticket" && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => setView("main")} className="text-gray-400 hover:text-gray-600 text-sm cursor-pointer">← Back</button>
                    <span className="font-bold text-primary-dark text-sm flex items-center gap-1.5"><Ticket className="h-4 w-4" /> New Support Ticket</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Category</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TICKET_CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setTicketData((p) => ({ ...p, category: cat }))}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${ticketData.category === cat ? "bg-amber-500 text-white border-amber-500" : "border-gray-200 text-gray-600 hover:border-amber-300"}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Priority</label>
                    <div className="flex gap-1.5">
                      {TICKET_PRIORITIES.map((p) => (
                        <button
                          key={p}
                          onClick={() => setTicketData((prev) => ({ ...prev, priority: p }))}
                          className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border cursor-pointer transition-colors ${ticketData.priority === p ? "bg-primary-dark text-white border-primary-dark" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1.5">Description</label>
                    <textarea
                      rows={3}
                      value={ticketData.description}
                      onChange={(e) => setTicketData((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe the issue..."
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    />
                  </div>

                  <button
                    onClick={handleRaiseTicket}
                    disabled={!ticketData.description.trim()}
                    className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    Submit Ticket
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
