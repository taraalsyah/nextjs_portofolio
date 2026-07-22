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
        taskId,
        uploadedById: sessionUserId,
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
      taskId,
      userId: sessionUserId,
      action: 'ATTACHMENT_ADDED',
      description: `Menambahkan lampiran gambar "${attachment.fileName}"`,
      newValue: attachment.fileName,
    });

    return NextResponse.json({ attachment }, { status: 201 });
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

    await prisma.taskAttachment.delete({
      where: { id: parseInt(attachmentId, 10) },
    });

    await logTaskActivity({
      taskId,
      userId: sessionUserId,
      action: 'ATTACHMENT_REMOVED',
      description: `Menghapus lampiran gambar "${attachment.fileName}"`,
      previousValue: attachment.fileName,
    });

    return NextResponse.json({ message: 'Lampiran berhasil dihapus.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
