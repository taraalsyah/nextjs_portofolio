'use client';

import { useEffect } from 'react';
import { getPusherClient } from '@/lib/pusher-client';
import { TaskEventBus, TASK_EVENT_TYPES, TaskEventPayload, notifyTaskMutated } from '@/lib/task-event';

interface UseTaskRealtimeOptions {
  projectId?: number;
  onTaskUpdated?: (updatedTask: TaskEventPayload) => void;
  onTaskCreated?: (newTask: TaskEventPayload) => void;
  onTaskDeleted?: (deletedTask: TaskEventPayload) => void;
}

/**
 * Custom React Hook to subscribe to Pusher project channels (non-React layer)
 * and listen to the Custom EventBus with automatic cleanup to prevent memory leaks.
 */
export function useTaskRealtime({
  projectId,
  onTaskUpdated,
  onTaskCreated,
  onTaskDeleted,
}: UseTaskRealtimeOptions = {}) {
  // 1. Pusher Subscription & EventBus Emitting (Non-React Coupling Layer)
  useEffect(() => {
    if (!projectId) return;

    const channelName = `private-project-${projectId}`;
    let client: any = null;

    try {
      client = getPusherClient();
      const channel = client.subscribe(channelName);

      // Pusher -> Custom EventBus Emits
      channel.bind('task:created', (data: TaskEventPayload) => {
        console.log('1. Pusher received (task:created):', data);
        TaskEventBus.emit(TASK_EVENT_TYPES.CREATED, data);
        notifyTaskMutated(data.id, 'created');
      });

      channel.bind('task:updated', (data: TaskEventPayload) => {
        console.log('1. Pusher received (task:updated):', data);
        TaskEventBus.emit(TASK_EVENT_TYPES.UPDATED, data);
        notifyTaskMutated(data.id, 'updated');
      });

      channel.bind('task:deleted', (data: TaskEventPayload) => {
        console.log('1. Pusher received (task:deleted):', data);
        TaskEventBus.emit(TASK_EVENT_TYPES.DELETED, data);
        notifyTaskMutated(data.id, 'deleted');
      });

      // Cleanup Pusher bindings and unsubscribe on unmount
      return () => {
        try {
          channel.unbind('task:created');
          channel.unbind('task:updated');
          channel.unbind('task:deleted');
          client.unsubscribe(channelName);
        } catch {
          // noop
        }
      };
    } catch (err) {
      console.warn('[Pusher Task Subscription Error]:', err);
    }
  }, [projectId]);

  // 2. React EventBus Listener (React Logic with Cleanup)
  useEffect(() => {
    const unsubUpdate = onTaskUpdated
      ? TaskEventBus.on(TASK_EVENT_TYPES.UPDATED, onTaskUpdated)
      : undefined;

    const unsubCreate = onTaskCreated
      ? TaskEventBus.on(TASK_EVENT_TYPES.CREATED, onTaskCreated)
      : undefined;

    const unsubDelete = onTaskDeleted
      ? TaskEventBus.on(TASK_EVENT_TYPES.DELETED, onTaskDeleted)
      : undefined;

    return () => {
      if (unsubUpdate) unsubUpdate();
      if (unsubCreate) unsubCreate();
      if (unsubDelete) unsubDelete();
    };
  }, [onTaskUpdated, onTaskCreated, onTaskDeleted]);
}
