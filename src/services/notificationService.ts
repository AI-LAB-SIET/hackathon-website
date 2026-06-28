import { mockDelay, generateId } from './mockApi';
import type { Notification, NotificationFilters } from '@/types/api/notification';

const NOTIFICATIONS_KEY = 'siet_notifications_v2';

function getStoredNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredNotifications(notifications: Notification[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

export const notificationService = {
  async getNotifications(filters?: NotificationFilters): Promise<{ items: Notification[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    await mockDelay();
    let notifications = getStoredNotifications();

    if (filters?.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }
    if (filters?.read !== undefined) {
      notifications = notifications.filter(n => n.read === filters.read);
    }
    if (filters?.priority) {
      notifications = notifications.filter(n => n.priority === filters.priority);
    }
    if (filters?.startDate) {
      notifications = notifications.filter(n => n.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      notifications = notifications.filter(n => n.createdAt <= filters.endDate!);
    }

    if (filters?.userId) {
      notifications = notifications.filter(n => n.userId === filters.userId);
    }

    // Sort by createdAt descending
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const total = notifications.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = notifications.slice(start, start + limit);

    return {
      items,
      meta: { page, limit, total, totalPages },
    };
  },

  async addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const newNotification: Notification = {
      ...data,
      id: `notif_${generateId()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const updated = [newNotification, ...notifications];
    setStoredNotifications(updated);
    return newNotification;
  },

  async markAsRead(id: string): Promise<void> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      notifications[idx] = { ...notifications[idx], read: true, readAt: new Date().toISOString() };
      setStoredNotifications(notifications);
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const updated = notifications.map(n => 
      n.userId === userId && !n.read ? { ...n, read: true, readAt: new Date().toISOString() } : n
    );
    setStoredNotifications(updated);
  },

  async deleteNotification(id: string): Promise<void> {
    await mockDelay();
    const notifications = getStoredNotifications();
    const updated = notifications.filter(n => n.id !== id);
    setStoredNotifications(updated);
  },

  async getUnreadCount(userId: string): Promise<number> {
    await mockDelay();
    const notifications = getStoredNotifications();
    return notifications.filter(n => n.userId === userId && !n.read).length;
  },
};