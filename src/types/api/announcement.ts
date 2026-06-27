export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  authorId: string;
  authorName: string;
  authorRole: string;
  targetAudience: 'all' | 'participants' | 'judges' | 'organizers' | 'volunteers' | 'admins';
  published: boolean;
  scheduledAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: AnnouncementAttachment[];
  readCount?: number;
}

export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface AnnouncementFilters {
  type?: Announcement['type'];
  targetAudience?: Announcement['targetAudience'];
  published?: boolean;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: Announcement['type'];
  targetAudience: Announcement['targetAudience'];
  scheduledAt?: string;
  expiresAt?: string;
  attachments?: File[];
}

export interface UpdateAnnouncementRequest extends Partial<CreateAnnouncementRequest> {
  id: string;
}