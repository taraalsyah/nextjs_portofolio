import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveProjectContext, ACTIVE_PROJECT_COOKIE } from '@/lib/active-project';
import { prisma } from '@/lib/prisma';
import { getProjectPermissions } from '@/lib/project';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    const context = await getActiveProjectContext(userId, session.user.name || undefined, req);

    if (!context) {
      return NextResponse.json({ error: 'No active project found.' }, { status: 404 });
    }

    return NextResponse.json({ activeProject: context });
  } catch (err: any) {
    console.error('GET /api/projects/active error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    const body = await req.json();
    const { projectId } = body;

    const parsedProjectId = parseInt(String(projectId), 10);
    if (!parsedProjectId || isNaN(parsedProjectId)) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    // Verify user is a member of target project
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: parsedProjectId,
          userId,
        },
      },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            projectName: true,
            visibility: true,
            ownerUserId: true,
          },
        },
      },
    });

    if (!membership || !membership.project) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek ini.' }, { status: 403 });
    }

    const role = membership.role as any;
    const activeProject = {
      projectId: membership.project.id,
      projectName: membership.project.projectName,
      visibility: membership.project.visibility,
      ownerUserId: membership.project.ownerUserId,
      memberRole: role,
      permissions: getProjectPermissions(role),
    };

    const response = NextResponse.json({ activeProject, success: true });
    response.cookies.set(ACTIVE_PROJECT_COOKIE, String(parsedProjectId), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    console.error('POST /api/projects/active error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
