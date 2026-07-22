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
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Komentar tidak boleh kosong.' }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId,
        userId: sessionUserId,
        content: content.trim(),
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'COMMENT_ADDED',
      description: `Menambahkan komentar pada task`,
      newValue: comment.content,
    });

    return NextResponse.json({ comment }, { status: 201 });
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
    const { commentId, content } = body;

    if (!commentId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Data komentar tidak valid.' }, { status: 400 });
    }

    const oldComment = await prisma.taskComment.findUnique({
      where: { id: parseInt(commentId, 10) },
    });

    if (!oldComment) {
      return NextResponse.json({ error: 'Komentar tidak ditemukan.' }, { status: 404 });
    }

    if (oldComment.userId !== sessionUserId) {
      return NextResponse.json({ error: 'Anda hanya dapat mengubah komentar milik Anda sendiri.' }, { status: 403 });
    }

    const updatedComment = await prisma.taskComment.update({
      where: { id: parseInt(commentId, 10) },
      data: { content: content.trim() },
      select: {
        id: true,
        content: true,
        createdAt: true,
        userId: true,
        user: { select: { id: true, name: true, username: true, image: true } },
      },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'COMMENT_EDITED',
      description: `Mengubah komentar pada task`,
      previousValue: oldComment.content,
      newValue: updatedComment.content,
    });

    return NextResponse.json({ comment: updatedComment });
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
    const commentId = searchParams.get('commentId');

    if (!commentId) {
      return NextResponse.json({ error: 'ID Komentar wajib diisi.' }, { status: 400 });
    }

    const comment = await prisma.taskComment.findUnique({
      where: { id: parseInt(commentId, 10) },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Komentar tidak ditemukan.' }, { status: 404 });
    }

    if (comment.userId !== sessionUserId) {
      return NextResponse.json({ error: 'Anda hanya dapat menghapus komentar milik Anda sendiri.' }, { status: 403 });
    }

    await prisma.taskComment.delete({
      where: { id: parseInt(commentId, 10) },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'COMMENT_DELETED',
      description: `Menghapus komentar pada task`,
    });

    return NextResponse.json({ message: 'Komentar berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
