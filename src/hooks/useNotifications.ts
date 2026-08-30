'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { getPusherClient } from '@/lib/pusher-client';

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
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [latestRealtimeToast, setLatestRealtimeToast] = useState<NotificationItem | null>(null);
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

  // Initial fetch and window event listener
  useEffect(() => {
    fetchServerNotifications();

    const handleUpdate = () => {
      fetchServerNotifications();
    };

    window.addEventListener('notifications_updated', handleUpdate);

    return () => {
      window.removeEventListener('notifications_updated', handleUpdate);
    };
  }, [fetchServerNotifications]);

  // Realtime Pusher subscription per logged-in user channel: private-user-{userId}
  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    let client: any = null;

    try {
      client = getPusherClient();
      const channel = client.subscribe(channelName);

      channel.bind('notification:new', (data: any) => {
        if (!data) return;

        const newNotif: NotificationItem = {
          id: String(data.id),
          title: String(data.title || ''),
          message: String(data.message || ''),
          assignedBy: data.assignedBy || null,
          taskId: data.taskId ? Number(data.taskId) : null,
          projectId: data.projectId ? Number(data.projectId) : null,
          createdAt: data.createdAt || new Date().toISOString(),
          isRead: Boolean(data.isRead),
          type: 'assignment',
        };

        setNotifications((prev) => {
          // Idempotency check: prevent duplicate notifications
          if (prev.some((n) => String(n.id) === String(newNotif.id))) {
            return prev;
          }
          return [newNotif, ...prev];
        });

        // Trigger toast ONLY for newly arrived realtime events
        setLatestRealtimeToast(newNotif);
      });

      return () => {
        try {
          channel.unbind('notification:new');
          client.unsubscribe(channelName);
        } catch {
          // noop
        }
      };
    } catch (err) {
      console.warn('[Pusher Client Connection Warning]:', err);
    }
  }, [session?.user]);

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
    latestRealtimeToast,
    markAllAsRead,
    markAsRead,
    deleteNotification,
  };
}

