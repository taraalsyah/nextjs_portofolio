import { prisma } from '@/lib/prisma';

export interface UserNotificationItem {
  id: number;
  userId: number;
  title: string;
  message: string;
  assignedBy?: string | null;
  taskId?: number | null;
  projectId?: number | null;
  isRead: boolean;
  createdAt: Date;
}


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
export async function getUserNotifications(userId: number): Promise<UserNotificationItem[]> {
  if (!userId) return [];

  const userNotif = (prisma as any).userNotification;

  try {
    if (userNotif) {
      const items = await userNotif.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      const taskIds = items
        .map((i: any) => i.taskId)
        .filter((id: any): id is number => typeof id === 'number' && !isNaN(id));

      const taskProjectMap: Record<number, number | null> = {};
      if (taskIds.length > 0) {
        const tasks = await prisma.task.findMany({
          where: { id: { in: taskIds }, deletedAt: null },
          select: { id: true, projectId: true },
        });
        tasks.forEach((t) => {
          taskProjectMap[t.id] = t.projectId;
        });
      }

      const mappedItems: UserNotificationItem[] = items.map((i: any) => ({
        id: Number(i.id),
        userId: Number(i.userId),
        title: String(i.title || ''),
        message: String(i.message || ''),
        assignedBy: i.assignedBy || null,
        taskId: i.taskId ? Number(i.taskId) : null,
        projectId: i.taskId ? (taskProjectMap[i.taskId] ?? null) : null,
        isRead: Boolean(i.isRead),
        createdAt: new Date(i.createdAt),
      }));
      return mappedItems;
    }

    // Raw SQL Fallback if Prisma model is not yet dynamically bound
    const rows: any[] = await prisma.$queryRaw`
      SELECT 
        n.id, 
        n.user_id as userId, 
        n.title, 
        n.message, 
        n.assigned_by as assignedBy, 
        n.task_id as taskId, 
        t.project_id as projectId,
        n.is_read as isRead, 
        n.created_at as createdAt
      FROM user_notifications n
      LEFT JOIN tasks t ON n.task_id = t.id
      WHERE n.user_id = ${userId}
      ORDER BY n.created_at DESC
      LIMIT 50
    `;
    const sqlItems: UserNotificationItem[] = rows.map((r: any) => ({
      id: Number(r.id),
      userId: Number(r.userId),
      title: String(r.title || ''),
      message: String(r.message || ''),
      assignedBy: r.assignedBy || null,
      taskId: r.taskId ? Number(r.taskId) : null,
      projectId: r.projectId ? Number(r.projectId) : null,
      isRead: Boolean(r.isRead),
      createdAt: new Date(r.createdAt),
    }));
    return sqlItems;
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

export interface CreateDoneRequestNotificationParams {
  recipientUserId: number;
  taskId: number;
  taskTitle: string;
  requesterName: string;
}

/**
 * Creates an in-app notification for Owner/Admin when a task completion request is submitted.
 */
export async function createTaskDoneRequestNotification({
  recipientUserId,
  taskId,
  taskTitle,
  requesterName,
}: CreateDoneRequestNotificationParams) {
  if (!recipientUserId) return null;

  const title = 'Task Completion Request';
  const message = `${requesterName} requested to mark task "${taskTitle}" as Done.`;
  const userNotif = (prisma as any).userNotification;

  try {
    if (userNotif) {
      return await userNotif.create({
        data: {
          userId: recipientUserId,
          title,
          message,
          assignedBy: requesterName,
          taskId: taskId,
          isRead: false,
        },
      });
    }

    // Raw SQL Fallback if Prisma model is not yet dynamically bound
    await prisma.$executeRaw`
      INSERT INTO user_notifications (user_id, title, message, assigned_by, task_id, is_read, created_at)
      VALUES (${recipientUserId}, ${title}, ${message}, ${requesterName}, ${taskId}, false, NOW())
    `;
    return true;
  } catch (err) {
    console.error('Failed to create task done request notification:', err);
    return null;
  }
}

export interface CreateMentionNotificationParams {
  recipientUserId: number;
  taskId: number;
  taskNumber: string;
  taskTitle: string;
  commentSnippet: string;
  actorName: string;
}

/**
 * Creates an in-app notification when a user is mentioned (@tagged) in a task comment.
 */
export async function createMentionNotification({
  recipientUserId,
  taskId,
  taskNumber,
  taskTitle,
  commentSnippet,
  actorName,
}: CreateMentionNotificationParams) {
  if (!recipientUserId) return null;

  const title = `${actorName} mentioned you in a comment`;
  const cleanSnippet = commentSnippet.length > 100 ? commentSnippet.slice(0, 100) + '...' : commentSnippet;
  const message = `Task ${taskNumber}: "${taskTitle}"\nComment: ${cleanSnippet}`;
  const userNotif = (prisma as any).userNotification;

  try {
    if (userNotif) {
      return await userNotif.create({
        data: {
          userId: recipientUserId,
          title,
          message,
          assignedBy: actorName,
          taskId: taskId,
          isRead: false,
        },
      });
    }

    // Raw SQL Fallback if Prisma model is not yet dynamically bound
    await prisma.$executeRaw`
      INSERT INTO user_notifications (user_id, title, message, assigned_by, task_id, is_read, created_at)
      VALUES (${recipientUserId}, ${title}, ${message}, ${actorName}, ${taskId}, false, NOW())
    `;
    return true;
  } catch (err) {
    console.error('Failed to create mention notification:', err);
    return null;
  }
}


