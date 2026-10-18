import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveProjectContext } from '@/lib/active-project';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    // Ensure default 'Tanpa Proyek' exists
    const { getOrCreateDefaultTaskProject, DEFAULT_TASK_PROJECT_NAME } = await import('@/lib/task-project-service');
    await getOrCreateDefaultTaskProject(activeProject.projectId);

    const taskProjects = await prisma.taskProject.findMany({
      where: { projectId: activeProject.projectId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        phases: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            order: true,
            _count: { select: { tasks: true } },
          },
        },
        _count: { select: { tasks: true, phases: true } },
      },
    });

    // Sort Tanpa Proyek first, then others alphabetically
    taskProjects.sort((a, b) => {
      if (a.name === DEFAULT_TASK_PROJECT_NAME) return -1;
      if (b.name === DEFAULT_TASK_PROJECT_NAME) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ taskProjects });
  } catch (err: any) {
    console.error('GET /api/task-projects error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (!activeProject.permissions.canCreateTask) {
      return NextResponse.json({ error: 'Anda tidak memiliki izin untuk membuat proyek/fitur.' }, { status: 403 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama proyek/fitur wajib diisi.' }, { status: 400 });
    }

    if (name.trim().length > 200) {
      return NextResponse.json({ error: 'Nama proyek/fitur maksimal 200 karakter.' }, { status: 400 });
    }

    // Check for duplicates within the same workspace project
    const existing = await prisma.taskProject.findUnique({
      where: {
        projectId_name: {
          projectId: activeProject.projectId,
          name: name.trim(),
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Proyek/fitur dengan nama tersebut sudah ada.' }, { status: 409 });
    }

    const taskProject = await prisma.taskProject.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        projectId: activeProject.projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ taskProject }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/task-projects error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
