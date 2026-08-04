export const TASK_MUTATED_EVENT = 'TASK_MUTATED_EVENT';

export interface TaskMutatedDetail {
  taskId?: number;
  action?: string;
}

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
