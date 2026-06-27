export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  priority: 'normal' | 'high' | 'urgent';
  relatedEntityType?: 'team' | 'evaluation' | 'ticket' | 'announcement' | 'submission';
  relatedEntityId?: string;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
}

export type NotificationType = 
  | 'approval' 
  | 'deadline' 
  | 'judge' 
  | 'action' 
  | 'system' 
  | 'mentor' 
  | 'submission' 
  | 'score' 
  | 'announcement' 
  | 'ticket' 
  | 'milestone';

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: Record<NotificationType, boolean>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<'normal' | 'high' | 'urgent', number>;
}