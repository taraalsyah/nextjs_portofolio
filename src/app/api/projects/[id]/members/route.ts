import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProjectMember, getProjectPermissions, ProjectRole } from '@/lib/project';

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
    const membership = await getProjectMember(projectId, currentUserId);
    if (!membership) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek ini.' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true },
    });

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            status: true,
          },
        },
      },
    });

    const formattedMembers = members.map((m) => ({
      ...m,
      role: m.userId === project?.ownerUserId ? 'OWNER' : m.role,
    }));

    return NextResponse.json({ members: formattedMembers });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/members error:', err);
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
    const currentMember = await getProjectMember(projectId, currentUserId);
    const permissions = await getProjectPermissions(currentMember?.role, projectId);

    if (!permissions.canManageMembers) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin untuk mengundang anggota ke proyek ini.' }, { status: 403 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, projectName: true, ownerUserId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const body = await req.json();
    const { userId: targetUserIdInput, email: targetEmail, role: roleInput = 'MEMBER' } = body;

    // Rule: Owner role MUST NEVER be assigned during invitation
    if (roleInput === 'OWNER') {
      return NextResponse.json({ error: 'Peran Owner tidak dapat dipilih saat mengundang anggota. Gunakan fitur Transfer Ownership untuk mengalihkan kepemilikan.' }, { status: 400 });
    }

    let targetUserId = targetUserIdInput ? parseInt(String(targetUserIdInput), 10) : null;

    if (!targetUserId && targetEmail) {
      const userByEmail = await prisma.user.findUnique({
        where: { email: targetEmail.trim() },
        select: { id: true },
      });
      if (userByEmail) targetUserId = userByEmail.id;
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'Pengguna yang ingin diundang tidak ditemukan.' }, { status: 404 });
    }

    // Validate target user status
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    if (targetUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Pengguna tidak berstatus aktif.' }, { status: 400 });
    }

    if (targetUserId === project.ownerUserId) {
      return NextResponse.json({ error: 'Pengguna tersebut adalah Pemilik Proyek.' }, { status: 400 });
    }

    const validAssignRoles: ProjectRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];
    const roleToAdd: ProjectRole = validAssignRoles.includes(roleInput) ? roleInput : 'MEMBER';

    // Check duplicate invitation
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Pengguna sudah menjadi anggota proyek ini.' }, { status: 409 });
    }

    const member = await prisma.$transaction(async (tx) => {
      const created = await tx.projectMember.create({
        data: {
          projectId,
          userId: targetUserId,
          role: roleToAdd,
        },
        select: {
          id: true,
          projectId: true,
          userId: true,
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, username: true, image: true, status: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'MEMBER_ADDED',
          description: `Member Invited: Mengundang "${created.user.name}" (${created.role}) ke dalam proyek.`,
        },
      });

      return created;
    }, { maxWait: 10000, timeout: 10000 });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/projects/[id]/members error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const currentMember = await getProjectMember(projectId, currentUserId);

    if (currentMember?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat mengubah peran anggota.' }, { status: 403 });
    }

    const body = await req.json();
    const { userId: targetUserIdInput, role: newRoleInput } = body;
    const targetUserId = parseInt(String(targetUserIdInput), 10);

    if (!targetUserId || isNaN(targetUserId)) {
      return NextResponse.json({ error: 'Target pengguna tidak valid.' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true },
    });

    if (project?.ownerUserId === targetUserId) {
      return NextResponse.json({ error: 'Peran pemilik utama proyek tidak dapat diubah dari sini. Gunakan fitur Transfer Ownership.' }, { status: 400 });
    }

    if (newRoleInput === 'OWNER') {
      return NextResponse.json({ error: 'Peran Owner hanya dapat dialihkan melalui fitur Transfer Ownership.' }, { status: 400 });
    }

    const validRoles: ProjectRole[] = ['ADMIN', 'MEMBER', 'VIEWER'];
    if (!validRoles.includes(newRoleInput)) {
      return NextResponse.json({ error: 'Peran baru tidak valid.' }, { status: 400 });
    }

    const updatedMember = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectMember.update({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
        data: { role: newRoleInput },
        select: {
          id: true,
          projectId: true,
          userId: true,
          role: true,
          joinedAt: true,
          user: { select: { id: true, name: true, email: true, username: true, image: true, status: true } },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'ROLE_CHANGED',
          description: `Project Role Changed: Mengubah peran "${updated.user.name}" menjadi ${newRoleInput}.`,
        },
      });

      return updated;
    }, { maxWait: 10000, timeout: 10000 });

    return NextResponse.json({ member: updatedMember });
  } catch (err: any) {
    console.error('PUT /api/projects/[id]/members error:', err);
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
    const currentMember = await getProjectMember(projectId, currentUserId);

    if (currentMember?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat menghapus anggota.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserIdParam = searchParams.get('userId');
    const targetUserId = targetUserIdParam ? parseInt(targetUserIdParam, 10) : 0;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target pengguna tidak valid.' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true },
    });

    if (project?.ownerUserId === targetUserId) {
      return NextResponse.json({ error: 'Pemilik utama proyek tidak dapat dihapus.' }, { status: 400 });
    }

    // Check member count: Cannot remove the last remaining member
    const memberCount = await prisma.projectMember.count({
      where: { projectId },
    });

    if (memberCount <= 1) {
      return NextResponse.json({ error: 'Tidak dapat menghapus satu-satunya anggota proyek.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { name: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: {
          projectId_userId: {
            projectId,
            userId: targetUserId,
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          projectId,
          action: 'MEMBER_REMOVED',
          description: `Member Removed: Menghapus anggota "${targetUser?.name || targetUserId}" dari proyek.`,
        },
      });
    }, { maxWait: 10000, timeout: 10000 });

    return NextResponse.json({ success: true, message: 'Anggota berhasil dihapus dari proyek.' });
  } catch (err: any) {
    console.error('DELETE /api/projects/[id]/members error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
