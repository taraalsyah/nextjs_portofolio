import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';

/**
 * Resolves whether the current user can interact with task checklists.
 * OWNER/ADMIN: Full access.
 * MEMBER (Assignee): Can add/check/uncheck/delete checklist items.
 * VIEWER / Non-assignee MEMBER: No access.
 */
async function resolveChecklistPermission(
  req: NextRequest,
  params: Promise<{ id: string }>
): Promise<{
  authorized: boolean;
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

  const rawId = session.user.id || '0';
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
    select: { id: true, assigneeId: true },
  });

  if (!task) {
    return { authorized: false, status: 404, error: 'Task tidak ditemukan atau tidak berada pada proyek ini.', sessionUserId, taskId, isOwnerOrAdmin: false };
  }

  const role = activeProject.permissions.role;
  const isOwnerOrAdmin = role === 'OWNER' || role === 'ADMIN';
  const isAssignee = task.assigneeId === sessionUserId;

  // 🔒 OWNER/ADMIN + Assignee can manage checklists
  if (!isOwnerOrAdmin && !isAssignee) {
    return { authorized: false, status: 403, error: 'Anda tidak memiliki izin untuk mengelola checklist pada task ini.', sessionUserId, taskId, isOwnerOrAdmin: false };
  }

  return { authorized: true, status: 200, sessionUserId, taskId, isOwnerOrAdmin };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const perm = await resolveChecklistPermission(req, params);
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const body = await req.json();
    const { title } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul checklist item wajib diisi.' }, { status: 400 });
    }

    const item = await prisma.taskChecklist.create({
      data: {
        taskId: perm.taskId,
        title: title.trim(),
        isCompleted: false,
      },
    });

    await logTaskActivity({
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'CHECKLIST_ADDED',
      description: `Menambahkan item checklist "${item.title}"`,
      newValue: item.title,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const perm = await resolveChecklistPermission(req, params);
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: perm.status });
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
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'CHECKLIST_UPDATED',
      description: `Memperbarui checklist "${updatedItem.title}": ${updatedItem.isCompleted ? 'Completed' : 'Pending'}`,
      previousValue: String(oldItem.isCompleted),
      newValue: String(updatedItem.isCompleted),
    });

    return NextResponse.json({ item: updatedItem });
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
    const perm = await resolveChecklistPermission(req, params);
    if (!perm.authorized) {
      return NextResponse.json({ error: perm.error }, { status: perm.status });
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
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'CHECKLIST_DELETED',
      description: `Menghapus item checklist "${item.title}"`,
    });

    return NextResponse.json({ message: 'Item checklist berhasil dihapus.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
