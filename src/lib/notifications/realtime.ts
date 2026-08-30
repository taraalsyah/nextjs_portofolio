import { pusherServer } from '@/lib/pusher-server';

export interface RealtimeNotificationPayload {
  id: number;
  userId: number;
  title: string;
  message: string;
  assignedBy?: string | null;
  taskId?: number | null;
  projectId?: number | null;
  isRead: boolean;
  createdAt: Date | string;
}

/**
 * Reusable helper to send a realtime notification via Pusher to private-user-{userId}.
 * Wrapped in try-catch to ensure failure in Pusher does not disrupt database operations.
 */
export async function sendRealtimeNotification(
  userId: number,
  notification: any
): Promise<boolean> {
  if (!userId || !notification) return false;

  try {
    const channelName = `private-user-${userId}`;
    const payload: RealtimeNotificationPayload = {
      id: Number(notification.id || 0),
      userId: Number(notification.userId || userId),
      title: String(notification.title || ''),
      message: String(notification.message || ''),
      assignedBy: notification.assignedBy || null,
      taskId: notification.taskId ? Number(notification.taskId) : null,
      projectId: notification.projectId ? Number(notification.projectId) : null,
      isRead: Boolean(notification.isRead),
      createdAt: notification.createdAt
        ? new Date(notification.createdAt).toISOString()
        : new Date().toISOString(),
    };

    await pusherServer.trigger(channelName, 'notification:new', payload);
    return true;
  } catch (err) {
    console.error(`[Pusher Realtime Error] Failed to trigger notification for user #${userId}:`, err);
    return false;
  }
}
