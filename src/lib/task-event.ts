export const TASK_MUTATED_EVENT = 'TASK_MUTATED_EVENT';

export const TASK_EVENT_TYPES = {
  CREATED: 'TASK_CREATED_EVENT',
  UPDATED: 'TASK_UPDATED_EVENT',
  DELETED: 'TASK_DELETED_EVENT',
} as const;

export interface TaskMutatedDetail {
  taskId?: number;
  action?: string;
}

export interface TaskEventPayload {
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
 * Custom EventBus adapter for non-React decoupling
 */
export const TaskEventBus = {
  emit(eventType: string, payload: TaskEventPayload) {
    if (typeof window !== 'undefined') {
      console.log(`2. EventBus emitted [${eventType}]:`, payload);
      window.dispatchEvent(
        new CustomEvent<TaskEventPayload>(eventType, { detail: payload })
      );
    }
  },

  on(eventType: string, callback: (payload: TaskEventPayload) => void) {
    if (typeof window === 'undefined') return () => {};

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<TaskEventPayload>;
      if (customEvent.detail) {
        console.log(`3. Context received [${eventType}]:`, customEvent.detail);
        callback(customEvent.detail);
      }
    };

    window.addEventListener(eventType, handler);
    return () => window.removeEventListener(eventType, handler);
  },
};

/**
 * Dispatches an event notifying the application that task data has changed,
 * so list views can automatically refresh their data silently.
 */
export function notifyTaskMutated(taskId?: number, action?: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<TaskMutatedDetail>(TASK_MUTATED_EVENT, {
        detail: { taskId, action },
      })
    );
  }
}
