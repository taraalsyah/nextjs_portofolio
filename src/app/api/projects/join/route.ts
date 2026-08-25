// Force Next.js HMR recompilation to pick up newly generated PrismaClient model
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

    // 2. Check if user is owner
    if (project.ownerUserId === currentUserId) {
      return NextResponse.json(
        { error: 'Anda adalah Owner (Pemilik Utama) dari proyek ini.' },
        { status: 409 }
      );
    }

    // 3. Check if user is already an approved member
    const existingMembership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: currentUserId,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Anda sudah menjadi anggota resmi dari proyek ini.' },
        { status: 409 }
      );
    }

    // 4. Check existing join request
    const existingRequest = await prisma.projectJoinRequest.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId: currentUserId,
        },
      },
    });

    if (existingRequest && existingRequest.status === 'PENDING') {
      return NextResponse.json(
        { error: 'Permintaan bergabung Anda sedang menunggu persetujuan (Pending Approval) dari Owner proyek.' },
        { status: 409 }
      );
    }

    // 5. Create or re-open Join Request via transaction
    const joinRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.projectJoinRequest.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: currentUserId,
          },
        },
        create: {
          projectId: project.id,
          userId: currentUserId,
          status: 'PENDING',
          requestedAt: new Date(),
        },
        update: {
          status: 'PENDING',
          requestedAt: new Date(),
          reviewedAt: null,
          reviewedById: null,
          rejectReason: null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId: project.id,
          action: 'PROJECT_JOIN_REQUESTED',
          description: `Permintaan bergabung dikirim oleh "${session.user.name || 'User'}" ke proyek "${project.projectName}" via Invite Code. Menunggu persetujuan Owner.`,
        },
      });

      return request;
    });

    return NextResponse.json({
      success: true,
      message: `Permintaan bergabung ke proyek "${project.projectName}" berhasil dikirim. Saat ini sedang menunggu persetujuan dari Owner proyek.`,
      project: {
        id: project.id,
        projectName: project.projectName,
        description: project.description,
      },
      request: joinRequest,
    }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/projects/join error:', err);
    return NextResponse.json(
      { error: err.message || 'Gagal bergabung ke proyek.' },
      { status: 500 }
    );
  }
}
