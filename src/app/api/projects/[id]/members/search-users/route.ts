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
    const permissions = getProjectPermissions(currentMember?.role);

    if (!permissions.canManageMembers) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses untuk mengundang anggota.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();

    // Fetch existing member user IDs to exclude from search results
    const existingMembers = await prisma.projectMember.findMany({
      where: { projectId },
      select: { userId: true },
    });
    const existingUserIds = existingMembers.map((m) => m.userId);

    const where: any = {
      id: { notIn: existingUserIds },
      status: 'ACTIVE',
    };

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { username: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('GET /api/projects/[id]/members/search-users error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
