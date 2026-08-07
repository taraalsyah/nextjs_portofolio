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
      // Retrieve Project Owner strictly via relation: Task -> Project -> Project Owner
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          projectName: true,
          ownerUserId: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!project) {
        console.error(`[Request to Close Error] Project ID #${projectId} not found.`);
        return;
      }

      const owner = project.owner;
      if (!owner || !owner.email) {
        console.error(
          `[Request to Close Error] Task ${taskNumber} (Project ID: ${projectId}, Name: "${project.projectName}"): Project Owner (ID: ${project.ownerUserId}) has no valid email address. Email notification skipped. No fallback recipients used.`
        );
        return;
      }

      // Safe debug logging (Requirement #13)
      console.log('Request to Close');
      console.log(`Task: ${taskNumber}`);
      console.log(`Project: ${project.projectName}`);
      console.log(`Project Owner ID: ${project.ownerUserId}`);
      console.log(`Recipient: ${owner.email}`);

      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const taskLink = `${baseUrl}/dashboard/task-management/${taskId}`;
      const subject = `Task ${taskNumber} - Request to Close`;

      const bodyHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Permintaan Penutupan Task (Request to Close)</h2>
          <p>Halo <strong>${owner.name}</strong>,</p>
          <p><strong>${userTitle}</strong> mengajukan permintaan untuk menutup task berikut:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; width: 150px;"><strong>Task ID / No:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #4f46e5;">${taskNumber}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Judul Task:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Pemohon:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${userTitle}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Proyek:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${project.projectName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status Saat Ini:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-weight: bold;">WAITING OWNER REVIEW</span></td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Waktu Permintaan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td></tr>
            ${reason ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Alasan:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${reason}</td></tr>` : ''}
          </table>
          <p style="margin-top: 20px;">
            <a href="${taskLink}" style="background-color: #4f46e5; color: #ffffff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Tinjau Task Ini
            </a>
          </p>
          <p style="font-size: 0.85rem; color: #64748b; margin-top: 15px;">
            Atau buka tautan berikut: <a href="${taskLink}" style="color: #4f46e5;">${taskLink}</a>
          </p>
        </div>
      `;

      // Send email STRICTLY ONLY to single project owner email address
      sendEmail({
        to: owner.email,
        subject,
        html: bodyHtml,
      }).catch((err) => console.error(`Failed sending Request to Close email to Project Owner (${owner.email}):`, err));
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
