import { prisma } from '@/lib/prisma';
import { logTaskActivity } from '@/lib/task';

export interface StartScheduledTaskItem {
  taskId: number;
  taskNumber: string;
  title: string;
  startDate: string;
  status: string;
  success: boolean;
}

export interface StartScheduledTasksResult {
  success: boolean;
  checked: number;
  processed: number;
  started: number;
  skipped: number;
  failed: number;
  durationMs: number;
  details?: StartScheduledTaskItem[];
}

export class TaskStartScheduledService {
  /**
   * Automatically start scheduled tasks whose startDate has arrived.
   * Only processes tasks where:
   * 1. Status is BACKLOG.
   * 2. Has Start Date (startDate IS NOT NULL).
   * 3. Start Date has arrived or passed (startDate <= now).
   * 4. Task is not deleted (deletedAt IS NULL).
   *
   * Idempotency & Race Condition Safety:
   * Uses conditional updateMany (where: { id, status: 'BACKLOG' }) to ensure atomic transition
   * and prevent double execution or duplicate activity logging.
   */
  async startScheduledTasks(): Promise<StartScheduledTasksResult> {
    const cronStartTime = performance.now();
    const now = new Date();

    console.log('[CRON START TASK] Scheduled task start process initiated');

    // 1. Query eligible BACKLOG tasks
    const eligibleTasks = await prisma.task.findMany({
      where: {
        status: 'BACKLOG',
        startDate: {
          not: null,
          lte: now,
        },
        deletedAt: null,
      },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        startDate: true,
        createdById: true,
        assigneeId: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const checkedCount = eligibleTasks.length;
    console.log(`[CRON START TASK] Found ${checkedCount} candidate BACKLOG tasks ready to start`);

    if (checkedCount === 0) {
      const totalDuration = Math.round(performance.now() - cronStartTime);
      console.log(`[CRON START TASK] 0 tasks required transition. Completed in ${totalDuration}ms`);

      return {
        success: true,
        checked: 0,
        processed: 0,
        started: 0,
        skipped: 0,
        failed: 0,
        durationMs: totalDuration,
        details: [],
      };
    }

    let startedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const details: StartScheduledTaskItem[] = [];

    // 2. Batch processing (50 tasks per chunk) for safe memory usage
    const BATCH_SIZE = 50;
    for (let i = 0; i < eligibleTasks.length; i += BATCH_SIZE) {
      const batch = eligibleTasks.slice(i, i + BATCH_SIZE);

      for (const task of batch) {
        try {
          // Atomic update condition: only update if status is STILL 'BACKLOG'
          const updateResult = await prisma.task.updateMany({
            where: {
              id: task.id,
              status: 'BACKLOG',
              deletedAt: null,
            },
            data: {
              status: 'OPEN',
              updatedAt: now,
            },
          });

          if (updateResult.count === 0) {
            // Task was already transitioned by a concurrent process
            skippedCount++;
            console.log(`[CRON START TASK] Task ${task.taskNumber} (ID: ${task.id}) already transitioned by another process. Skipping.`);
            continue;
          }

          startedCount++;

          // Log task activity history
          const actorUserId = task.createdById || task.assigneeId || 1;
          await logTaskActivity({
            taskId: task.id,
            userId: actorUserId,
            action: 'STATUS_CHANGE',
            description: `Automatic Scheduled Start: Status task ${task.taskNumber} ("${task.title}") otomatis berubah dari BACKLOG ke OPEN berdasarkan jadwal Start Date & Time.`,
            fieldName: 'status',
            previousValue: 'BACKLOG',
            newValue: 'OPEN',
          });

          console.log(`[CRON START TASK] Task ${task.taskNumber} (ID: ${task.id}) successfully transitioned BACKLOG → OPEN`);

          details.push({
            taskId: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            startDate: task.startDate ? task.startDate.toISOString() : '',
            status: 'OPEN',
            success: true,
          });
        } catch (err: any) {
          failedCount++;
          console.error(`[CRON START TASK] Error transitioning task ${task.taskNumber} (ID: ${task.id}):`, err?.message || err);
          details.push({
            taskId: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            startDate: task.startDate ? task.startDate.toISOString() : '',
            status: 'BACKLOG',
            success: false,
          });
        }
      }
    }

    const durationMs = Math.round(performance.now() - cronStartTime);
    console.log(`[CRON START TASK] Process completed: ${startedCount} started, ${skippedCount} skipped, ${failedCount} failed in ${durationMs}ms`);

    return {
      success: true,
      checked: checkedCount,
      processed: checkedCount,
      started: startedCount,
      skipped: skippedCount,
      failed: failedCount,
      durationMs,
      details,
    };
  }
}

export const taskStartScheduledService = new TaskStartScheduledService();
export default taskStartScheduledService;
