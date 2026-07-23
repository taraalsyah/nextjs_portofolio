import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext } from '@/lib/active-project';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'No active project found.' }, { status: 404 });
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId: activeProject.projectId },
      orderBy: { joinedAt: 'asc' },
      select: {
        id: true,
        projectId: true,
        userId: true,
        role: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    const users = members.map((m) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    return NextResponse.json({ users, members, activeProject });
  } catch (err: any) {
    console.error('GET /api/projects/active/members error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
