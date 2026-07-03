"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAppState } from "@/components/layout/StateProvider";
import { motion } from "framer-motion";
import {
  Award,
  Search,
  Github,
  Globe,
  Trophy,
  Users,
  ChevronLeft
} from "lucide-react";

function ResultsContent() {
  const { hackathons, teams, problemStatements } = useAppState();
  const searchParams = useSearchParams();
  const hParam = searchParams.get("h");

  // Get active and ended hackathons for displaying results
  const eligibleHackathons = useMemo(() => {
    return hackathons.filter(
      (h) => h.status === "active" || h.status === "ended" || h.status === "completed"
    );
  }, [hackathons]);

  // Selected Hackathon State
  const [selectedHackId, setSelectedHackId] = useState<string>("");

  // Sync selected hackathon with query parameter
  useEffect(() => {
    if (hParam) {
      const match = eligibleHackathons.find((h) => h.slug === hParam);
      if (match) {
        setSelectedHackId(match.id);
        return;
      }
    }
    if (eligibleHackathons.length > 0 && !selectedHackId) {
      setSelectedHackId(eligibleHackathons[0].id);
    }
  }, [hParam, eligibleHackathons, selectedHackId]);

  const selectedHackathon = useMemo(() => {
    return eligibleHackathons.find((h) => h.id === selectedHackId);
  }, [selectedHackId, eligibleHackathons]);

  // Calculate scores and ranks
  const rankedTeams = useMemo(() => {
    if (!selectedHackId) return [];
    
    const filtered = teams.filter(
      (t) => t.hackathonId === selectedHackId && t.status === "APPROVED"
    );

    const scored = filtered.map((t) => {
      const evals = t.evaluations || [];
      if (evals.length === 0) return { ...t, avgScore: 0 };
      
      const sum = evals.reduce((acc, ev) => {
        const scoreSum =
          ev.innovation +
          ev.feasibility +
          ev.presentation +
          (ev.technicalDepth ?? 0) +
          (ev.aiUsage ?? 0);
        return acc + scoreSum / 5;
      }, 0);
      
      return {
        ...t,
        avgScore: Math.round((sum / evals.length) * 10) / 10,
      };
    });

    // Sort descending by average score
    return scored.sort((a, b) => b.avgScore - a.avgScore);
  }, [selectedHackId, teams]);

  // Podium Positions (Top 3)
  const podium = useMemo(() => {
    return {
      first: rankedTeams[0] || null,
      second: rankedTeams[1] || null,
      third: rankedTeams[2] || null,
    };
  }, [rankedTeams]);

  // Standings list (teams ranked 4th onwards)
  const remainingStandings = useMemo(() => {
    return rankedTeams.slice(3);
  }, [rankedTeams]);

  // Search Filter State
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered remaining standings
  const filteredStandings = useMemo(() => {
    return remainingStandings.filter((t) => {
      const nameMatch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const psTitle = problemStatements.find((p) => p.id === t.problemStatementId)?.title || "";
      const psMatch = psTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      const memberMatch = t.members.some((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );

      return nameMatch || psMatch || memberMatch;
    });
  }, [remainingStandings, searchQuery, problemStatements]);

  const getProblemStatementTitle = (psId?: string) => {
    if (!psId) return "General Track";
    return problemStatements.find((ps) => ps.id === psId)?.title || "General Track";
  };

  return (
    <PageWrapper className="min-h-screen bg-[#f8fafb] dark:bg-gray-950 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full mt-20">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-primary-green transition-colors dark:text-gray-400"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>

        {/* Dropdown Selector & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary-dark dark:text-gray-100 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500 shrink-0" /> Standings & Leaderboards
            </h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
              Live standings for active sprints and final podium records for completed events.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {selectedHackathon && (
              <span
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                  selectedHackathon.status === "active"
                    ? "bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 animate-pulse"
                    : "bg-slate-50 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800"
                }`}
              >
                {selectedHackathon.status === "active" ? "● Live Standings" : "Completed"}
              </span>
            )}
            <select
              value={selectedHackId}
              onChange={(e) => setSelectedHackId(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold bg-[#f8fafb] dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-green/30"
            >
              {eligibleHackathons.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {eligibleHackathons.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-gray-700 dark:text-gray-300">No Results Available</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
              Leaderboards are only rendered for active or completed hackathons. Check back once a sprint goes live!
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* 🏆 WINNER PODIUM SECTION */}
            <div>
              <h2 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-8 flex items-center justify-center gap-1.5">
                <Award className="h-4 w-4 text-yellow-500" /> Winner Podium
              </h2>

              {!podium.first && !podium.second && !podium.third ? (
                <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs max-w-md mx-auto">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic font-semibold">Evaluation scores are currently pending for this event.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto">
                  {/* 🥈 2ND PLACE PODIUM */}
                  {podium.second ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center shadow-md relative order-2 md:order-1 h-fit"
                    >
                      <div className="absolute top-[-16px] bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm">
                        2
                      </div>
                      <span className="text-4xl mt-2">🥈</span>
                      <h3 className="font-extrabold text-base text-primary-dark dark:text-gray-100 mt-3 truncate w-full">
                        {podium.second.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Silver Medalist
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {getProblemStatementTitle(podium.second.problemStatementId)}
                      </p>
                      <div className="mt-4 bg-slate-50 dark:bg-gray-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-900 text-xs font-extrabold text-slate-600 dark:text-slate-400">
                        Score: {podium.second.avgScore}/10
                      </div>
                      
                      <div className="w-full mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Members</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {podium.second.members.map((m) => (
                            <span key={m.email} className="text-[9px] bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 font-semibold">{m.name}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="hidden md:block order-2 md:order-1" />
                  )}

                  {/* 🥇 1ST PLACE PODIUM (Center, Highlighted) */}
                  {podium.first ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-yellow-400 dark:border-yellow-600/50 p-8 flex flex-col items-center text-center shadow-xl relative order-1 md:order-2 ring-4 ring-yellow-400/10 h-fit scale-105"
                    >
                      <div className="absolute top-[-18px] bg-yellow-400 text-amber-950 h-9 w-9 rounded-full flex items-center justify-center font-extrabold text-sm shadow-md border border-yellow-500">
                        1
                      </div>
                      <span className="text-5xl mt-2">🥇</span>
                      <h3 className="font-extrabold text-lg text-primary-dark dark:text-gray-100 mt-3 truncate w-full">
                        {podium.first.name}
                      </h3>
                      <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-bold uppercase tracking-wider mt-0.5">
                        Gold Champion
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {getProblemStatementTitle(podium.first.problemStatementId)}
                      </p>
                      <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/20 px-4 py-2 rounded-xl border border-yellow-100 dark:border-yellow-900/30 text-sm font-extrabold text-yellow-700 dark:text-yellow-400">
                        Score: {podium.first.avgScore}/10
                      </div>

                      <div className="w-full mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Members</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {podium.first.members.map((m) => (
                            <span key={m.email} className="text-[9px] bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 font-semibold">{m.name}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="hidden md:block order-1 md:order-2" />
                  )}

                  {/* 🥉 3RD PLACE PODIUM */}
                  {podium.third ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-orange-300 dark:border-orange-900/50 p-6 flex flex-col items-center text-center shadow-md relative order-3 md:order-3 h-fit"
                    >
                      <div className="absolute top-[-16px] bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900 h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-sm shadow-sm">
                        3
                      </div>
                      <span className="text-4xl mt-2">🥉</span>
                      <h3 className="font-extrabold text-base text-primary-dark dark:text-gray-100 mt-3 truncate w-full">
                        {podium.third.name}
                      </h3>
                      <p className="text-[10px] text-orange-650 dark:text-orange-400 font-bold uppercase tracking-wider mt-0.5">
                        Bronze medalist
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {getProblemStatementTitle(podium.third.problemStatementId)}
                      </p>
                      <div className="mt-4 bg-orange-50 dark:bg-orange-950/20 px-3 py-1.5 rounded-xl border border-orange-100 dark:border-orange-900/30 text-xs font-extrabold text-orange-700 dark:text-orange-400">
                        Score: {podium.third.avgScore}/10
                      </div>

                      <div className="w-full mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Members</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {podium.third.members.map((m) => (
                            <span key={m.email} className="text-[9px] bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 font-semibold">{m.name}</span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="hidden md:block order-3 md:order-3" />
                  )}
                </div>
              )}
            </div>

            {/* 📊 FULL STANDINGS TABLE SECTION */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <h3 className="font-extrabold text-base text-primary-dark dark:text-gray-100 flex items-center gap-2">
                  📊 All Sprints Standings
                </h3>
                
                {/* Search Standings */}
                <div className="relative w-full sm:w-72">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Search className="h-4 w-4" /></div>
                  <input
                    type="text"
                    placeholder="Search by team, track, member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-green/30 bg-[#f8fafb] dark:bg-gray-850 text-gray-900 dark:text-gray-150"
                  />
                </div>
              </div>

              {rankedTeams.length <= 3 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic font-bold">No other teams are currently evaluated in this hackathon.</p>
                </div>
              ) : filteredStandings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic font-bold">No standings matching &quot;{searchQuery}&quot;</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 uppercase font-bold text-[10px]">
                        <th className="py-3 px-4 w-16">Rank</th>
                        <th className="py-3 px-4">Team</th>
                        <th className="py-3 px-4">Problem Statement Track</th>
                        <th className="py-3 px-4">Score</th>
                        <th className="py-3 px-4 w-32">Workspace links</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-850/50">
                      {filteredStandings.map((team, idx) => {
                        const globalRank = idx + 4; // Starts from 4th
                        return (
                          <tr key={team.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-colors">
                            <td className="py-4 px-4 font-extrabold text-primary-green">
                              #{globalRank}
                            </td>
                            <td className="py-4 px-4">
                              <div>
                                <p className="font-bold text-gray-800 dark:text-gray-200">{team.name}</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {team.members.map((m) => (
                                    <span key={m.email} className="text-[8px] bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-semibold">{m.name}</span>
                                  ))}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 font-semibold">
                              {getProblemStatementTitle(team.problemStatementId)}
                            </td>
                            <td className="py-4 px-4 font-extrabold text-blue-600 dark:text-blue-400">
                              {team.avgScore > 0 ? `${team.avgScore}/10` : "—"}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex gap-2">
                                {team.githubUrl ? (
                                  <a
                                    href={team.githubUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg border border-gray-150 dark:border-gray-800 hover:text-primary-green dark:text-gray-400 dark:hover:text-white transition-colors"
                                    title="GitHub Repository"
                                  >
                                    <Github className="h-4 w-4" />
                                  </a>
                                ) : null}
                                {team.demoUrl ? (
                                  <a
                                    href={team.demoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg border border-gray-150 dark:border-gray-800 hover:text-primary-green dark:text-gray-400 dark:hover:text-white transition-colors"
                                    title="Live Demo"
                                  >
                                    <Globe className="h-4 w-4" />
                                  </a>
                                ) : null}
                                {!team.githubUrl && !team.demoUrl && (
                                  <span className="text-[9px] text-gray-400">No links</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </PageWrapper>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-sm text-gray-400">Loading standings...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
