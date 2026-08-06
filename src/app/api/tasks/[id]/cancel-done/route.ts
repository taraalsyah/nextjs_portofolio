import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
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

    const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
    const isDoneRequester = task.doneRequestedById === sessionUserId;
    const isAssignee = task.assigneeId === sessionUserId;

    if (!isOwnerOrAdmin && !isDoneRequester && !isAssignee) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk membatalkan Done Request ini.' },
        { status: 403 }
      );
    }

    // Must have a pending done request
    if (task.doneRequestStatus !== 'PENDING') {
      return NextResponse.json(
        { error: `Tidak ada Done Request yang pending untuk dibatalkan. Status saat ini: ${task.doneRequestStatus}.` },
        { status: 400 }
      );
    }

    const userName = session.user.name || 'User';

    const updatedTask = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          doneRequestStatus: 'NONE',
          doneRequestedById: null,
          doneRequestedAt: null,
          doneRequestNote: null,
          doneReviewedById: null,
          doneReviewedAt: null,
          doneRejectReason: null,
        },
        select: {
          id: true,
          taskNumber: true,
          title: true,
          status: true,
          doneRequestStatus: true,
          doneRequestedById: true,
          doneRequestedAt: true,
        },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'DONE_CANCELLED',
        description: `${userName} cancelled the completion request.`,
        fieldName: 'doneRequestStatus',
        previousValue: 'PENDING',
        newValue: 'NONE',
        tx,
      });

      return result;
    }, { timeout: 15000 });

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
