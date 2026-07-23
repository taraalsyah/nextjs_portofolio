import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getProjectMember, getProjectPermissions } from '@/lib/project';

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
    const currentMember = await getProjectMember(projectId, currentUserId);
    const permissions = await getProjectPermissions(currentMember?.role, projectId);

    if (!permissions.canManageMembers) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses untuk mengundang anggota.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10), 1), 20);

    // Rule: Minimum input length 3 characters before performing database search
    if (!q || q.length < 3) {
      return NextResponse.json({ users: [], total: 0, page, limit, hasMore: false });
    }

    // Get project details to exclude owner
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerUserId: true },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    // Fetch existing project member IDs
    const existingMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });

    const excludedUserIds = new Set<number>([
      ...existingMembers.map((m) => m.userId),
      project.ownerUserId,
    ]);

    const where: any = {
      id: { notIn: Array.from(excludedUserIds) },
      status: 'ACTIVE',
      OR: [
        { email: { contains: q } },
        { username: { contains: q } },
        { name: { contains: q } },
      ],
    };

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        image: true,
        role: true,
      },
    });

    const hasMore = page * limit < total;

    return NextResponse.json({ users, total, page, limit, hasMore });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/members/search-users error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
