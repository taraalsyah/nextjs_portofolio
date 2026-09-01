import prisma from '@/lib/prisma';
import emailService from '@/services/email/email.service';

export interface OverdueTaskResultItem {
  taskId: number;
  taskNumber: string;
  title: string;
  dueDate: string;
  status: string;
  recipients: string[];
  sentSuccess: boolean;
}

export interface ProcessOverdueResult {
  success: boolean;
  checked: number;
  overdue: number;
  emailsSent: number;
  emailsFailed: number;
  skipped: number;
  details?: OverdueTaskResultItem[];
}

function formatIndonesianDate(date: Date | null): string {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 16).replace('T', ' ');
  }
}

/**
 * Helper to execute Prisma DB operations with limited retries for transient connection errors.
 */
async function withDbRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  delayMs = 1000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || String(error);
      const isConnectionError =
        errorMessage.includes("Can't reach database server") ||
        errorMessage.includes('P1001') ||
        errorMessage.includes('P1002') ||
        errorMessage.includes('P1008') ||
        errorMessage.includes('P1017') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('connection pool') ||
        errorMessage.includes('Client has already been destroyed');

      if (isConnectionError && attempt <= maxRetries) {
        console.warn('[CRON] Database connection failed');
        console.warn(`[CRON] Retry attempt ${attempt}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        continue;
      }

      if (isConnectionError && attempt > maxRetries) {
        console.error('[CRON] Database connection failed');
        console.error('[CRON] Retry attempt 1/2');
        console.error('[CRON] Retry attempt 2/2');
        console.error('[CRON] Database unavailable, cron terminated gracefully');
      }
      throw error;
    }
  }
}

export class TaskOverdueService {
  /**
   * Automatic check and email notifications for overdue tasks.
   * Only processes tasks where:
   * 1. Has due date (dueDate IS NOT NULL).
   * 2. Due date has passed (dueDate < now).
   * 3. Status is not DONE (status != 'DONE').
   * 4. overdueNotifiedAt IS NULL.
   * 5. Task is not deleted or locked.
   *
   * Recipient logic:
   * - All Users with role Admin.
   * - Task Assignee.
   * - Deduplicated by normalized email.
   * - Concurrency atomic claim lock to prevent race conditions.
   */
  async processOverdueTasks(): Promise<ProcessOverdueResult> {
    const cronStartTime = performance.now();
    const now = new Date();
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tasktuntas.com';

    console.log('[CRON] Overdue task check started');

    // 1. Fetch checked count and overdue tasks with transient DB retry & timing
    console.log('[CRON] Database query started');
    const dbQueryStartTime = performance.now();

    const [checkedCount, overdueTasks] = await withDbRetry(async () => {
      return await Promise.all([
        prisma.task.count({
          where: {
            dueDate: {
              not: null,
            },
            deletedAt: null,
            status: {
              notIn: ['DONE', 'Done', 'done'],
            },
          },
        }),
        prisma.task.findMany({
          where: {
            dueDate: {
              lt: now,
            },
            overdueNotifiedAt: null,
            status: {
              notIn: ['DONE', 'Done', 'done'],
            },
            isLocked: false,
            deletedAt: null,
          },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
            assignee: {
              select: { id: true, name: true, email: true },
            },
            project: {
              select: {
                id: true,
                projectName: true,
                owner: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        }),
      ]);
    });

    const dbQueryDuration = Math.round(performance.now() - dbQueryStartTime);
    const overdueCount = overdueTasks.length;
    const skippedCount = Math.max(0, checkedCount - overdueCount);

    console.log(`[CRON] Database query completed in ${dbQueryDuration}ms`);
    console.log(`[CRON] Found ${overdueCount} candidate tasks`);
    console.log('[CRON] Existing due-time rules processed');

    // Early exit if 0 overdue tasks (saves lazy DB queries & email work)
    if (overdueCount === 0) {
      console.log('[CRON] 0 notifications should be sent');
      console.log('[CRON] Email processing completed in 0ms');
      const totalDuration = Math.round(performance.now() - cronStartTime);
      console.log(`[CRON] Overdue task check completed in ${totalDuration}ms`);

      return {
        success: true,
        checked: checkedCount,
        overdue: 0,
        emailsSent: 0,
        emailsFailed: 0,
        skipped: skippedCount,
        details: [],
      };
    }

    // 2. Fetch Admin users lazily (only when overdue tasks exist)
    const adminUsers = await withDbRetry(async () => {
      return await prisma.user.findMany({
        where: {
          OR: [
            { role: { equals: 'admin' } },
            { role: { equals: 'Admin' } },
            { role: { equals: 'ADMIN' } },
            { role: { equals: 'superadmin' } },
            { role: { equals: 'Super Admin' } },
            { roleRel: { name: { contains: 'admin' } } },
            { roleRel: { name: { contains: 'Admin' } } },
          ],
          NOT: {
            email: '',
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });
    });

    const details: OverdueTaskResultItem[] = [];
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;
    let totalNotificationsToSend = 0;

    const emailStartTime = performance.now();

    // 3. Process overdue tasks in chunks/batching for memory & speed efficiency
    const BATCH_SIZE = 50;
    for (let i = 0; i < overdueTasks.length; i += BATCH_SIZE) {
      const taskBatch = overdueTasks.slice(i, i + BATCH_SIZE);

      for (const task of taskBatch) {
        try {
          // Collect recipient users: All Admins + Task Assignee
          const rawRecipients: Array<{ id: number; name: string; email: string }> = [...adminUsers];

          if (task.assignee && task.assignee.email) {
            rawRecipients.push({
              id: task.assignee.id,
              name: task.assignee.name || 'Assignee',
              email: task.assignee.email,
            });
          }

          // Deduplicate recipients by normalized email
          const uniqueRecipientsMap = new Map<string, { id: number; name: string; email: string }>();

          for (const recipient of rawRecipients) {
            if (!recipient.email || typeof recipient.email !== 'string') continue;
            const normalizedEmail = recipient.email.toLowerCase().trim();
            if (!normalizedEmail || !normalizedEmail.includes('@')) continue;

            if (!uniqueRecipientsMap.has(normalizedEmail)) {
              uniqueRecipientsMap.set(normalizedEmail, {
                id: recipient.id,
                name: recipient.name || 'User',
                email: normalizedEmail,
              });
            }
          }

          const uniqueRecipients = Array.from(uniqueRecipientsMap.values());

          // Scenario F / No recipients case: Do NOT mark sent if no valid email recipients
          if (uniqueRecipients.length === 0) {
            console.log(`[CRON] Skip task ${task.taskNumber} (ID: ${task.id}): Tidak ada recipient email yang valid.`);
            continue;
          }

          totalNotificationsToSend += uniqueRecipients.length;

          // Atomic claim lock to protect against concurrent cron executions
          const claimResult = await withDbRetry(() =>
            prisma.task.updateMany({
              where: {
                id: task.id,
                overdueNotifiedAt: null,
              },
              data: {
                overdueNotifiedAt: now,
              },
            })
          );

          if (claimResult.count === 0) {
            // Task was already claimed by a concurrent process
            console.log(`[CRON] Task ${task.taskNumber} already claimed by another cron execution.`);
            continue;
          }

          const formattedDueDate = formatIndonesianDate(task.dueDate);
          const ownerName = task.createdBy?.name || task.project?.owner?.name || 'Owner';
          const assigneeName = task.assignee?.name || 'Belum di-assign (Unassigned)';
          const projectName = task.project?.projectName || 'Tidak ada project';
          const taskDetailUrl = `${baseUrl}/dashboard/task-management`;

          let taskEmailsSent = 0;
          let taskEmailsFailed = 0;
          const sentRecipients: string[] = [];

          // Parallelized email delivery per task for high speed and throughput
          const emailPromises = uniqueRecipients.map((recipient) =>
            emailService
              .sendOverdueTaskEmail({
                to: recipient.email,
                recipientName: recipient.name,
                taskNumber: task.taskNumber,
                taskTitle: task.title,
                assigneeName,
                ownerName,
                projectName,
                priority: task.priority || 'MEDIUM',
                dueDate: formattedDueDate,
                status: task.status,
                taskDetailUrl,
              })
              .then((res) => ({ recipientEmail: recipient.email, res }))
          );

          const emailResults = await Promise.allSettled(emailPromises);

          for (const result of emailResults) {
            if (result.status === 'fulfilled' && result.value.res.success) {
              taskEmailsSent++;
              sentRecipients.push(result.value.recipientEmail);
            } else {
              taskEmailsFailed++;
              if (result.status === 'rejected') {
                console.error(`[CRON] Failed task ID: ${task.taskNumber}`);
                console.error(`[CRON] Error sending email:`, result.reason?.message || result.reason);
              }
            }
          }

          totalEmailsSent += taskEmailsSent;
          totalEmailsFailed += taskEmailsFailed;

          // If no email was successfully sent, rollback overdueNotifiedAt so it can be retried
          if (taskEmailsSent === 0) {
            await withDbRetry(() =>
              prisma.task.update({
                where: { id: task.id },
                data: { overdueNotifiedAt: null },
              })
            );
            console.log(`[CRON] Task ${task.taskNumber}: Semua email gagal dikirim. Resetting overdueNotifiedAt ke NULL.`);
          }

          details.push({
            taskId: task.id,
            taskNumber: task.taskNumber,
            title: task.title,
            dueDate: formattedDueDate,
            status: task.status,
            recipients: sentRecipients,
            sentSuccess: taskEmailsSent > 0,
          });
        } catch (taskErr: any) {
          console.error(`[CRON] Failed task ID: ${task.taskNumber}`);
          console.error(`[CRON] Error processing task ${task.id}:`, taskErr?.message || taskErr);
        }
      }
    }

    console.log(`[CRON] ${totalNotificationsToSend} notifications should be sent`);
    const emailDuration = Math.round(performance.now() - emailStartTime);
    console.log(`[CRON] Email processing completed in ${emailDuration}ms`);

    console.log(`[CRON] Emails sent: ${totalEmailsSent}`);
    console.log(`[CRON] Emails failed: ${totalEmailsFailed}`);

    const totalDuration = Math.round(performance.now() - cronStartTime);
    console.log(`[CRON] Overdue task check completed in ${totalDuration}ms`);

    return {
      success: true,
      checked: checkedCount,
      overdue: overdueCount,
      emailsSent: totalEmailsSent,
      emailsFailed: totalEmailsFailed,
      skipped: skippedCount,
      details,
    };
  }
}

export const taskOverdueService = new TaskOverdueService();
export default taskOverdueService;
