import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity } from '@/lib/task';

export async function POST(
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
      select: { id: true, assigneeId: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 STRICT AUTHORIZATION CHECK
    if (role !== 'Admin' && task.assigneeId !== sessionUserId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul checklist item wajib diisi.' }, { status: 400 });
    }

    const item = await prisma.taskChecklist.create({
      data: {
        taskId,
        title: title.trim(),
        isCompleted: false,
      },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'CHECKLIST_ADDED',
      description: `Menambahkan item checklist "${item.title}"`,
      newValue: item.title,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

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

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, assigneeId: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 STRICT AUTHORIZATION CHECK
    if (role !== 'Admin' && task.assigneeId !== sessionUserId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const body = await req.json();
    const { itemId, isCompleted, title } = body;

    if (!itemId) {
      return NextResponse.json({ error: 'ID Checklist Item wajib diisi.' }, { status: 400 });
    }

    const oldItem = await prisma.taskChecklist.findUnique({
      where: { id: parseInt(itemId, 10) },
    });

    if (!oldItem) {
      return NextResponse.json({ error: 'Item checklist tidak ditemukan.' }, { status: 404 });
    }

    const updatedItem = await prisma.taskChecklist.update({
      where: { id: parseInt(itemId, 10) },
      data: {
        isCompleted: isCompleted !== undefined ? isCompleted : oldItem.isCompleted,
        title: title !== undefined ? title.trim() : oldItem.title,
      },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'CHECKLIST_UPDATED',
      description: `Memperbarui checklist "${updatedItem.title}": ${updatedItem.isCompleted ? 'Completed' : 'Pending'}`,
      previousValue: String(oldItem.isCompleted),
      newValue: String(updatedItem.isCompleted),
    });

    return NextResponse.json({ item: updatedItem });
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

    const { id } = await params;
    const taskId = parseInt(id, 10);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, assigneeId: true },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // 🔒 STRICT AUTHORIZATION CHECK
    if (role !== 'Admin' && task.assigneeId !== sessionUserId) {
      return NextResponse.json({ error: 'Akses ditolak.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json({ error: 'ID Checklist Item wajib diisi.' }, { status: 400 });
    }

    const item = await prisma.taskChecklist.findUnique({
      where: { id: parseInt(itemId, 10) },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item checklist tidak ditemukan.' }, { status: 404 });
    }

    await prisma.taskChecklist.delete({
      where: { id: parseInt(itemId, 10) },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'CHECKLIST_DELETED',
      description: `Menghapus item checklist "${item.title}"`,
    });

    return NextResponse.json({ message: 'Item checklist berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
