import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity } from '@/lib/task';

export async function GET(
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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        createdById: true,
        categoryId: true,
        tags: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: { id: true, name: true, username: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        category: { select: { id: true, name: true, description: true } },
        checklists: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            fileType: true,
            createdAt: true,
            uploadedById: true,
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        histories: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            fieldName: true,
            previousValue: true,
            newValue: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 STRICT AUTHORIZATION CHECK
    if (role !== 'Admin' && task.assigneeId !== sessionUserId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak memiliki izin untuk mengakses task ini.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const oldTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, category: true },
    });

    if (!oldTask) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 STRICT AUTHORIZATION CHECK
    if (role !== 'Admin' && oldTask.assigneeId !== sessionUserId) {
      return NextResponse.json(
        { error: 'Akses ditolak. Anda tidak memiliki izin untuk memperbarui task ini.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      categoryId,
      tags,
      startDate,
      dueDate,
    } = body;

    // Validation
    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json({ error: 'Judul task wajib diisi.' }, { status: 400 });
    }
    if (title && title.trim().length > 200) {
      return NextResponse.json({ error: 'Judul task maksimal 200 karakter.' }, { status: 400 });
    }

    const parsedStartDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : oldTask.startDate;
    const parsedDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : oldTask.dueDate;

    if (parsedStartDate && parsedDueDate && parsedDueDate < parsedStartDate) {
      return NextResponse.json(
        { error: 'Tanggal deadline (Due Date) tidak boleh lebih awal dari Start Date.' },
        { status: 400 }
      );
    }

    // Assignee authorization check: Non-Admin cannot re-assign to another user!
    let newAssigneeId = oldTask.assigneeId;
    if (role === 'Admin' && assigneeId !== undefined) {
      newAssigneeId = assigneeId ? parseInt(String(assigneeId), 10) : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title ? title.trim() : oldTask.title,
        description: description !== undefined ? description.trim() : oldTask.description,
        status: status || oldTask.status,
        priority: priority || oldTask.priority,
        assigneeId: newAssigneeId,
        categoryId: categoryId !== undefined ? (categoryId ? parseInt(String(categoryId), 10) : null) : oldTask.categoryId,
        tags: tags !== undefined ? (tags?.trim() || null) : oldTask.tags,
        startDate: parsedStartDate,
        dueDate: parsedDueDate,
      },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        createdById: true,
        categoryId: true,
        tags: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    // Detect field changes and log Activity History
    const changes: string[] = [];

    if (oldTask.status !== updatedTask.status) {
      changes.push(`Status: ${oldTask.status} → ${updatedTask.status}`);
      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'STATUS_CHANGE',
        description: `Mengubah status task ${oldTask.taskNumber} dari ${oldTask.status} ke ${updatedTask.status}`,
        fieldName: 'status',
        previousValue: oldTask.status,
        newValue: updatedTask.status,
      });
    }

    if (oldTask.priority !== updatedTask.priority) {
      changes.push(`Priority: ${oldTask.priority} → ${updatedTask.priority}`);
      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'PRIORITY_CHANGE',
        description: `Mengubah priority task ${oldTask.taskNumber} dari ${oldTask.priority} ke ${updatedTask.priority}`,
        fieldName: 'priority',
        previousValue: oldTask.priority,
        newValue: updatedTask.priority,
      });
    }

    if (oldTask.assigneeId !== updatedTask.assigneeId) {
      const oldAssigneeName = oldTask.assignee?.name || 'Belum di-assign';
      const newAssigneeName = updatedTask.assignee?.name || 'Belum di-assign';
      changes.push(`Assignee: ${oldAssigneeName} → ${newAssigneeName}`);
      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'ASSIGNEE_CHANGE',
        description: `Mengubah penugasan task ${oldTask.taskNumber} dari ${oldAssigneeName} ke ${newAssigneeName}`,
        fieldName: 'assignee',
        previousValue: oldAssigneeName,
        newValue: newAssigneeName,
      });
    }

    if (oldTask.title !== updatedTask.title) {
      changes.push(`Judul: "${updatedTask.title}"`);
    }

    if (changes.length > 0) {
      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'TASK_UPDATED',
        description: `Memperbarui Task ${updatedTask.taskNumber}:\n${changes.join('\n')}`,
      });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    if (role !== 'Admin') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya Admin yang dapat menghapus task.' }, { status: 403 });
    }

    const { id } = await params;
    const taskId = parseInt(id, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'TASK_DELETED',
      description: `Menghapus Task ${task.taskNumber} - "${task.title}"`,
    });

    return NextResponse.json({ message: 'Task berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
