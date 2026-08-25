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
        { error: 'Hanya Owner proyek yang berhak meng-approve permintaan bergabung.' },
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

    if (joinRequest.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Permintaan bergabung ini sudah disetujui sebelumnya.' },
        { status: 400 }
      );
    }

    // Perform Approval Transaction: Update Request Status & Add User to ProjectMember
    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.projectJoinRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
          reviewedById: currentUserId,
        },
      });

      // Add to ProjectMember if not already added
      const existingMember = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: joinRequest.userId,
          },
        },
      });

      let member = existingMember;
      if (!existingMember) {
        member = await tx.projectMember.create({
          data: {
            projectId,
            userId: joinRequest.userId,
            role: 'MEMBER',
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'JOIN_REQUEST_APPROVED',
          description: `Owner menyetujui permintaan bergabung dari "${joinRequest.user.name}" (${joinRequest.user.email}) ke dalam proyek "${project.projectName}".`,
        },
      });

      return { request: updatedRequest, member };
    });

    return NextResponse.json({
      success: true,
      message: `Permintaan bergabung "${joinRequest.user.name}" berhasil disetujui.`,
      request: result.request,
      member: result.member,
    });
  } catch (err: any) {
    console.error('POST /api/projects/[id]/join-requests/[requestId]/approve error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal menyetujui permintaan bergabung.' },
      { status: 500 }
    );
  }
}
