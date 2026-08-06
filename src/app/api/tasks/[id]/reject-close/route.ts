import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { sendTaskCloseNotification } from '@/lib/notification';
import { getProjectMember, ProjectRole } from '@/lib/project';

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
        isLocked: true,
        assigneeId: true,
        projectId: true,
        closeRequestStatus: true,
        closeRequestedById: true,
        project: { select: { id: true, projectName: true } },
      },
    });

    if (!task || !task.projectId) {
      return NextResponse.json(
        { error: 'Task tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (isTaskLocked(task)) {
      return getTaskLockedResponse();
    }

    let userRole: ProjectRole | null = null;

    if (task.projectId === activeProject.projectId) {
      userRole = activeProject.permissions.role;
    } else {
      const membership = await getProjectMember(task.projectId, sessionUserId);
      if (membership) {
        userRole = membership.role as ProjectRole;
      }
    }

    // Only OWNER or ADMIN can reject
    if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Hanya Owner atau Admin yang dapat menolak Close Request.' },
        { status: 403 }
      );
    }

    // Must have a pending close request
    if (task.closeRequestStatus !== 'PENDING') {
      return NextResponse.json(
        { error: `Tidak ada Close Request yang pending. Status close request saat ini: ${task.closeRequestStatus}.` },
        { status: 400 }
      );
    }

    // Task must not already be CLOSED
    if (task.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Task sudah ditutup (Closed).' },
        { status: 400 }
      );
    }

    // Parse optional reject reason
    const body = await req.json().catch(() => ({}));
    const rejectReason = body.rejectReason?.trim() || null;
    const reviewerName = session.user.name || 'Owner/Admin';

    const updatedTask = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          closeRequestStatus: 'REJECTED',
          closeReviewedById: sessionUserId,
          closeReviewedAt: new Date(),
          closeRejectReason: rejectReason,
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
          closeRejectReason: true,
          closeReviewedById: true,
          closeReviewedAt: true,
          closeRequestedBy: {
            select: { id: true, name: true, username: true },
          },
          closeReviewedBy: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'CLOSE_REJECTED',
        description: `${reviewerName} rejected the close request.${rejectReason ? ` Reason: ${rejectReason}` : ''}`,
        fieldName: 'closeRequestStatus',
        previousValue: 'PENDING',
        newValue: 'REJECTED',
        tx,
      });

      return result;
    }, { timeout: 15000 });

    // Dispatch Notification to Assignee
    sendTaskCloseNotification({
      taskId,
      taskTitle: task.title,
      taskNumber: task.taskNumber,
      projectId: activeProject.projectId,
      projectName: task.project?.projectName || 'Project',
      userTitle: reviewerName,
      requestStatus: 'REJECTED',
      reason: rejectReason,
      actorUserId: sessionUserId,
    }).catch((err) => console.error('Notification dispatch error:', err));

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}