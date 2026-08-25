import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string; requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const currentUserId = parseInt((session.user as any).id || '0', 10);
    const params = await props.params;
    const projectId = parseInt(params.id, 10);
    const requestId = parseInt(params.requestId, 10);

    if (isNaN(projectId) || isNaN(requestId)) {
      return NextResponse.json({ error: 'Parameter ID tidak valid.' }, { status: 400 });
    }

    // Verify Project Ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, ownerUserId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (project.ownerUserId !== currentUserId) {
      return NextResponse.json(
        { error: 'Hanya Owner proyek yang berhak menolak permintaan bergabung.' },
        { status: 403 }
      );
    }

    // Find Join Request
    const joinRequest = await prisma.projectJoinRequest.findUnique({
      where: { id: requestId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (!joinRequest || joinRequest.projectId !== projectId) {
      return NextResponse.json({ error: 'Permintaan bergabung tidak ditemukan.' }, { status: 404 });
    }

    if (joinRequest.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Permintaan bergabung ini sudah ditolak sebelumnya.' },
        { status: 400 }
      );
    }

    let rejectReason = '';
    try {
      const body = await req.json();
      rejectReason = body.rejectReason || '';
    } catch (_) {}

    // Perform Rejection Transaction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedById: currentUserId,
          rejectReason: rejectReason || null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'JOIN_REQUEST_REJECTED',
          description: `Owner menolak permintaan bergabung dari "${joinRequest.user.name}" (${joinRequest.user.email}) ke proyek "${project.projectName}".`,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: `Permintaan bergabung "${joinRequest.user.name}" berhasil ditolak.`,
      request: updatedRequest,
    });
  } catch (err: any) {
    console.error('POST /api/projects/[id]/join-requests/[requestId]/reject error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menolak permintaan bergabung.' },
      { status: 500 }
    );
  }
}
