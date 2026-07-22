import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidStatusTransition, logTaskActivity } from '@/lib/task';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const role = (session.user as any).role || 'Staff';
    const rawId = (session.user as any).id || (session.user as any).sub || '0';
    const sessionUserId = parseInt(String(rawId), 10) || 0;

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
      where: { id: taskId, deletedAt: null },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 STRICT AUTHORIZATION CHECK
    if (role !== 'Admin' && task.assigneeId !== sessionUserId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak memiliki izin untuk mengubah status task ini.' },
        { status: 403 }
      );
    }

    if (!isValidStatusTransition(task.status, status)) {
      return NextResponse.json(
        { error: `Perubahan status dari ${task.status} ke ${status} tidak diizinkan.` },
        { status: 400 }
      );
    }

    // 🔒 PRISMA TRANSACTION FOR ATOMIC UPDATE + LOGGING
    const updatedTask = await prisma.$transaction(async (tx) => {
      const updated = await tx.task.update({
        where: { id: taskId },
        data: { status },
        select: {
          id: true,
          taskNumber: true,
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
