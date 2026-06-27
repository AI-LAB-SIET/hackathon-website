"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Team } from "@/types";
import { Download, Printer, QrCode, CheckCircle, Clock } from "lucide-react";
import { HACK_TRACKS } from "@/lib/mockData";

interface QRTeamPassProps {
  team: Team;
}

export function QRTeamPass({ team }: QRTeamPassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const track = HACK_TRACKS.find((t) => t.id === team.trackId);
  const leader = team.members.find((m) => m.isLeader) || team.members[0];
  const teamDisplayId = team.qrToken?.split("-").slice(0, 3).join("-") || team.id;

  useEffect(() => {
    if (team.qrToken) {
      QRCode.toDataURL(team.qrToken, {
        width: 180,
        margin: 2,
        color: { dark: "#064e3b", light: "#ffffff" },
      }).then(setQrDataUrl);
    }
  }, [team.qrToken]);

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${team.name.replace(/\s+/g, "_")}_QR.png`;
    link.click();
  };

  const handleDownloadPass = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Team Pass — ${team.name}</title>
          <style>
            body { margin: 0; font-family: 'Segoe UI', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            .pass { background: white; border: 2px solid #059669; border-radius: 16px; padding: 32px; width: 380px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); }
            .header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid #d1fae5; padding-bottom: 16px; }
            .badge { background: #059669; color: white; border-radius: 8px; padding: 4px 12px; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
            h1 { font-size: 22px; font-weight: 800; color: #064e3b; margin: 0 0 4px; }
            .id { font-size: 13px; color: #6b7280; font-family: monospace; }
            .qr-section { display: flex; align-items: center; gap: 20px; margin: 16px 0; }
            .qr-section img { border: 2px solid #d1fae5; border-radius: 8px; }
            .info p { margin: 4px 0; font-size: 13px; color: #374151; }
            .info strong { color: #064e3b; }
            .footer { margin-top: 16px; padding-top: 12px; border-top: 1px solid #d1fae5; font-size: 11px; color: #9ca3af; text-align: center; }
            .status { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; background: #d1fae5; color: #065f46; }
            @media print { body { background: white; } }
          </style>
        </head>
        <body>
          <div class="pass">
            <div class="header">
              <div>
                <div class="badge">AI HACK LAB 2026</div>
                <h1>${team.name}</h1>
                <div class="id">Team ID: ${teamDisplayId}</div>
              </div>
            </div>
            <div class="qr-section">
              <img src="${qrDataUrl}" width="120" height="120" alt="Team QR" />
              <div class="info">
                <p><strong>Leader:</strong> ${leader?.name || "—"}</p>
                <p><strong>Track:</strong> ${track?.label || "—"}</p>
                <p><strong>Members:</strong> ${team.size}</p>
                <p><strong>Status:</strong> <span class="status">${team.status}</span></p>
              </div>
            </div>
            <div class="footer">SIET AI Lab · July 18–19, 2026 · Scan QR for instant access</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      {/* Header */}
        <div className="bg-gradient-to-r from-primary-dark to-emerald-700 px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-emerald-200 tracking-widest uppercase mb-1">Team QR Pass</div>
          <div className="text-white font-extrabold text-lg leading-tight">{team.name}</div>
          <div className="text-emerald-300 text-xs mt-0.5">Scan for team check-in and management</div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
          <div className={`h-2 w-2 rounded-full ${team.status === "APPROVED" ? "bg-emerald-400 animate-pulse" : team.status === "PENDING" ? "bg-amber-400" : "bg-red-400"}`} />
          <span className="text-white text-xs font-semibold">{team.status}</span>
        </div>
      </div>

      {/* QR Body */}
      <div className="p-5 flex gap-5">
        <div className="flex flex-col items-center gap-2">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Team QR Code" className="w-32 h-32 rounded-xl border-2 border-emerald-100" />
          ) : (
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-emerald-200 flex items-center justify-center">
              <QrCode className="h-8 w-8 text-emerald-300" />
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex-1 flex flex-col gap-2 justify-center text-sm">
          <div><span className="text-gray-400 text-xs">Leader</span><div className="font-semibold text-primary-dark">{leader?.name || "—"}</div></div>
          <div><span className="text-gray-400 text-xs">Track</span><div className="font-semibold text-primary-dark">{track?.label || "—"}</div></div>
          <div><span className="text-gray-400 text-xs">Members</span><div className="font-semibold text-primary-dark">{team.size} members</div></div>
          <div className="flex items-center gap-1.5 mt-1">
            {team.attendance?.checkedIn ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle className="h-3 w-3" /> Checked In {team.attendance.checkInTime}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3" /> Not Checked In
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex gap-3">
        <button
          onClick={handleDownloadQR}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Download QR
        </button>
        <button
          onClick={handleDownloadPass}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-dark text-white text-sm font-semibold hover:bg-emerald-900 transition-colors cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Team Pass
        </button>
      </div>
    </div>
  );
}
