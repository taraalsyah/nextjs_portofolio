import { pusherServer } from '@/lib/pusher-server';

export interface RealtimeTaskPayload {
  id: number;
  projectId: number;
  taskNumber?: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  assigneeId?: number | null;
  assignee?: { id: number; name: string } | null;
  categoryId?: number | null;
  category?: { id: number; name: string } | null;
  dueDate?: Date | string | null;
  updatedAt?: Date | string;
  action: 'created' | 'updated' | 'deleted';
}

/**
 * Triggers a real-time task update via Pusher server SDK to workspace/project subscribers.
 */
export async function triggerTaskRealtimeUpdate(
  projectId: number | null | undefined,
  action: 'created' | 'updated' | 'deleted',
  task: any
): Promise<boolean> {
  const targetProjectId = projectId ? Number(projectId) : (task?.projectId ? Number(task.projectId) : null);
  if (!targetProjectId || !task) return false;

  try {
    const channelName = `private-project-${targetProjectId}`;
    const eventName = `task:${action}`;

    const payload: RealtimeTaskPayload = {
      id: Number(task.id),
      projectId: Number(task.projectId || targetProjectId),
      taskNumber: task.taskNumber || `TASK-${task.id}`,
      title: String(task.title || ''),
      description: task.description || null,
      status: String(task.status || 'OPEN'),
      priority: String(task.priority || 'MEDIUM'),
      assigneeId: task.assigneeId ? Number(task.assigneeId) : null,
      assignee: task.assignee ? { id: Number(task.assignee.id), name: String(task.assignee.name) } : null,
      categoryId: task.categoryId ? Number(task.categoryId) : null,
      category: task.category ? { id: Number(task.category.id), name: String(task.category.name) } : null,
      dueDate: task.dueDate || null,
      updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : new Date().toISOString(),
      action,
    };

    await pusherServer.trigger(channelName, eventName, payload);
    return true;
  } catch (err) {
    console.error(`[Pusher Task Realtime Error] Failed to trigger event for project #${targetProjectId}:`, err);
    return false;
  }
}
