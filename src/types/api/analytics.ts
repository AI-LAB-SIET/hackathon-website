export interface DashboardStats {
  totalTeams: number;
  totalParticipants: number;
  approvedTeams: number;
  pendingTeams: number;
  rejectedTeams: number;
  submittedProjects: number;
  checkedInTeams: number;
  openTickets: number;
  totalVolunteers: number;
  publishedProblems: number;
  recentRegistrations: number;
  completionRate: number;
}

export interface TeamAnalytics {
  registrationsOverTime: TimeSeriesData[];
  teamsByProblemStatement: CategoryData[];
  teamsByStatus: CategoryData[];
  teamsByDepartment: CategoryData[];
  teamSizeDistribution: CategoryData[];
  paymentVerificationRate: number;

}

export interface ParticipantAnalytics {
  totalParticipants: number;
  byRole: CategoryData[];
  byDepartment: CategoryData[];
  byYear: CategoryData[];
  skillsDistribution: CategoryData[];
  githubLinkRate: number;
}

export interface EvaluationAnalytics {
  totalEvaluations: number;
  completedEvaluations: number;
  pendingEvaluations: number;
  averageScore: number;
  scoreDistribution: CategoryData[];
  scoresByCriteria: CategoryData[];
  judgeWorkload: CategoryData[];
  evaluationTrend: TimeSeriesData[];
}

export interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: number;
  ticketsByCategory: CategoryData[];
  ticketsByPriority: CategoryData[];
  ticketsByStatus: CategoryData[];
  ticketsOverTime: TimeSeriesData[];
  volunteerWorkload: CategoryData[];
}

export interface EngagementAnalytics {
  activeUsers: number;
  dailyActiveUsers: TimeSeriesData[];
  sessionDuration: number;
  pageViews: TimeSeriesData[];
  featureUsage: CategoryData[];
  notificationEngagement: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
  label?: string;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage?: number;
  color?: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  problemStatementId?: string;
  department?: string;
  role?: string;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: AnalyticsFilters;
  includeCharts?: boolean;
}