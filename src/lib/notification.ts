import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mail';
import { formatActivityWIB } from '@/lib/date';

interface TaskNotificationParams {
  taskId: number;
  taskTitle: string;
  taskNumber: string;
  projectId: number;
  projectName: string;
  userTitle: string; // e.g. "Tara"
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string | null;
  actorUserId: number;
}

/**
 * Dispatches notifications for Task Close Request Approval Workflow.
 * Sends emails to relevant project members (Owner/Admin or Assignee).
 */
export async function sendTaskCloseNotification({
  taskId,
  taskTitle,
  taskNumber,
  projectId,
  projectName,
  userTitle,
  requestStatus,
  reason,
  actorUserId,
}: TaskNotificationParams) {
  try {
    const timestamp = formatActivityWIB(new Date());

    if (requestStatus === 'PENDING') {
      const ownerAndAdmins = await prisma.projectMember.findMany({
        where: {
          projectId,
          role: { in: ['OWNER', 'ADMIN'] },
          userId: { not: actorUserId },
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      const subject = `[Close Request] ${taskNumber} - ${taskTitle}`;
      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Permintaan Penutupan Task (Request to Close)</h2>
          <p>Halo,</p>
          <p><strong>${userTitle}</strong> mengajukan permintaan untuk menutup task berikut:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; width: 140px;"><strong>Task ID / No:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskNumber}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Judul Task:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Proyek:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status Request:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold;">WAITING OWNER APPROVAL</span></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Pemohon:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${userTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Waktu:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td></tr>
            ${reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Alasan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason}</td></tr>` : ''}
          </table>
          <p>Silakan tinjau dan berikan keputusan (Setujui / Tolak) melalui halaman Task Management.</p>
        </div>
      `;

      for (const member of ownerAndAdmins) {
        if (member.user?.email) {
          sendEmail({
            to: member.user.email,
            subject,
            html: bodyHtml,
          }).catch((err) => console.error(`Failed sending close request email to ${member.user.email}:`, err));
        }
      }
    } else if (requestStatus === 'APPROVED' || requestStatus === 'REJECTED') {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          assignee: { select: { id: true, email: true, name: true } },
          closeRequestedBy: { select: { id: true, email: true, name: true } },
        },
      });

      const recipient = task?.closeRequestedBy || task?.assignee;

      if (recipient?.email) {
        const isApproved = requestStatus === 'APPROVED';
        const subject = `[Close Request ${isApproved ? 'Approved' : 'Rejected'}] ${taskNumber} - ${taskTitle}`;
        const statusBadge = isApproved
          ? '<span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold;">APPROVED (Closed)</span>'
          : '<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-weight: bold;">REJECTED (Done)</span>';

        const bodyHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: ${isApproved ? '#166534' : '#991b1b'};">Close Request ${isApproved ? 'Disetujui' : 'Ditolak'}</h2>
            <p>Halo <strong>${recipient.name}</strong>,</p>
            <p>Permintaan penutupan task Anda oleh <strong>${userTitle}</strong> telah ditinjau:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; width: 140px;"><strong>Task ID / No:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskNumber}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Judul Task:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Proyek:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Keputusan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${statusBadge}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Peninjau:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${userTitle}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Waktu:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td></tr>
              ${reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Alasan Penolakan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason}</td></tr>` : ''}
            </table>
          </div>
        `;

        sendEmail({
          to: recipient.email,
          subject,
          html: bodyHtml,
        }).catch((err) => console.error(`Failed sending close review email to ${recipient.email}:`, err));
      }
    }
  } catch (err) {
    console.error('Error sending task close notification:', err);
  }
}

/**
 * Dispatches notifications for Task Done Request Approval Workflow.
 */
export async function sendTaskDoneNotification({
  taskId,
  taskTitle,
  taskNumber,
  projectId,
  projectName,
  userTitle,
  requestStatus,
  reason,
  actorUserId,
}: TaskNotificationParams) {
  try {
    const timestamp = formatActivityWIB(new Date());

    if (requestStatus === 'PENDING') {
      // 1. Notify Task Owner and Project Admin
      const ownerAndAdmins = await prisma.projectMember.findMany({
        where: {
          projectId,
          role: { in: ['OWNER', 'ADMIN'] },
          userId: { not: actorUserId },
        },
        include: {
          user: { select: { id: true, email: true, name: true } },
        },
      });

      const subject = `[Done Request] ${taskNumber} - ${taskTitle}`;
      const messageText = `${userTitle} requested approval to mark Task '${taskTitle}' as Done.`;

      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Permintaan Penyelesaian Task (Request to Done)</h2>
          <p>Halo,</p>
          <p><strong>${messageText}</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; width: 140px;"><strong>Task ID / No:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskNumber}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Judul Task:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Proyek:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status Request:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold;">WAITING OWNER APPROVAL</span></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Pemohon:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${userTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Waktu:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td></tr>
            ${reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Catatan Penyelesaian:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason}</td></tr>` : ''}
          </table>
          <p>Silakan tinjau dan berikan keputusan (Setujui / Tolak) melalui halaman Task Management.</p>
        </div>
      `;

      for (const member of ownerAndAdmins) {
        if (member.user?.email) {
          sendEmail({
            to: member.user.email,
            subject,
            html: bodyHtml,
          }).catch((err) => console.error(`Failed sending done request email to ${member.user.email}:`, err));
        }
      }
    } else if (requestStatus === 'APPROVED' || requestStatus === 'REJECTED') {
      // 2. Notify Assignee of the Task
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: {
          assignee: { select: { id: true, email: true, name: true } },
          doneRequestedBy: { select: { id: true, email: true, name: true } },
        },
      });

      const recipient = task?.doneRequestedBy || task?.assignee;

      if (recipient?.email) {
        const isApproved = requestStatus === 'APPROVED';
        const subject = `[Done Request ${isApproved ? 'Approved' : 'Rejected'}] ${taskNumber} - ${taskTitle}`;
        const messageText = isApproved
          ? 'Your request has been approved. Task status has been updated to Done.'
          : 'Your request has been rejected.';

        const statusBadge = isApproved
          ? '<span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-weight: bold;">APPROVED (Done)</span>'
          : '<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-weight: bold;">REJECTED (In Progress)</span>';

        const bodyHtml = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: ${isApproved ? '#166534' : '#991b1b'};">Done Request ${isApproved ? 'Disetujui' : 'Ditolak'}</h2>
            <p>Halo <strong>${recipient.name}</strong>,</p>
            <p><strong>${messageText}</strong></p>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; width: 140px;"><strong>Task ID / No:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskNumber}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Judul Task:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Proyek:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Keputusan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${statusBadge}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Peninjau:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${userTitle}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Waktu:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td></tr>
              ${reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Alasan Penolakan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason}</td></tr>` : ''}
            </table>
          </div>
        `;

        sendEmail({
          to: recipient.email,
          subject,
          html: bodyHtml,
        }).catch((err) => console.error(`Failed sending done review email to ${recipient.email}:`, err));
      }
    }
  } catch (err) {
    console.error('Error sending task done notification:', err);
  }
}
