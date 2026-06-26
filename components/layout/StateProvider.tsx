"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Team, UserSession, Announcement, Participant } from "@/types";
import { INITIAL_TEAMS, INITIAL_ANNOUNCEMENTS } from "@/lib/mockData";

interface StateContextType {
  teams: Team[];
  session: UserSession;
  announcements: Announcement[];
  login: (email: string, role: "participant" | "admin" | "judge" | "mentor" | "organizer") => boolean;
  logout: () => void;
  registerTeam: (teamData: { name: string; projectDescription: string; members: Participant[] }) => void;
  updateTeamMembers: (teamId: string, members: Participant[]) => void;
  approveTeam: (teamId: string) => void;
  rejectTeam: (teamId: string) => void;
  addAnnouncement: (title: string, content: string, type: "info" | "warning" | "success") => void;
  updateProjectDetails: (teamId: string, details: Partial<Team>) => void;
  evaluateProject: (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; feedback: string; judgeEmail: string }) => void;
  addMentorFeedback: (teamId: string, feedback: { author: string; feedback: string }) => void;
  updateMilestoneProgress: (teamId: string, milestoneId: string, completed: boolean) => void;
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
        const enhancedTeams = INITIAL_TEAMS.map((t) => ({
          ...t,
          githubUrl: t.id === "team-1" ? "https://github.com/abhishek-sharma/advisory-rag" : "",
          videoUrl: t.id === "team-1" ? "https://youtube.com/watch?v=advisory-rag-demo" : "",
          demoUrl: t.id === "team-1" ? "https://advisory-rag.siet.edu" : "",
          aiDisclosure: t.id === "team-1" ? "We used Claude 3.5 Sonnet for drafting system models." : "",
          submitted: t.id === "team-1",
          submittedAt: t.id === "team-1" ? new Date().toISOString() : undefined,
          milestonesProgress: [
            { id: "ms-1", title: "Ideation & Design Diagram", completed: true },
            { id: "ms-2", title: "Database & API Schema Setup", completed: t.id === "team-1" },
            { id: "ms-3", title: "Core ML/AI Model Integration", completed: t.id === "team-1" },
            { id: "ms-4", title: "Frontend Dashboard Integration", completed: false },
            { id: "ms-5", title: "Public Deployment & Pitch slides", completed: false },
          ],
          evaluations: t.id === "team-1" ? [
            { innovation: 8, feasibility: 9, presentation: 8, feedback: "Great localized RAG system, UI is highly responsive.", judgeEmail: "judge@college.edu" }
          ] : [],
          mentorFeedbacks: t.id === "team-1" ? [
            { author: "Dr. A. Rajesh", feedback: "Ensure safety checks on RAG database context limits.", date: "2 hours ago" }
          ] : [],
        }));
        setTeams(enhancedTeams);
        localStorage.setItem("siet_teams", JSON.stringify(enhancedTeams));
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

  const login = (email: string, role: "participant" | "admin" | "judge" | "mentor" | "organizer"): boolean => {
    if (role === "admin") {
      if (email === "admin@college.edu") {
        setSession({ isLoggedIn: true, role: "admin", email });
        return true;
      }
      return false;
    } else if (role === "judge") {
      if (email === "judge@college.edu") {
        setSession({ isLoggedIn: true, role: "judge", email });
        return true;
      }
      return false;
    } else if (role === "mentor") {
      if (email === "mentor@college.edu") {
        setSession({ isLoggedIn: true, role: "mentor", email });
        return true;
      }
      return false;
    } else if (role === "organizer") {
      if (email === "organizer@college.edu") {
        setSession({ isLoggedIn: true, role: "organizer", email });
        return true;
      }
      return false;
    } else {
      // Find team containing participant with this email
      const team = teams.find((t) => t.members.some((m) => m.email.toLowerCase() === email.toLowerCase()));
      if (team) {
        setSession({
          isLoggedIn: true,
          role: "participant",
          email,
          teamId: team.id,
        });
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setSession({
      isLoggedIn: false,
      role: null,
      email: null,
      teamId: null,
    });
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
      milestonesProgress: [
        { id: "ms-1", title: "Ideation & Design Diagram", completed: false },
        { id: "ms-2", title: "Database & API Schema Setup", completed: false },
        { id: "ms-3", title: "Core ML/AI Model Integration", completed: false },
        { id: "ms-4", title: "Frontend Dashboard Integration", completed: false },
        { id: "ms-5", title: "Public Deployment & Pitch slides", completed: false },
      ],
      evaluations: [],
      mentorFeedbacks: [],
    };

    setTeams([...teams, newTeam]);

    const leader = teamData.members.find((m) => m.isLeader) || teamData.members[0];
    setSession({
      isLoggedIn: true,
      role: "participant",
      email: leader.email,
      teamId: newTeam.id,
    });
  };

  const updateTeamMembers = (teamId: string, members: Participant[]) => {
    setTeams(teams.map((t) => (t.id === teamId ? { ...t, members, size: members.length } : t)));
  };

  const approveTeam = (teamId: string) => {
    setTeams(teams.map((t) => (t.id === teamId ? { ...t, status: "APPROVED" as const } : t)));
  };

  const rejectTeam = (teamId: string) => {
    setTeams(teams.map((t) => (t.id === teamId ? { ...t, status: "REJECTED" as const } : t)));
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

  const updateProjectDetails = (teamId: string, details: Partial<Team>) => {
    setTeams(teams.map((t) => (t.id === teamId ? { ...t, ...details } : t)));
  };

  const evaluateProject = (teamId: string, evaluation: { innovation: number; feasibility: number; presentation: number; feedback: string; judgeEmail: string }) => {
    setTeams(teams.map((t) => {
      if (t.id === teamId) {
        const evals = t.evaluations || [];
        const index = evals.findIndex((e) => e.judgeEmail === evaluation.judgeEmail);
        const updatedEvals = [...evals];
        if (index > -1) {
          updatedEvals[index] = evaluation;
        } else {
          updatedEvals.push(evaluation);
        }
        return { ...t, evaluations: updatedEvals };
      }
      return t;
    }));
  };

  const addMentorFeedback = (teamId: string, feedback: { author: string; feedback: string }) => {
    setTeams(teams.map((t) => {
      if (t.id === teamId) {
        const logs = t.mentorFeedbacks || [];
        return {
          ...t,
          mentorFeedbacks: [{ author: feedback.author, feedback: feedback.feedback, date: "Just now" }, ...logs],
        };
      }
      return t;
    }));
  };

  const updateMilestoneProgress = (teamId: string, milestoneId: string, completed: boolean) => {
    setTeams(teams.map((t) => {
      if (t.id === teamId) {
        const list = t.milestonesProgress || [];
        return {
          ...t,
          milestonesProgress: list.map((m) => (m.id === milestoneId ? { ...m, completed } : m)),
        };
      }
      return t;
    }));
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
        updateProjectDetails,
        evaluateProject,
        addMentorFeedback,
        updateMilestoneProgress,
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
