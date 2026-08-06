import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { sendTaskDoneNotification } from '@/lib/notification';
import { ensureDoneRequestColumns } from '@/lib/ensure-db-columns';
import { getProjectMember, ProjectRole } from '@/lib/project';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDoneRequestColumns().catch(() => {});
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
        doneRequestStatus: true,
        doneRequestedById: true,
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
        { error: 'Hanya Owner atau Admin yang dapat menolak Done Request.' },
        { status: 403 }
      );
    }

    // Must have a pending done request
    if (task.doneRequestStatus !== 'PENDING') {
      return NextResponse.json(
        { error: `Tidak ada Done Request yang pending. Status saat ini: ${task.doneRequestStatus}.` },
        { status: 400 }
      );
    }

    // Parse optional reject reason
    const body = await req.json().catch(() => ({}));
    const rejectReason = body.rejectReason?.trim() || body.doneRejectReason?.trim() || null;
    const reviewerName = session.user.name || 'Owner/Admin';

    const updatedTask = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          doneRequestStatus: 'REJECTED',
          doneReviewedById: sessionUserId,
          doneReviewedAt: new Date(),
          doneRejectReason: rejectReason,
        },
        select: {
          id: true,
          taskNumber: true,
          title: true,
          status: true,
          doneRequestStatus: true,
          doneRequestedById: true,
          doneRequestedAt: true,
          doneRequestNote: true,
          doneRejectReason: true,
          doneReviewedById: true,
          doneReviewedAt: true,
          doneRequestedBy: {
            select: { id: true, name: true, username: true },
          },
          doneReviewedBy: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'DONE_REJECTED',
        description: `${reviewerName} rejected the completion request.${rejectReason ? ` Reason: ${rejectReason}` : ''}`,
        fieldName: 'doneRequestStatus',
        previousValue: 'PENDING',
        newValue: 'REJECTED',
        tx,
      });

      return result;
    }, { timeout: 15000 });

    // Dispatch Notification to Assignee
    sendTaskDoneNotification({
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
