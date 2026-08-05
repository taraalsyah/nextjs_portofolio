import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProjectMember, getProjectPermissions } from '@/lib/project';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function generateProjectInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomBytes = crypto.randomBytes(8);
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomBytes[i] % chars.length];
    part2 += chars[randomBytes[i + 4] % chars.length];
  }
  return `PM-${part1}-${part2}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const member = await getProjectMember(projectId, currentUserId);

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat melihat dan mengelola Invite Code.' }, { status: 403 });
    }

    let project: any = null;
    try {
      project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { inviteCode: true, projectName: true },
      });
    } catch {
      const rawRes: any[] = await prisma.$queryRaw`SELECT invite_code, project_name FROM projects WHERE id = ${projectId} LIMIT 1`;
      project = rawRes[0] ? { inviteCode: rawRes[0].invite_code, projectName: rawRes[0].project_name } : null;
    }

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ inviteCode: project.inviteCode });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/invite-code error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

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
    const member = await getProjectMember(projectId, currentUserId);

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat membuat atau memperbarui Invite Code.' }, { status: 403 });
    }

    // Generate unique code
    let inviteCode = generateProjectInviteCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      attempts++;
      const existing = await prisma.project.findUnique({
        where: { inviteCode },
        select: { id: true },
      });
      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateProjectInviteCode();
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Gagal membuat kode unik. Silakan coba lagi.' }, { status: 500 });
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.update({
        where: { id: projectId },
        data: { inviteCode },
        select: { id: true, inviteCode: true, projectName: true },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'INVITE_CODE_GENERATED',
          description: `Invite Code Generated/Regenerated for project "${proj.projectName}".`,
        },
      });

      return proj;
    });

    return NextResponse.json({ inviteCode: updatedProject.inviteCode, message: 'Invite Code berhasil diperbarui.' });
  } catch (err: any) {
    console.error('POST /api/projects/[id]/invite-code error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const member = await getProjectMember(projectId, currentUserId);

    if (!member || member.role !== 'OWNER') {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat menonaktifkan Invite Code.' }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { inviteCode: null },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'INVITE_CODE_REVOKED',
          description: `Invite Code deactivated for project #${projectId}.`,
        },
      });
    });

    return NextResponse.json({ message: 'Invite Code berhasil dinonaktifkan.' });
  } catch (err: any) {
    console.error('DELETE /api/projects/[id]/invite-code error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
