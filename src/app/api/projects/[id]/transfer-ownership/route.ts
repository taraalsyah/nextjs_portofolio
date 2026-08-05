import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProjectMember } from '@/lib/project';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    const currentUserId = parseInt((session.user as any).id || '0', 10);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, ownerUserId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (project.ownerUserId !== currentUserId) {
      return NextResponse.json({ error: 'Hanya Pemilik (Owner) proyek yang dapat mentransfer kepemilikan.' }, { status: 403 });
    }

    const body = await req.json();
    const { newOwnerUserId: targetIdInput } = body;
    const targetUserId = parseInt(String(targetIdInput), 10);

    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Target pemilik baru tidak valid.' }, { status: 400 });
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: 'Anda sudah menjadi pemilik proyek ini.' }, { status: 400 });
    }

    // Verify target user is an active member of this project
    const targetMember = await getProjectMember(projectId, targetUserId);
    if (!targetMember || !targetMember.user) {
      return NextResponse.json({ error: 'Target pengguna harus merupakan anggota aktif dari proyek ini.' }, { status: 400 });
    }

    // Transactional ownership transfer
    await prisma.$transaction(async (tx) => {
      // 1. Demote current owner to ADMIN
      await tx.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId: currentUserId,
          },
        },
        data: { role: 'ADMIN' },
      });

      // 2. Promote target member to OWNER
      await tx.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
        data: { role: 'OWNER' },
      });

      // 3. Update project ownerUserId
      await tx.project.update({
        where: { id: projectId },
        data: { ownerUserId: targetUserId },
      });

      // 4. Log Activity
      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'OWNERSHIP_TRANSFERRED',
          description: `Ownership Transferred: Mentransfer kepemilikan proyek "${project.projectName}" kepada "${targetMember.user.name}".`,
        },
      });
    }, { maxWait: 10000, timeout: 10000 });

    return NextResponse.json({
      success: true,
      message: `Kepemilikan proyek berhasil dialihkan kepada ${targetMember.user.name}.`,
    });
  } catch (err: any) {
    console.error('POST /api/projects/[id]/transfer-ownership error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
