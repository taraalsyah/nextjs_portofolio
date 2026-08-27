import { prisma } from '@/lib/prisma';

export interface CreateAssignmentParams {
  assigneeId: number;
  taskId: number;
  taskNumber: string;
  taskTitle: string;
  assignedByName: string;
}

/**
 * Creates an in-app assignment notification for the specified assignee.
 * Only the assignee user will receive and see this notification.
 */
export async function createAssignmentNotification({
  assigneeId,
  taskId,
  taskNumber,
  taskTitle,
  assignedByName,
}: CreateAssignmentParams) {
  if (!assigneeId) return null;

  const message = `${taskNumber} — ${taskTitle}`;
  const title = 'You have been assigned a new task';
  const userNotif = (prisma as any).userNotification;

  try {
    if (userNotif) {
      const existing = await userNotif.findFirst({
        where: {
          userId: assigneeId,
          taskId: taskId,
          isRead: false,
        },
      });

      if (existing) {
        return existing;
      }

      return await userNotif.create({
        data: {
          userId: assigneeId,
          title,
          message,
          assignedBy: assignedByName,
          taskId: taskId,
          isRead: false,
        },
      });
    }

    // Raw SQL Fallback if Prisma model is not yet dynamically bound
    const existingRaw: any[] = await prisma.$queryRaw`
      SELECT id FROM user_notifications
      WHERE user_id = ${assigneeId} AND task_id = ${taskId} AND is_read = false
      LIMIT 1
    `;
    if (existingRaw && existingRaw.length > 0) {
      return existingRaw[0];
    }

    await prisma.$executeRaw`
      INSERT INTO user_notifications (user_id, title, message, assigned_by, task_id, is_read, created_at)
      VALUES (${assigneeId}, ${title}, ${message}, ${assignedByName}, ${taskId}, false, NOW())
    `;
    return true;
  } catch (err) {
    console.error('Failed to create assignment notification:', err);
    return null;
  }
}

/**
 * Fetch notifications belonging strictly to the specified logged-in userId.
 */
export async function getUserNotifications(userId: number) {
  if (!userId) return [];

  const userNotif = (prisma as any).userNotification;

  try {
    if (userNotif) {
      return await userNotif.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    }

    // Raw SQL Fallback if Prisma model is not yet dynamically bound
    const rows: any[] = await prisma.$queryRaw`
      SELECT id, user_id as userId, title, message, assigned_by as assignedBy, task_id as taskId, is_read as isRead, created_at as createdAt
      FROM user_notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      title: r.title,
      message: r.message,
      assignedBy: r.assignedBy,
      taskId: r.taskId,
      isRead: Boolean(r.isRead),
      createdAt: r.createdAt,
    }));
  } catch (err) {
    console.error('Failed to fetch user notifications:', err);
    return [];
  }
}

/**
 * Mark a single notification or all notifications as read for a logged-in user.
 */
export async function markNotificationsAsRead(userId: number, notificationId?: number) {
  if (!userId) return;

  const userNotif = (prisma as any).userNotification;

  try {
    if (userNotif) {
      if (notificationId) {
        await userNotif.updateMany({
          where: { id: notificationId, userId },
          data: { isRead: true },
        });
      } else {
        await userNotif.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true },
        });
      }
      return;
    }

    // Raw SQL Fallback if Prisma model is not yet dynamically bound
    if (notificationId) {
      await prisma.$executeRaw`
        UPDATE user_notifications SET is_read = true WHERE id = ${notificationId} AND user_id = ${userId}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE user_notifications SET is_read = true WHERE user_id = ${userId} AND is_read = false
      `;
    }
  } catch (err) {
    console.error('Failed to mark notifications as read:', err);
  }
}
