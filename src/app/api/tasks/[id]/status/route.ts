import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidStatusTransition, logTaskActivity } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (activeProject.permissions.role === 'VIEWER') {
      return NextResponse.json({ error: 'Peran Anda (VIEWER) tidak memiliki izin mengubah status task.' }, { status: 403 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: activeProject.projectId, deletedAt: null },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan atau tidak berada pada proyek ini.' }, { status: 404 });
    }

    if (!isValidStatusTransition(task.status, status)) {
      return NextResponse.json(
        { error: `Perubahan status dari ${task.status} ke ${status} tidak diizinkan.` },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status },
        select: {
          id: true,
          taskNumber: true,
          projectId: true,
          title: true,
          status: true,
          priority: true,
          assigneeId: true,
          assignee: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'STATUS_CHANGE',
        description: `Perubahan Status Task ${task.taskNumber}: ${task.status} → ${status}`,
        fieldName: 'status',
        previousValue: task.status,
        newValue: status,
        tx,
      });

      return updated;
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
