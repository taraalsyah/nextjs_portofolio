import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { sendTaskCloseNotification } from '@/lib/notification';
import { getProjectMember, getProjectPermissions, ProjectRole } from '@/lib/project';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(session.user.id || '0', 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const { id: paramsId } = await params;
    const taskId = parseInt(paramsId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        assigneeId: true,
        projectId: true,
        closeRequestStatus: true,
        closeRequestedAt: true,
        closeReviewedAt: true,
        project: { select: { id: true, projectName: true } },
      },
    });

    if (!task || !task.projectId) {
      return NextResponse.json(
        { error: 'Task tidak ditemukan.' },
        { status: 404 }
      );
    }

    let userRole: ProjectRole | null = null;
    let permissions = activeProject.permissions;

    if (task.projectId === activeProject.projectId) {
      userRole = activeProject.permissions.role;
    } else {
      const membership = await getProjectMember(task.projectId, sessionUserId);
      if (membership) {
        userRole = membership.role as ProjectRole;
        permissions = await getProjectPermissions(userRole, task.projectId);
      }
    }

    if (!userRole) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek task ini.' }, { status: 403 });
    }

    // Owner/Admin doesn't need to request close - they can close directly
    const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
    if (isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Owner atau Admin tidak perlu mengajukan Close Request. Anda dapat langsung menutup task.' },
        { status: 400 }
      );
    }

    // Only the assignee can submit a close request
    if (task.assigneeId !== sessionUserId) {
      return NextResponse.json(
        { error: 'Hanya Assignee yang dapat mengajukan permintaan penutupan task.' },
        { status: 403 }
      );
    }

    // Task must not already be CLOSED
    if (task.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Task sudah ditutup (Closed).' },
        { status: 400 }
      );
    }

    // Task must be in DONE status
    if (task.status !== 'DONE') {
      return NextResponse.json(
        { error: `Tidak dapat mengajukan Close Request. Task harus dalam status DONE terlebih dahulu. Status saat ini: ${task.status}` },
        { status: 400 }
      );
    }

    // Prevent duplicate pending requests
    if (task.closeRequestStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'Close Request sudah diajukan dan masih menunggu persetujuan. Tidak dapat membuat permintaan duplikat.' },
        { status: 409 }
      );
    }

    // Parse optional request reason
    const body = await req.json().catch(() => ({}));
    const requestReason = body.requestReason?.trim() || null;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          closeRequestStatus: 'PENDING',
          closeRequestedById: sessionUserId,
          closeRequestedAt: new Date(),
          closeRequestReason: requestReason,
          closeReviewedById: null,
          closeReviewedAt: null,
          closeRejectReason: null,
        },
        select: {
          id: true,
          taskNumber: true,
          title: true,
          status: true,
          closeRequestStatus: true,
          closeRequestedById: true,
          closeRequestedAt: true,
          closeRequestReason: true,
          closeReviewedAt: true,
          closeRequestedBy: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      const userName = session.user?.name || 'Assignee';

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'CLOSE_REQUESTED',
        description: `${userName} requested to close this task.${requestReason ? ` Reason: ${requestReason}` : ''}`,
        fieldName: 'closeRequestStatus',
        previousValue: 'NONE',
        newValue: 'PENDING',
        tx,
      });

      return result;
    }, { timeout: 15000 });

    // Send notifications to Owner and Project Admins asynchronously
    sendTaskCloseNotification({
      taskId,
      taskTitle: task.title,
      taskNumber: task.taskNumber,
      projectId: activeProject.projectId,
      projectName: task.project?.projectName || 'Project',
      userTitle: session.user.name || 'Assignee',
      requestStatus: 'PENDING',
      reason: requestReason,
      actorUserId: sessionUserId,
    }).catch((err) => console.error('Notification dispatch error:', err));

    return NextResponse.json({ task: updatedTask }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}