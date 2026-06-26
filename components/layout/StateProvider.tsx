"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Team, UserSession, Announcement, Participant } from "@/types";
import { INITIAL_TEAMS, INITIAL_ANNOUNCEMENTS } from "@/lib/mockData";

interface StateContextType {
  teams: Team[];
  session: UserSession;
  announcements: Announcement[];
  login: (email: string, role: "participant" | "admin") => boolean;
  logout: () => void;
  registerTeam: (teamData: { name: string; projectDescription: string; members: Participant[] }) => void;
  updateTeamMembers: (teamId: string, members: Participant[]) => void;
  approveTeam: (teamId: string) => void;
  rejectTeam: (teamId: string) => void;
  addAnnouncement: (title: string, content: string, type: "info" | "warning" | "success") => void;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [session, setSession] = useState<UserSession>({
    isLoggedIn: false,
    role: null,
    email: null,
    teamId: null,
  });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTeams = localStorage.getItem("siet_teams");
      const storedSession = localStorage.getItem("siet_session");
      const storedAnnouncements = localStorage.getItem("siet_announcements");

      if (storedTeams) {
        setTeams(JSON.parse(storedTeams));
      } else {
        setTeams(INITIAL_TEAMS);
        localStorage.setItem("siet_teams", JSON.stringify(INITIAL_TEAMS));
      }

      if (storedSession) {
        setSession(JSON.parse(storedSession));
      }

      if (storedAnnouncements) {
        setAnnouncements(JSON.parse(storedAnnouncements));
      } else {
        setAnnouncements(INITIAL_ANNOUNCEMENTS);
        localStorage.setItem("siet_announcements", JSON.stringify(INITIAL_ANNOUNCEMENTS));
      }

      setInitialized(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (initialized) {
      localStorage.setItem("siet_teams", JSON.stringify(teams));
    }
  }, [teams, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("siet_session", JSON.stringify(session));
    }
  }, [session, initialized]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem("siet_announcements", JSON.stringify(announcements));
    }
  }, [announcements, initialized]);

  const login = (email: string, role: "participant" | "admin"): boolean => {
    if (role === "admin") {
      // Admin account: admin@college.edu
      if (email === "admin@college.edu") {
        const newSession: UserSession = {
          isLoggedIn: true,
          role: "admin",
          email: "admin@college.edu",
        };
        setSession(newSession);
        return true;
      }
      return false;
    } else {
      // Find team containing participant with this email
      const team = teams.find((t) => t.members.some((m) => m.email.toLowerCase() === email.toLowerCase()));
      if (team) {
        const newSession: UserSession = {
          isLoggedIn: true,
          role: "participant",
          email,
          teamId: team.id,
        };
        setSession(newSession);
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    const newSession: UserSession = {
      isLoggedIn: false,
      role: null,
      email: null,
      teamId: null,
    };
    setSession(newSession);
  };

  const registerTeam = (teamData: { name: string; projectDescription: string; members: Participant[] }) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamData.name,
      size: teamData.members.length,
      members: teamData.members,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      projectDescription: teamData.projectDescription,
    };

    const updatedTeams = [...teams, newTeam];
    setTeams(updatedTeams);

    // Auto log in as the team leader (first member)
    const leader = teamData.members.find((m) => m.isLeader) || teamData.members[0];
    const newSession: UserSession = {
      isLoggedIn: true,
      role: "participant",
      email: leader.email,
      teamId: newTeam.id,
    };
    setSession(newSession);
  };

  const updateTeamMembers = (teamId: string, members: Participant[]) => {
    const updated = teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          members,
          size: members.length,
        };
      }
      return t;
    });
    setTeams(updated);
  };

  const approveTeam = (teamId: string) => {
    const updated = teams.map((t) => {
      if (t.id === teamId) {
        return { ...t, status: "APPROVED" as const };
      }
      return t;
    });
    setTeams(updated);
  };

  const rejectTeam = (teamId: string) => {
    const updated = teams.map((t) => {
      if (t.id === teamId) {
        return { ...t, status: "REJECTED" as const };
      }
      return t;
    });
    setTeams(updated);
  };

  const addAnnouncement = (title: string, content: string, type: "info" | "warning" | "success") => {
    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title,
      content,
      type,
      date: "Just now",
    };
    setAnnouncements([newAnn, ...announcements]);
  };

  return (
    <StateContext.Provider
      value={{
        teams,
        session,
        announcements,
        login,
        logout,
        registerTeam,
        updateTeamMembers,
        approveTeam,
        rejectTeam,
        addAnnouncement,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within a StateProvider");
  }
  return context;
}
