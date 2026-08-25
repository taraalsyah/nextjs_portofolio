// Force Next.js HMR recompilation to pick up newly generated PrismaClient model
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const currentUserId = parseInt((session.user as any).id || '0', 10);
    const params = await props.params;
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    // Verify user is Project Owner or Admin
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true, projectName: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const isOwner = project.ownerUserId === currentUserId;
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: currentUserId,
        },
      },
    });

    const isAdmin = member?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Hanya Owner atau Admin proyek yang memiliki akses ke daftar join request.' },
        { status: 403 }
      );
    }

    const joinRequests = await prisma.projectJoinRequest.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      joinRequests,
    });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/join-requests error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal mengambil daftar join request.' },
      { status: 500 }
    );
  }
}
