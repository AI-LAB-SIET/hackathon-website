"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { useToast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Check,
  X,
  FileSpreadsheet,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { session, teams, approveTeam, rejectTeam } = useAppState();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  // Calculate stats
  const totalTeams = teams.length;
  const approvedTeams = teams.filter((t) => t.status === "APPROVED").length;
  const pendingTeams = teams.filter((t) => t.status === "PENDING").length;
  const rejectedTeams = teams.filter((t) => t.status === "REJECTED").length;

  // Filter & Search Logic
  const filteredTeams = teams.filter((team) => {
    const matchesStatus = statusFilter === "ALL" || team.status === statusFilter;
    const matchesSearch =
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      (team.projectDescription || "").toLowerCase().includes(search.toLowerCase()) ||
      team.members.some((m) => m.name.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const paginatedTeams = filteredTeams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleApprove = (id: string, name: string) => {
    approveTeam(id);
    toast(`Approved team: ${name}`, "success");
  };

  const handleReject = (id: string, name: string) => {
    rejectTeam(id);
    toast(`Rejected team: ${name}`, "warning");
  };

  const handleExportCSV = () => {
    if (teams.length === 0) {
      toast("No registrations found to export.", "warning");
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    // CSV Header
    csvContent += "Team ID,Team Name,Size,Status,Creation Date,Project Description,Leader Name,Leader Email,Leader Phone\n";

    teams.forEach((t) => {
      const leader = t.members.find((m) => m.isLeader) || t.members[0];
      const projectDescClean = (t.projectDescription || "").replace(/"/g, '""');
      const createdAtClean = new Date(t.createdAt).toLocaleDateString();

      csvContent += `${t.id},"${t.name}",${t.size},${t.status},${createdAtClean},"${projectDescClean}","${leader?.name}","${leader?.email}","${leader?.phone}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `siet_hackathon_registrations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast("Successfully generated CSV download.", "success");
  };

  return (
    <PageWrapper className="flex min-h-screen bg-gray-50/50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-primary-dark tracking-tight">
              Administrative Dashboard
            </h1>
            <p className="text-xs text-gray-500 font-semibold leading-relaxed mt-0.5">
              Review hacker applications, coordinate approvals, and download analytics.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-5 py-3 rounded-xl bg-primary-green text-white shadow-md hover:bg-primary-dark transition-all duration-200 cursor-pointer"
          >
            <Download className="h-4.5 w-4.5" /> Export to CSV
          </button>
        </div>

        {/* Total Metric Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Total Registers", val: totalTeams, color: "text-primary-green border-primary-green/20 bg-emerald-50/10", icon: <Users className="h-5 w-5" /> },
            { label: "Approved Teams", val: approvedTeams, color: "text-emerald-700 border-emerald-200 bg-emerald-50/30", icon: <CheckCircle className="h-5 w-5" /> },
            { label: "Pending Audit", val: pendingTeams, color: "text-amber-700 border-amber-200 bg-amber-50/20", icon: <Clock className="h-5 w-5" /> },
            { label: "Rejected Teams", val: rejectedTeams, color: "text-red-700 border-red-200 bg-red-50/10", icon: <AlertTriangle className="h-5 w-5" /> },
          ].map((stat, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border bg-white shadow-sm flex items-center justify-between ${stat.color}`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stat.label}</span>
                <span className="text-xl sm:text-2xl font-extrabold text-primary-dark">{stat.val}</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        {/* Table & Controls wrapper */}
        <div className="rounded-3xl border border-input-border/30 bg-white p-6 shadow-sm flex flex-col gap-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                placeholder="Search teams or projects..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input-border text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-primary-green shadow-inner"
              />
            </div>

            {/* Filter Toggle Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-center overflow-x-auto w-full sm:w-auto">
              {[
                { name: "All", filter: "ALL" },
                { name: "Pending", filter: "PENDING" },
                { name: "Approved", filter: "APPROVED" },
                { name: "Rejected", filter: "REJECTED" },
              ].map((tab) => (
                <button
                  key={tab.filter}
                  onClick={() => {
                    setStatusFilter(tab.filter);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap
                    ${
                      statusFilter === tab.filter
                        ? "bg-primary-green border-primary-green text-white shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-primary-green hover:text-primary-green"
                    }
                  `}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Table Element */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team & Idea</TableHead>
                <TableHead>Leader</TableHead>
                <TableHead>Teammates</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeams.length > 0 ? (
                paginatedTeams.map((t) => {
                  const leader = t.members.find((m) => m.isLeader) || t.members[0];
                  const createdDate = new Date(t.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-[240px]">
                        <div>
                          <p className="font-extrabold text-primary-dark text-sm sm:text-base leading-tight">{t.name}</p>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                            {t.projectDescription || "No project brief declared."}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-extrabold text-primary-dark">{leader?.name}</p>
                          <p className="text-[10px] text-gray-500">{leader?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="primary" className="font-bold">
                          {t.size} members
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 font-semibold">{createdDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === "APPROVED"
                              ? "success"
                              : t.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                          pulse={t.status === "PENDING"}
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {t.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => handleApprove(t.id, t.name)}
                                className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center border border-emerald-200 cursor-pointer transition-colors"
                                title="Approve Team"
                              >
                                <Check className="h-4.5 w-4.5" />
                              </button>
                              <button
                                onClick={() => handleReject(t.id, t.name)}
                                className="h-8 w-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center border border-red-200 cursor-pointer transition-colors"
                                title="Reject Team"
                              >
                                <X className="h-4.5 w-4.5" />
                              </button>
                            </>
                          )}
                          {t.status !== "PENDING" && (
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none pr-2">
                              Locked
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium italic">
                    No registered teams found matching the search criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </main>
    </PageWrapper>
  );
}
