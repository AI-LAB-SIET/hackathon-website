export interface Submission {
  id: string;
  teamId: string;
  teamName: string;
  type: 'abstract' | 'final' | 'video' | 'demo' | 'source';
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'resubmission_required';
  files: SubmissionFile[];
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  score?: number;
  version: number;
}

export interface SubmissionFile {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  checksum?: string;
}

export interface SubmissionFilters {
  teamId?: string;
  type?: Submission['type'];
  status?: Submission['status'];
  page?: number;
  limit?: number;
  sortBy?: 'submittedAt' | 'type' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSubmissionRequest {
  teamId: string;
  type: Submission['type'];
  files: File[];
  description?: string;
}

export interface UpdateSubmissionRequest {
  id: string;
  status?: Submission['status'];
  reviewNotes?: string;
  score?: number;
}

export interface SubmissionDeadline {
  type: Submission['type'];
  deadline: string;
  timezone: string;
  gracePeriod?: number;
  latePenalty?: string;
}

export interface SubmissionStats {
  totalSubmissions: number;
  byType: Record<Submission['type'], number>;
  byStatus: Record<Submission['status'], number>;
  pendingReview: number;
  overdue: number;
  averageScore?: number;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface FileUploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  maxFiles: number;
  chunkSize?: number;
}