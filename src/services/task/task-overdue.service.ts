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
  checkedCount: number;
  notifiedCount: number;
  totalEmailsSent: number;
  details: OverdueTaskResultItem[];
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
    }).format(new Date(date));
  } catch {
    return new Date(date).toISOString().slice(0, 16).replace('T', ' ');
  }
}

export class TaskOverdueService {
  /**
   * Pengecekan otomatis dan pengiriman email notifikasi overdue task.
   * Hanya mengirim email jika:
   * 1. Due date sudah terlampaui (dueDate < now).
   * 2. Status belum DONE atau CLOSED.
   * 3. Belum pernah dikirimi email overdue (overdueNotifiedAt IS NULL).
   * 4. Task tidak di-delete / locked.
   *
   * Recipient (Owner & Assignee) di-deduplikasi sehingga jika user-nya sama, hanya menerima 1 email.
   */
  async processOverdueTasks(): Promise<ProcessOverdueResult> {
    const now = new Date();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    // Fetch overdue tasks eligible for notification
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },
        overdueNotifiedAt: null,
        status: {
          notIn: ['DONE', 'CLOSED'],
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
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    const details: OverdueTaskResultItem[] = [];
    let notifiedCount = 0;
    let totalEmailsSent = 0;

    for (const task of overdueTasks) {
      const owner = task.createdBy || task.project?.owner;
      const assignee = task.assignee;

      // Collect recipient email mapping to avoid duplicate emails for the same user
      const recipientMap = new Map<string, string>(); // email -> name

      if (owner?.email) {
        recipientMap.set(owner.email.toLowerCase().trim(), owner.name || 'Owner');
      }

      if (assignee?.email) {
        recipientMap.set(assignee.email.toLowerCase().trim(), assignee.name || 'Assignee');
      }

      const formattedDueDate = formatIndonesianDate(task.dueDate);
      const ownerName = owner?.name || 'Owner';
      const assigneeName = assignee?.name || 'Belum di-assign (Unassigned)';
      const taskDetailUrl = `${baseUrl}/dashboard/task-management`;

      let taskEmailsSent = 0;
      const sentRecipients: string[] = [];

      for (const [email, name] of recipientMap.entries()) {
        try {
          const res = await emailService.sendOverdueTaskEmail({
            to: email,
            recipientName: name,
            taskNumber: task.taskNumber,
            taskTitle: task.title,
            assigneeName,
            ownerName,
            dueDate: formattedDueDate,
            status: task.status,
            taskDetailUrl,
          });

          if (res.success) {
            taskEmailsSent++;
            sentRecipients.push(email);
          }
        } catch (err) {
          console.error(`[TaskOverdueService] Gagal mengirim email overdue ke ${email} untuk task ${task.taskNumber}:`, err);
        }
      }

      // Record overdue_notified_at to prevent repeated notification on future scheduler runs
      await prisma.task.update({
        where: { id: task.id },
        data: {
          overdueNotifiedAt: now,
        },
      });

      notifiedCount++;
      totalEmailsSent += taskEmailsSent;

      details.push({
        taskId: task.id,
        taskNumber: task.taskNumber,
        title: task.title,
        dueDate: formattedDueDate,
        status: task.status,
        recipients: sentRecipients,
        sentSuccess: taskEmailsSent > 0,
      });
    }

    return {
      success: true,
      checkedCount: overdueTasks.length,
      notifiedCount,
      totalEmailsSent,
      details,
    };
  }
}

export const taskOverdueService = new TaskOverdueService();
export default taskOverdueService;
