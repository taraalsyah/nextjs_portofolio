import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveProjectContext } from '@/lib/active-project';
import { DEFAULT_PHASE_NAME } from '@/lib/task-project-service';

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

    const { searchParams } = new URL(req.url);
    const taskProjectIdStr = searchParams.get('taskProjectId');

    if (!taskProjectIdStr) {
      return NextResponse.json({ error: 'taskProjectId wajib diberikan.' }, { status: 400 });
    }

    const taskProjectId = parseInt(taskProjectIdStr, 10);
    if (isNaN(taskProjectId) || taskProjectId <= 0) {
      return NextResponse.json({ error: 'taskProjectId tidak valid.' }, { status: 400 });
    }

    // Verify taskProject belongs to active workspace project
    const taskProject = await prisma.taskProject.findFirst({
      where: {
        id: taskProjectId,
        projectId: activeProject.projectId,
      },
    });

    if (!taskProject) {
      return NextResponse.json({ error: 'Proyek/fitur tidak ditemukan.' }, { status: 404 });
    }

    const phases = await prisma.taskPhase.findMany({
      where: { taskProjectId },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        order: true,
        taskProjectId: true,
        createdAt: true,
        _count: { select: { tasks: true } },
      },
    });

    return NextResponse.json({ phases });
  } catch (err: any) {
    console.error('GET /api/task-phases error:', err);
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

    if (!activeProject.permissions.canCreateTask && activeProject.permissions.role === 'VIEWER') {
      return NextResponse.json({ error: 'Anda tidak memiliki izin membuat phase.' }, { status: 403 });
    }

    const body = await req.json();
    const { taskProjectId, name } = body;

    if (!taskProjectId) {
      return NextResponse.json({ error: 'taskProjectId wajib diberikan.' }, { status: 400 });
    }

    const parsedTpId = parseInt(String(taskProjectId), 10);
    if (isNaN(parsedTpId) || parsedTpId <= 0) {
      return NextResponse.json({ error: 'taskProjectId tidak valid.' }, { status: 400 });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama phase wajib diisi.' }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 100) {
      return NextResponse.json({ error: 'Nama phase maksimal 100 karakter.' }, { status: 400 });
    }

    if (trimmedName.toLowerCase() === DEFAULT_PHASE_NAME.toLowerCase()) {
      return NextResponse.json({ error: `Nama "${DEFAULT_PHASE_NAME}" adalah nama khusus dan tidak dapat dibuat.` }, { status: 400 });
    }

    // Verify taskProject belongs to active workspace project
    const taskProject = await prisma.taskProject.findFirst({
      where: {
        id: parsedTpId,
        projectId: activeProject.projectId,
      },
    });

    if (!taskProject) {
      return NextResponse.json({ error: 'Proyek/fitur tidak ditemukan.' }, { status: 404 });
    }

    // Check unique phase name within this taskProject
    const duplicate = await prisma.taskPhase.findUnique({
      where: {
        taskProjectId_name: {
          taskProjectId: parsedTpId,
          name: trimmedName,
        },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Phase dengan nama tersebut sudah ada di proyek ini.' }, { status: 409 });
    }

    // Get highest current order
    const maxOrderPhase = await prisma.taskPhase.findFirst({
      where: { taskProjectId: parsedTpId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = maxOrderPhase ? maxOrderPhase.order + 1 : 0;

    const taskPhase = await prisma.taskPhase.create({
      data: {
        taskProjectId: parsedTpId,
        name: trimmedName,
        order: nextOrder,
      },
      select: {
        id: true,
        name: true,
        order: true,
        taskProjectId: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ taskPhase }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/task-phases error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
