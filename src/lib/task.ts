import { prisma } from '@/lib/prisma';
import { createActivityLog, ActivityAction } from '@/lib/activity';

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
export async function generateNextTaskNumber(): Promise<string> {
  const lastTask = await prisma.task.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true, taskNumber: true },
  });

  if (!lastTask) {
    return 'TSK-000001';
  }

  // Parse numeric part from last task number or last ID
  let nextNum = lastTask.id + 1;
  if (lastTask.taskNumber && lastTask.taskNumber.startsWith('TSK-')) {
    const parsed = parseInt(lastTask.taskNumber.replace('TSK-', ''), 10);
    if (!isNaN(parsed) && parsed >= nextNum) {
      nextNum = parsed + 1;
    }
  }

  return `TSK-${String(nextNum).padStart(6, '0')}`;
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
 * Helper to log task mutation to both TaskHistory and global ActivityLog.
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
}) {
  // 1. Record in per-task history
  await prisma.taskHistory.create({
    data: {
      taskId,
      userId,
      action: String(action),
      fieldName,
      previousValue,
      newValue,
    },
  });

  // 2. Record in global Activity History module
  let globalAction: ActivityAction = 'UPDATE';
  if (action === 'TASK_CREATED') globalAction = 'CREATE';
  if (action === 'TASK_DELETED') globalAction = 'DELETE';

  await createActivityLog({
    userId,
    action: globalAction,
    description: `Task Activity: ${description}`,
    ipAddress,
    userAgent,
  });
}
