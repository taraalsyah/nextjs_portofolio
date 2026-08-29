'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  assignedBy?: string | null;
  taskId?: number | null;
  projectId?: number | null;
  createdAt: Date | string;
  isRead: boolean;
  type?: 'info' | 'success' | 'warning' | 'alert' | 'assignment';
}

const STORAGE_KEY = 'user_notifications_v1';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchServerNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          const apiNotifications: NotificationItem[] = data.notifications.map((n: any) => ({
            id: String(n.id),
            title: n.title,
            message: n.message,
            assignedBy: n.assignedBy,
            taskId: n.taskId,
            projectId: n.projectId,
            createdAt: n.createdAt,
            isRead: Boolean(n.isRead),
            type: 'assignment',
          }));

          setNotifications(apiNotifications);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not fetch server notifications, falling back to local state:', e);
    }

    // Fallback to local storage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // noop
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchServerNotifications();

    const handleUpdate = () => {
      fetchServerNotifications();
    };

    window.addEventListener('notifications_updated', handleUpdate);

    // Periodic real-time sync every 6 seconds
    const pollInterval = setInterval(() => {
      fetchServerNotifications();
    }, 6000);

    return () => {
      window.removeEventListener('notifications_updated', handleUpdate);
      clearInterval(pollInterval);
    };
  }, [fetchServerNotifications]);

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: NotificationItem[] = JSON.parse(saved);
        const filtered = parsed.filter((n) => n.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch {
      // noop
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    loading,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  };
}
