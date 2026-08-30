import webpush from 'web-push';
import prisma from '@/lib/prisma';

let isVapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (isVapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@tasktuntas.com';

  if (!publicKey || !privateKey || publicKey.includes('PLACEHOLDER') || privateKey.includes('PLACEHOLDER')) {
    console.warn('[Web Push Warning] VAPID keys are unconfigured or placeholder in .env');
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
    return true;
  } catch (err) {
    console.error('[Web Push Error] Failed to set VAPID details:', err);
    return false;
  }
}

export const HIGH_PRIORITY_PUSH_TYPES = [
  'TASK_ASSIGNED',
  'MENTION',
  'TASK_REQUEST_DONE',
  'TASK_APPROVED',
  'TASK_REJECTED',
  'TASK_DUE_SOON',
  'TASK_OVERDUE',
  'PROJECT_INVITATION',
] as const;

export interface WebPushPayload {
  userId: number;
  notification: {
    id: number | string;
    title: string;
    message: string;
    taskId?: number | null;
    projectId?: number | null;
  };
  type?: string;
  url?: string;
}

export async function sendWebPushNotification(payload: WebPushPayload): Promise<void> {
  const { userId, notification, type = 'TASK_ASSIGNED', url } = payload;

  // Filter priority: send Web Push ONLY for high priority notification types
  if (type && !HIGH_PRIORITY_PUSH_TYPES.includes(type as any)) {
    return;
  }

  if (!ensureVapidConfigured()) {
    return;
  }

  try {
    // Retrieve active device PushSubscriptions for the user
    const subscriptions = await (prisma as any).pushSubscription.findMany({
      where: { userId: Number(userId) },
    });

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    // Target URL resolution
    let targetUrl = url;
    if (!targetUrl) {
      if (notification.taskId) {
        targetUrl = `/dashboard/task-management/${notification.taskId}`;
      } else if (notification.projectId) {
        targetUrl = `/dashboard/projects/${notification.projectId}`;
      } else {
        targetUrl = `/dashboard/notifications`;
      }
    }

    const pushPayload = JSON.stringify({
      notificationId: String(notification.id),
      title: notification.title,
      message: notification.message,
      taskId: notification.taskId ? String(notification.taskId) : null,
      projectId: notification.projectId ? String(notification.projectId) : null,
      url: targetUrl,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
    });

    // Send push notification to each subscribed device
    const sendPromises = subscriptions.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayload);
      } catch (err: any) {
        // If subscription is expired or unsubscribed (HTTP 404 / 410 Gone), remove from database
        if (err.statusCode === 404 || err.statusCode === 410) {
          try {
            await (prisma as any).pushSubscription.delete({
              where: { id: sub.id },
            });
          } catch {
            // noop
          }
        } else {
          console.error(`[Web Push Error] Failed to send push to sub ${sub.id}:`, err.message || err);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (err) {
    console.error('[Web Push Exception]:', err);
  }
}
