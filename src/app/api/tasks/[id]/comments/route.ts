import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';

/**
 * Resolves whether the current user can interact with task comments.
 * OWNER/ADMIN: Full access.
 * MEMBER (Assignee): Can add/edit/delete own comments.
 * VIEWER / Non-assignee MEMBER: No access.
 */
async function resolveCommentPermission(
  req: NextRequest,
  params: Promise<{ id: string }>
): Promise<{
  authorized: boolean;
  isLockedResponse?: boolean;
  status: number;
  error?: string;
  sessionUserId: number;
  taskId: number;
  isOwnerOrAdmin: boolean;
}> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authorized: false, status: 401, error: 'Session expired.', sessionUserId: 0, taskId: 0, isOwnerOrAdmin: false };
  }

  const rawId = session.user.id;
  const sessionUserId = parseInt(String(rawId), 10);

  const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);
  if (!activeProject) {
    return { authorized: false, status: 404, error: 'Proyek tidak ditemukan.', sessionUserId, taskId: 0, isOwnerOrAdmin: false };
  }

  const { id } = await params;
  const taskId = parseInt(id, 10);
  if (isNaN(taskId)) {
    return { authorized: false, status: 400, error: 'ID Task tidak valid.', sessionUserId, taskId: 0, isOwnerOrAdmin: false };
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId: activeProject.projectId, deletedAt: null },
    select: { id: true, assigneeId: true, status: true, isLocked: true },
  });

  if (!task) {
    return { authorized: false, status: 404, error: 'Task tidak ditemukan atau tidak berada pada proyek ini.', sessionUserId, taskId, isOwnerOrAdmin: false };
  }

  if (isTaskLocked(task)) {
    return { authorized: false, isLockedResponse: true, status: 403, error: 'TASK_LOCKED', sessionUserId, taskId, isOwnerOrAdmin: false };
  }

  const role = activeProject.permissions.role;
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';
  const isAssignee = task.assigneeId === sessionUserId;

  // 🔒 OWNER/ADMIN + Assignee can comment
  if (!isOwnerOrAdmin && !isAssignee) {
    return { authorized: false, status: 403, error: 'Anda tidak memiliki izin untuk mengelola komentar pada task ini.', sessionUserId, taskId, isOwnerOrAdmin: false };
  }

  return { authorized: true, status: 200, sessionUserId, taskId, isOwnerOrAdmin };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const perm = await resolveCommentPermission(req, params);
    if (!perm.authorized) {
      if (perm.isLockedResponse) return getTaskLockedResponse();
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Komentar tidak boleh kosong.' }, { status: 400 });
    }

    const comment = await prisma.taskComment.create({
      data: {
        taskId: perm.taskId,
        userId: perm.sessionUserId,
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
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'COMMENT_ADDED',
      description: `Menambahkan komentar pada task`,
      newValue: comment.content,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const perm = await resolveCommentPermission(req, params);
    if (!perm.authorized) {
      if (perm.isLockedResponse) return getTaskLockedResponse();
      return NextResponse.json({ error: perm.error }, { status: perm.status });
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

    // OWNER/ADMIN can edit any comment. MEMBER (Assignee) can only edit own comments.
    if (!perm.isOwnerOrAdmin && oldComment.userId !== perm.sessionUserId) {
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
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'COMMENT_EDITED',
      description: `Mengubah komentar pada task`,
      previousValue: oldComment.content,
      newValue: updatedComment.content,
    });

    return NextResponse.json({ comment: updatedComment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const perm = await resolveCommentPermission(req, params);
    if (!perm.authorized) {
      if (perm.isLockedResponse) return getTaskLockedResponse();
      return NextResponse.json({ error: perm.error }, { status: perm.status });
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

    // OWNER/ADMIN can delete any comment. MEMBER (Assignee) can only delete own comments.
    if (!perm.isOwnerOrAdmin && comment.userId !== perm.sessionUserId) {
      return NextResponse.json({ error: 'Anda hanya dapat menghapus komentar milik Anda sendiri.' }, { status: 403 });
    }

    await prisma.taskComment.delete({
      where: { id: parseInt(commentId, 10) },
    });

    await logTaskActivity({
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'COMMENT_DELETED',
      description: `Menghapus komentar pada task`,
    });

    return NextResponse.json({ message: 'Komentar berhasil dihapus.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
