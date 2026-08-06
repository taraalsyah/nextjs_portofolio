import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
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
        assigneeId: true,
        projectId: true,
        closeRequestStatus: true,
        closeRequestedById: true,
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
    const isCloseRequester = task.closeRequestedById === sessionUserId;
    const isAssignee = task.assigneeId === sessionUserId;

    // Allowed if caller is Owner/Admin, or the user who requested the close, or current assignee
    if (!isOwnerOrAdmin && !isCloseRequester && !isAssignee) {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk membatalkan Close Request ini.' },
        { status: 403 }
      );
    }

    // Must have a pending close request
    if (task.closeRequestStatus !== 'PENDING') {
      return NextResponse.json(
        { error: `Tidak ada Close Request yang pending untuk dibatalkan. Status saat ini: ${task.closeRequestStatus}.` },
        { status: 400 }
      );
    }

    const userName = session.user.name || 'User';

    const updatedTask = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          closeRequestStatus: 'NONE',
          closeRequestedById: null,
          closeRequestedAt: null,
          closeRequestReason: null,
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
        },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'CLOSE_CANCELLED',
        description: `${userName} cancelled the close request.`,
        fieldName: 'closeRequestStatus',
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
