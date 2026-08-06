import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';

/**
 * Resolves whether the current user can interact with task attachments.
 * OWNER/ADMIN: Full access (upload/delete any).
 * MEMBER (Assignee): Can upload/delete own attachments.
 * VIEWER / Non-assignee MEMBER: No access.
 */
async function resolveAttachmentPermission(
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

  const rawId = (session.user as { id?: string | number; sub?: string }).id || (session.user as { id?: string | number; sub?: string }).sub || '0';
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

  // 🔒 OWNER/ADMIN + Assignee can manage attachments
  if (!isOwnerOrAdmin && !isAssignee) {
    return { authorized: false, status: 403, error: 'Anda tidak memiliki izin untuk mengelola lampiran pada task ini.', sessionUserId, taskId, isOwnerOrAdmin: false };
  }

  return { authorized: true, status: 200, sessionUserId, taskId, isOwnerOrAdmin };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const perm = await resolveAttachmentPermission(req, params);
    if (!perm.authorized) {
      if (perm.isLockedResponse) return getTaskLockedResponse();
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const body = await req.json();
    const { fileName, fileUrl, fileSize, fileType } = body;

    if (!fileUrl || !fileName) {
      return NextResponse.json({ error: 'Data file lampiran tidak lengkap.' }, { status: 400 });
    }

    // Validate supported image types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const lowerName = fileName.toLowerCase();
    const isSupported = validTypes.includes(fileType?.toLowerCase()) ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp');

    if (!isSupported) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Lampiran hanya mendukung gambar (JPG, JPEG, PNG, WEBP).' },
        { status: 400 }
      );
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: perm.taskId,
        uploadedById: perm.sessionUserId,
        fileName: fileName.trim(),
        fileUrl,
        fileSize: fileSize || 0,
        fileType: fileType || 'image/png',
      },
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
    });

    await logTaskActivity({
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'ATTACHMENT_ADDED',
      description: `Menambahkan lampiran gambar "${attachment.fileName}"`,
      newValue: attachment.fileName,
    });

    return NextResponse.json({ attachment }, { status: 201 });
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
    const perm = await resolveAttachmentPermission(req, params);
    if (!perm.authorized) {
      if (perm.isLockedResponse) return getTaskLockedResponse();
      return NextResponse.json({ error: perm.error }, { status: perm.status });
    }

    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json({ error: 'ID Lampiran wajib diisi.' }, { status: 400 });
    }

    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: parseInt(attachmentId, 10) },
    });

    if (!attachment) {
      return NextResponse.json({ error: 'Lampiran tidak ditemukan.' }, { status: 404 });
    }

    // OWNER/ADMIN can delete any attachment. MEMBER (Assignee) can only delete own attachments.
    if (!perm.isOwnerOrAdmin && attachment.uploadedById !== perm.sessionUserId) {
      return NextResponse.json({ error: 'Anda hanya dapat menghapus lampiran yang Anda unggah sendiri.' }, { status: 403 });
    }

    await prisma.taskAttachment.delete({
      where: { id: parseInt(attachmentId, 10) },
    });

    await logTaskActivity({
      taskId: perm.taskId,
      userId: perm.sessionUserId,
      action: 'ATTACHMENT_REMOVED',
      description: `Menghapus lampiran gambar "${attachment.fileName}"`,
      previousValue: attachment.fileName,
    });

    return NextResponse.json({ message: 'Lampiran berhasil dihapus.' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}