import { prisma } from '@/lib/prisma';
import { ActivityAction } from '@/lib/activity';

export type TaskStatus = 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const TASK_STATUSES: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'BACKLOG', label: 'Backlog', color: 'hsl(215, 20%, 65%)' },
  { key: 'OPEN', label: 'Open', color: 'hsl(210, 90%, 70%)' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'hsl(38, 95%, 65%)' },
  { key: 'DONE', label: 'Done', color: 'hsl(145, 80%, 65%)' },
];

export const TASK_PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: 'LOW', label: 'Low', color: 'hsl(210, 80%, 75%)' },
  { key: 'MEDIUM', label: 'Medium', color: 'hsl(38, 90%, 70%)' },
  { key: 'HIGH', label: 'High', color: 'hsl(15, 90%, 70%)' },
  { key: 'CRITICAL', label: 'Critical', color: 'hsl(350, 90%, 75%)' },
];

/**
 * Generates the next unique Task Number in the TSK-000001 format.
 */
export async function generateNextTaskNumber(tx?: any): Promise<string> {
  const db = tx || prisma;

  const lastTaskById = await db.task.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true, taskNumber: true },
  });

  const lastTaskByNumber = await db.task.findFirst({
    orderBy: { taskNumber: 'desc' },
    select: { id: true, taskNumber: true },
  });

  let maxNum = 0;

  if (lastTaskById) {
    maxNum = Math.max(maxNum, lastTaskById.id);
    if (lastTaskById.taskNumber && lastTaskById.taskNumber.startsWith('TSK-')) {
      const parsed = parseInt(lastTaskById.taskNumber.replace('TSK-', ''), 10);
      if (!isNaN(parsed)) {
        maxNum = Math.max(maxNum, parsed);
      }
    }
  }

  if (lastTaskByNumber && lastTaskByNumber.taskNumber && lastTaskByNumber.taskNumber.startsWith('TSK-')) {
    const parsed = parseInt(lastTaskByNumber.taskNumber.replace('TSK-', ''), 10);
    if (!isNaN(parsed)) {
      maxNum = Math.max(maxNum, parsed);
    }
  }

  let nextNum = maxNum + 1;
  let candidate = `TSK-${String(nextNum).padStart(6, '0')}`;

  let existing = await db.task.findUnique({
    where: { taskNumber: candidate },
    select: { id: true },
  });

  while (existing) {
    nextNum++;
    candidate = `TSK-${String(nextNum).padStart(6, '0')}`;
    existing = await db.task.findUnique({
      where: { taskNumber: candidate },
      select: { id: true },
    });
  }

  return candidate;
}

/**
 * Validates whether a workflow status transition is allowed.
 */
export function isValidStatusTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowedMap: Record<string, string[]> = {
    BACKLOG: ['OPEN', 'IN_PROGRESS', 'DONE'],
    OPEN: ['BACKLOG', 'IN_PROGRESS', 'DONE'],
    IN_PROGRESS: ['OPEN', 'BACKLOG', 'DONE'],
    DONE: ['IN_PROGRESS', 'OPEN', 'BACKLOG'],
  };
  return allowedMap[currentStatus]?.includes(nextStatus) ?? true;
}

/**
 * Helper to log task activity inside an existing or new Prisma Transaction.
 */
export async function logTaskActivity({
  taskId,
  userId,
  action,
  description,
  fieldName,
  previousValue,
  newValue,
  ipAddress,
  userAgent,
  tx,
}: {
  taskId: number;
  userId: number;
  action: ActivityAction | string;
  description: string;
  fieldName?: string;
  previousValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  tx?: any;
}) {
  const db = tx || prisma;

  let globalAction: ActivityAction = 'UPDATE';
  if (action === 'TASK_CREATED') globalAction = 'CREATE';
  if (action === 'TASK_DELETED') globalAction = 'DELETE';

  // Perform atomic multi-table write inside Prisma Transaction
  await db.taskHistory.create({
    data: {
      taskId,
      userId,
      action: String(action),
      fieldName,
      previousValue,
      newValue,
    },
  });

  await db.activityLog.create({
    data: {
      userId,
      action: globalAction,
      description: `Task Activity: ${description}`,
      ipAddress,
      userAgent,
    },
  });
}
