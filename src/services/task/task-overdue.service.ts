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
    const now = new Date();
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL || 'https://tasktuntas.com';

    console.log('[CRON] Overdue task check started');

    // 1. Fetch all Admin users
    const adminUsers = await prisma.user.findMany({
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

    // 2. Count total checked tasks (non-deleted, has dueDate, status != 'DONE')
    const checkedCount = await prisma.task.count({
      where: {
        dueDate: {
          not: null,
        },
        deletedAt: null,
        status: {
          notIn: ['DONE', 'Done', 'done'],
        },
      },
    });

    // 3. Fetch overdue tasks eligible for notification
    const overdueTasks = await prisma.task.findMany({
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
    });

    const overdueCount = overdueTasks.length;
    const skippedCount = Math.max(0, checkedCount - overdueCount);

    console.log(`[CRON] Checked: ${checkedCount} tasks`);
    console.log(`[CRON] Overdue: ${overdueCount} tasks`);

    const details: OverdueTaskResultItem[] = [];
    let totalEmailsSent = 0;
    let totalEmailsFailed = 0;

    for (const task of overdueTasks) {
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

        // Atomic claim lock to protect against concurrent cron executions
        const claimResult = await prisma.task.updateMany({
          where: {
            id: task.id,
            overdueNotifiedAt: null,
          },
          data: {
            overdueNotifiedAt: now,
          },
        });

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

        for (const recipient of uniqueRecipients) {
          try {
            const res = await emailService.sendOverdueTaskEmail({
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
            });

            if (res.success) {
              taskEmailsSent++;
              sentRecipients.push(recipient.email);
            } else {
              taskEmailsFailed++;
            }
          } catch (err: any) {
            taskEmailsFailed++;
            console.error(`[CRON] Failed task ID: ${task.taskNumber}`);
            console.error(`[CRON] Error sending email to ${recipient.email}:`, err?.message || err);
          }
        }

        totalEmailsSent += taskEmailsSent;
        totalEmailsFailed += taskEmailsFailed;

        // If no email was successfully sent, rollback overdueNotifiedAt so it can be retried
        if (taskEmailsSent === 0) {
          await prisma.task.update({
            where: { id: task.id },
            data: { overdueNotifiedAt: null },
          });
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

    console.log(`[CRON] Emails sent: ${totalEmailsSent}`);
    console.log(`[CRON] Emails failed: ${totalEmailsFailed}`);
    console.log('[CRON] Overdue task check completed');

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
