import { mockDelay, generateId } from './mockApi';
import type { Evaluation, EvaluationRequest, EvaluationFilters, EvaluationScores, EvaluationStats } from '@/types/api/evaluation';
import { notificationService } from './notificationService';

const EVALUATIONS_KEY = 'siet_evaluations';

function getStoredEvaluations(): Evaluation[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(EVALUATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredEvaluations(evaluations: Evaluation[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
}

export const evaluationService = {
  async getEvaluations(filters?: EvaluationFilters): Promise<{ items: Evaluation[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    await mockDelay();
    let evaluations = getStoredEvaluations();

    if (filters?.judgeId) {
      evaluations = evaluations.filter(e => e.judgeId === filters.judgeId);
    }
    if (filters?.teamId) {
      evaluations = evaluations.filter(e => e.teamId === filters.teamId);
    }
    if (filters?.round) {
      evaluations = evaluations.filter(e => e.round === filters.round);
    }
    if (filters?.status) {
      evaluations = evaluations.filter(e => e.status === filters.status);
    }

    // Sort by createdAt descending
    evaluations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const total = evaluations.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = evaluations.slice(start, start + limit);

    return { items, meta: { page, limit, total, totalPages } };
  },

  async getEvaluationById(id: string): Promise<Evaluation | null> {
    await mockDelay();
    const evaluations = getStoredEvaluations();
    return evaluations.find(e => e.id === id) || null;
  },

  async getEvaluationByTeamAndJudge(teamId: string, judgeId: string): Promise<Evaluation | null> {
    await mockDelay();
    const evaluations = getStoredEvaluations();
    return evaluations.find(e => e.teamId === teamId && e.judgeId === judgeId) || null;
  },

  async createOrUpdateEvaluation(data: EvaluationRequest): Promise<Evaluation> {
    await mockDelay();
    const evaluations = getStoredEvaluations();
    
    // Check if evaluation already exists
    const existingIdx = evaluations.findIndex(e => e.teamId === data.teamId && e.judgeId === data.judgeId && e.round === (data.round || 1));
    
    const scores = data.scores;
    const total = scores.innovation + scores.feasibility + scores.presentation + (scores.technicalDepth || 0) + (scores.aiUsage || 0);
    const count = 3 + (scores.technicalDepth ? 1 : 0) + (scores.aiUsage ? 1 : 0);
    const average = total / count;

    const newEvaluation: Evaluation = {
      id: existingIdx >= 0 ? evaluations[existingIdx].id : `eval_${generateId()}`,
      teamId: data.teamId,
      judgeId: data.judgeId,
      judgeName: data.judgeName,
      scores,
      feedback: data.feedback,
      round: data.round || 1,
      status: 'submitted',
      createdAt: existingIdx >= 0 ? evaluations[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      total,
      average,
    };

    let updatedEvaluations;
    if (existingIdx >= 0) {
      updatedEvaluations = [...evaluations];
      updatedEvaluations[existingIdx] = newEvaluation;
    } else {
      updatedEvaluations = [...evaluations, newEvaluation];
    }
    
    setStoredEvaluations(updatedEvaluations);
    
    // Add notification
    notificationService.addNotification({
      userId: data.teamId, // This should be the team leader's email
      type: 'score',
      title: 'New Evaluation Received',
      body: `Judge ${data.judgeName} has submitted an evaluation for your team. Average score: ${average.toFixed(1)}/10`,
      priority: 'normal',
      relatedEntityType: 'evaluation',
      relatedEntityId: newEvaluation.id,
    });

    return newEvaluation;
  },

  async deleteEvaluation(id: string): Promise<void> {
    await mockDelay();
    const evaluations = getStoredEvaluations();
    const updated = evaluations.filter(e => e.id !== id);
    setStoredEvaluations(updated);
  },

  async getStats(judgeId?: string): Promise<EvaluationStats> {
    await mockDelay();
    let evaluations = getStoredEvaluations();
    
    if (judgeId) {
      evaluations = evaluations.filter(e => e.judgeId === judgeId);
    }

    const totalEvaluations = evaluations.length;
    const completedEvaluations = evaluations.filter(e => e.status === 'submitted').length;
    const pendingEvaluations = evaluations.filter(e => e.status === 'draft').length;
    const averageScore = evaluations.length > 0 
      ? evaluations.reduce((acc, e) => acc + (e.average ?? 0), 0) / evaluations.length 
      : 0;

    // Score distribution
    const scoreRanges = { '0-2': 0, '3-4': 0, '5-6': 0, '7-8': 0, '9-10': 0 };
    evaluations.forEach(e => {
      const avg = e.average ?? 0;
      if (avg <= 2) scoreRanges['0-2']++;
      else if (avg <= 4) scoreRanges['3-4']++;
      else if (avg <= 6) scoreRanges['5-6']++;
      else if (avg <= 8) scoreRanges['7-8']++;
      else scoreRanges['9-10']++;
    });

    return {
      totalEvaluations,
      completedEvaluations,
      pendingEvaluations,
      averageScore,
      scoreDistribution: scoreRanges,
      scoresByCriteria: [], // Would need more detailed data
      judgeWorkload: [], // Would need more detailed data
      evaluationTrend: [], // Would need time-series data
    };
  },
};