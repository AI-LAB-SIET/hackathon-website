export interface Evaluation {
  id: string;
  teamId: string;
  judgeId: string;
  judgeEmail?: string;
  judgeName?: string;
  scores: EvaluationScores;
  feedback: string;
  createdAt: string;
  updatedAt: string;
  round: number;
  status?: 'draft' | 'submitted';
  total?: number;
  average?: number;
}

export interface EvaluationScores {
  innovation: number;
  feasibility: number;
  presentation: number;
  technicalDepth?: number;
  aiUsage?: number;
  total?: number;
  average?: number;
}

export interface EvaluationCriteria {
  key: keyof EvaluationScores;
  label: string;
  description: string;
  maxScore: number;
  weight: number;
}

export interface EvaluationRequest {
  teamId: string;
  judgeId: string;
  judgeName: string;
  scores: EvaluationScores;
  feedback: string;
  round?: number;
}

export interface EvaluationFilters {
  judgeId?: string;
  teamId?: string;
  round?: number;
  status?: 'pending' | 'completed';
  page?: number;
  limit?: number;
}

export interface EvaluationStats {
  totalTeams?: number;
  evaluatedTeams?: number;
  pendingTeams?: number;
  totalEvaluations?: number;
  completedEvaluations?: number;
  pendingEvaluations?: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  scoresByCriteria?: unknown[];
  judgeWorkload?: unknown[];
  evaluationTrend?: unknown[];
}