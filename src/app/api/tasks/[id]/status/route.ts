import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidStatusTransition, logTaskActivity } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { validateWorkflowTransition } from '@/lib/project';

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

    const { id } = await params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus || !['BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE'].includes(newStatus)) {
      return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: activeProject.projectId, deletedAt: null },
      select: { id: true, taskNumber: true, title: true, status: true, assigneeId: true, projectId: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan atau tidak berada pada proyek ini.' }, { status: 404 });
    }

    // 🔒 WORKFLOW TRANSITION & TASK OWNERSHIP SECURITY VALIDATION
    const validation = await validateWorkflowTransition(
      activeProject.permissions.role,
      activeProject.permissions,
      sessionUserId,
      task.assigneeId,
      task.status,
      newStatus,
      activeProject.projectId
    );

    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason || 'Anda tidak memiliki izin untuk mengubah status task ini.' },
        { status: 403 }
      );
    }

    if (!isValidStatusTransition(task.status, newStatus)) {
      return NextResponse.json(
        { error: `Perubahan status dari ${task.status} ke ${newStatus} tidak diizinkan.` },
        { status: 400 }
      );
    }

    // Transactional Update & Activity History Logging
    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status: newStatus },
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
        description: `Workflow Transition: Transisi status ${task.taskNumber} (${task.status} → ${newStatus}) oleh ${session.user?.name || 'User'}.`,
        fieldName: 'status',
        previousValue: task.status,
        newValue: newStatus,
        tx,
      });

      return updated;
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    console.error('PATCH /api/tasks/[id]/status error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
