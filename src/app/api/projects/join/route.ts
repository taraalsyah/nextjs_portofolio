import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const currentUserId = parseInt((session.user as any).id || '0', 10);
    if (!currentUserId) {
      return NextResponse.json({ error: 'User tidak valid.' }, { status: 401 });
    }

    const body = await req.json();
    const { inviteCode: rawCode } = body;
    const inviteCode = (rawCode || '').trim().toUpperCase();

    if (!inviteCode) {
      return NextResponse.json({ error: 'Invite Code wajib diisi.' }, { status: 400 });
    }

    // 1. Find project by active Invite Code
    const project = await prisma.project.findUnique({
      where: { inviteCode },
      select: {
        id: true,
        projectName: true,
        description: true,
        ownerUserId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Invite Code tidak ditemukan atau sudah tidak berlaku.' },
        { status: 404 }
      );
    }

    // 2. Check if user is already a member or owner
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: currentUserId,
        },
      },
    });

    if (existingMembership || project.ownerUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Anda sudah menjadi anggota proyek ini.' },
        { status: 409 }
      );
    }

    // 3. Add user as MEMBER via transaction
    const newMember = await prisma.$transaction(async (tx) => {
      const created = await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: currentUserId,
          role: 'MEMBER',
        },
        select: {
          id: true,
          projectId: true,
          userId: true,
          role: true,
          joinedAt: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId: project.id,
          action: 'PROJECT_JOINED',
          description: `User Joined Project: Bergabung ke dalam proyek "${project.projectName}" menggunakan Invite Code.`,
        },
      });

      return created;
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke proyek "${project.projectName}".`,
      project: {
        id: project.id,
        projectName: project.projectName,
        description: project.description,
      },
      member: newMember,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/projects/join error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal bergabung ke proyek.' },
      { status: 500 }
    );
  }
}
