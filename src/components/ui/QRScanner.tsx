"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Camera, SwitchCamera, QrCode, AlertCircle, Search, Users, Gavel, ClipboardCheck, ShieldCheck, ChevronRight, VideoOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Team } from "@/types";
import { HACK_TRACKS } from "@/lib/mockData";
import { Dialog } from "./dialog";

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onSelectTeam: (team: Team) => void;
}

export function QRScanner({ open, onClose, onSelectTeam }: QRScannerProps) {
  const { teams, session } = useAppState();
  const { toast } = useToast();
  
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied" | "insecure">("prompt");
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [showFallback, setShowFallback] = useState(false);
  const [search, setSearch] = useState("");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check secure context on mount
  useEffect(() => {
    if (open) {
      if (typeof window !== "undefined") {
        if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
          setPermissionStatus("insecure");
        }
      }
    }
  }, [open]);

  const handleScanResult = useCallback((decodedText: string) => {
    // 1. Try to parse as JSON (Participant personal QR code)
    try {
      const data = JSON.parse(decodedText);
      if (data.type === "participant" && data.email) {
        for (const t of teams) {
          const member = t.members.find(m => m.email === data.email);
          if (member) {
            onSelectTeam(t);
            onClose();
            toast(`Scanned participant: ${member.name}`, "success");
            return;
          }
        }
        toast(`Scanned participant: ${data.name || data.email} (No active team)`, "info");
        onClose();
        return;
      }
    } catch {
      // Not JSON, continue to string checks
    }

    // 2. Check if it matches a Team QR token
    const team = teams.find(t => t.qrToken === decodedText);
    if (team) {
      onSelectTeam(team);
      onClose();
      toast(`Scanned team: ${team.name}`, "success");
      return;
    }

    // 3. Fallback: Check if it matches an email string directly
    for (const t of teams) {
      const member = t.members.find(m => m.email === decodedText);
      if (member) {
        onSelectTeam(t);
        onClose();
        toast(`Scanned participant: ${member.name}`, "success");
        return;
      }
    }

    toast("QR code not recognized. Please try again.", "error");
  }, [teams, onSelectTeam, onClose, toast]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || permissionStatus !== "granted") return;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScanResult(decodedText);
          scanner.stop().catch(() => {});
        },
        () => {}
      );

      setError(null);
    } catch (err: unknown) {
      console.error("Scanner error:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("Permission") || errMsg.includes("NotAllowedError")) {
        setPermissionStatus("denied");
      } else if (errMsg.includes("NotFoundError") || errMsg.includes("Requested device not found")) {
        setError("No camera found. Please connect a camera and try again.");
      } else {
        setError("Failed to start camera. Please try again.");
      }
    }
  }, [facingMode, handleScanResult, permissionStatus]);

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus("insecure");
      return;
    }

    try {
      // Explicitly ask for permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Stop the stream immediately, we just wanted permission
      stream.getTracks().forEach(track => track.stop());
      setPermissionStatus("granted");
    } catch (err) {
      console.error("Permission request failed", err);
      setPermissionStatus("denied");
    }
  };

  useEffect(() => {
    if (open && !showFallback && permissionStatus === "granted") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open, startScanner, stopScanner, showFallback, permissionStatus]);

  const toggleCamera = useCallback(async () => {
    await stopScanner();
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  }, [stopScanner]);

  // Strict role check for scanner access (placed AFTER all hooks)
  if (session.isLoggedIn && !["admin", "organizer", "judge", "volunteer"].includes(session.role || "")) {
    return (
      <Dialog open={open} onClose={onClose} ariaLabel="Unauthorized">
        <div className="p-8 text-center flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6 text-sm">You do not have the required permissions to use the QR scanner.</p>
          <button onClick={onClose} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Close</button>
        </div>
      </Dialog>
    );
  }

  const filtered = teams.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.qrToken || "").toLowerCase().includes(search.toLowerCase()) ||
    t.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  );

  const roleLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    judge: { label: "Open Team Evaluation", icon: <Gavel className="h-4 w-4" />, color: "text-blue-600 bg-blue-50 border-blue-200" },
    organizer: { label: "Open Team Management", icon: <ClipboardCheck className="h-4 w-4" />, color: "text-amber-600 bg-amber-50 border-amber-200" },
    admin: { label: "Open Full Team Profile", icon: <ShieldCheck className="h-4 w-4" />, color: "text-purple-600 bg-purple-50 border-purple-200" },
    mentor: { label: "Open Team Workspace", icon: <Users className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  };

  const roleInfo = roleLabels[session.role || ""] || roleLabels["organizer"];

  const handleFallbackSelect = (team: Team) => {
    onSelectTeam(team);
    onClose();
    setSearch("");
  };

  return (
    <Dialog open={open} onClose={onClose} ariaLabel="Scan Team QR">
      <div className="flex flex-col max-h-[85vh]">
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
          <button onClick={onClose} aria-label="Close QR scanner" className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer">
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

        {/* Camera Scanner or States */}
        {!showFallback && (
          <div className="relative aspect-square bg-gray-900 overflow-hidden mx-5 rounded-xl flex items-center justify-center">
            
            {permissionStatus === "granted" && (
              <>
                <div id="qr-reader" ref={containerRef} className="w-full h-full" />
                {/* Scanner overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-[20%] border-2 border-primary-green/50 rounded-xl" />
                  <div className="absolute inset-[20%]">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary-green rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary-green rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary-green rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary-green rounded-br-lg" />
                  </div>
                </div>
              </>
            )}

            {permissionStatus === "insecure" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center z-10">
                <VideoOff className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Insecure Connection</h3>
                <p className="text-gray-400 text-sm mb-6">Camera access requires a secure (HTTPS) connection or localhost. Your browser has blocked the camera.</p>
                <button onClick={() => setShowFallback(true)} className="px-5 py-2.5 bg-primary-green text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                  Search Instead
                </button>
              </div>
            )}

            {permissionStatus === "denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center z-10">
                <VideoOff className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Camera Blocked</h3>
                <p className="text-gray-400 text-sm mb-6">Please allow camera access in your browser settings to use the scanner.</p>
                <div className="flex gap-3">
                  <button onClick={requestCameraPermission} className="px-5 py-2 bg-gray-800 text-white font-bold rounded-xl border border-gray-700 hover:bg-gray-700 transition-colors">
                    Retry
                  </button>
                  <button onClick={() => setShowFallback(true)} className="px-5 py-2 bg-primary-green text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors">
                    Search Instead
                  </button>
                </div>
              </div>
            )}

            {permissionStatus === "prompt" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center z-10">
                <Camera className="h-12 w-12 text-emerald-400 mb-4" />
                <h3 className="text-white font-bold text-lg mb-2">Enable Camera</h3>
                <p className="text-gray-400 text-sm mb-6">We need access to your camera to scan QR codes.</p>
                <button onClick={requestCameraPermission} className="px-6 py-2.5 bg-primary-green text-white font-bold rounded-xl hover:bg-emerald-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-green/20">
                  Allow Camera Access
                </button>
              </div>
            )}

            {/* Error overlay */}
            {error && permissionStatus === "granted" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-6 text-center z-20">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-white text-sm font-medium mb-4">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setError(null); startScanner(); }}
                    className="px-4 py-2 bg-primary-green text-white rounded-lg text-sm font-medium hover:bg-primary-green/90 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setShowFallback(true)}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                  >
                    Search Instead
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        {!showFallback && permissionStatus === "granted" && (
          <div className="flex items-center justify-center gap-4 p-4">
            <button
              onClick={toggleCamera}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Switch camera"
            >
              <SwitchCamera className="h-4 w-4" />
              Switch Camera
            </button>
          </div>
        )}

        {/* Fallback search mode */}
        {showFallback && (
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by team name, ID, or member..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                aria-label="Search teams"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green"
              />
            </div>
          </div>
        )}

        {/* Team list (fallback or after error) */}
        {showFallback && (
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
                  onClick={() => handleFallbackSelect(team)}
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
            <button
              onClick={() => { setShowFallback(false); setError(null); }}
              aria-label="Switch back to camera scanner"
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-green/10 text-primary-green rounded-xl text-sm font-medium hover:bg-primary-green/20 transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              Back to Camera
            </button>
          </div>
        )}

        {/* Role-specific hint */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 text-center">
            {session.role === "judge" && "Scan a team QR to open evaluation"}
            {session.role === "organizer" && "Scan a team QR for attendance or management"}
            {session.role === "admin" && "Scan any QR for full management"}
            {session.role === "volunteer" && "Scan a team QR for support or attendance"}
            {!session.role && "Point your camera at a QR code"}
          </p>
        </div>
      </div>
    </Dialog>
  );
}
