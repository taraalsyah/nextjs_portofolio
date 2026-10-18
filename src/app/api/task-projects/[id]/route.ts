import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveProjectContext } from '@/lib/active-project';
import { DEFAULT_TASK_PROJECT_NAME, getOrCreateDefaultTaskProject } from '@/lib/task-project-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { id } = await params;
    const projectSubId = parseInt(id, 10);
    if (isNaN(projectSubId) || projectSubId <= 0) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const taskProject = await prisma.taskProject.findFirst({
      where: {
        id: projectSubId,
        projectId: activeProject.projectId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        phases: {
          orderBy: { order: 'asc' },
          select: { id: true, name: true, order: true },
        },
        _count: { select: { tasks: true, phases: true } },
      },
    });

    if (!taskProject) {
      return NextResponse.json({ error: 'Proyek/fitur tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ taskProject });
  } catch (err: any) {
    console.error('GET /api/task-projects/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { id } = await params;
    const projectSubId = parseInt(id, 10);
    if (isNaN(projectSubId) || projectSubId <= 0) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (!activeProject.permissions.canCreateTask && activeProject.permissions.role === 'VIEWER') {
      return NextResponse.json({ error: 'Anda tidak memiliki izin mengedit proyek/fitur.' }, { status: 403 });
    }

    const taskProject = await prisma.taskProject.findFirst({
      where: {
        id: projectSubId,
        projectId: activeProject.projectId,
      },
    });

    if (!taskProject) {
      return NextResponse.json({ error: 'Proyek/fitur tidak ditemukan.' }, { status: 404 });
    }

    if (taskProject.name === DEFAULT_TASK_PROJECT_NAME) {
      return NextResponse.json({ error: 'Proyek default "Tanpa Proyek" tidak dapat diubah namanya.' }, { status: 400 });
    }

    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama proyek/fitur wajib diisi.' }, { status: 400 });
    }

    if (name.trim().length > 200) {
      return NextResponse.json({ error: 'Nama proyek/fitur maksimal 200 karakter.' }, { status: 400 });
    }

    // Check duplicate name
    const duplicate = await prisma.taskProject.findFirst({
      where: {
        projectId: activeProject.projectId,
        name: name.trim(),
        id: { not: projectSubId },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: 'Proyek/fitur dengan nama tersebut sudah ada.' }, { status: 409 });
    }

    const updated = await prisma.taskProject.update({
      where: { id: projectSubId },
      data: {
        name: name.trim(),
        description: description !== undefined ? (description?.trim() || null) : taskProject.description,
      },
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ taskProject: updated });
  } catch (err: any) {
    console.error('PUT /api/task-projects/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { id } = await params;
    const projectSubId = parseInt(id, 10);
    if (isNaN(projectSubId) || projectSubId <= 0) {
      return NextResponse.json({ error: 'ID Proyek tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (!activeProject.permissions.canCreateTask && activeProject.permissions.role === 'VIEWER') {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menghapus proyek/fitur.' }, { status: 403 });
    }

    const taskProject = await prisma.taskProject.findFirst({
      where: {
        id: projectSubId,
        projectId: activeProject.projectId,
      },
      include: {
        _count: { select: { tasks: true, phases: true } },
      },
    });

    if (!taskProject) {
      return NextResponse.json({ error: 'Proyek/fitur tidak ditemukan.' }, { status: 404 });
    }

    if (taskProject.name === DEFAULT_TASK_PROJECT_NAME) {
      return NextResponse.json({ error: 'Proyek default "Tanpa Proyek" tidak dapat dihapus.' }, { status: 400 });
    }

    const defaultTp = await getOrCreateDefaultTaskProject(activeProject.projectId);

    // Reassign all tasks from this project to default "Tanpa Proyek" and clear phase
    await prisma.$transaction(async (tx) => {
      if (defaultTp) {
        await tx.task.updateMany({
          where: { taskProjectId: projectSubId },
          data: {
            taskProjectId: defaultTp.id,
            phaseId: null,
            phase: 'Tanpa Phase',
          },
        });
      }

      // Delete the TaskProject (phases cascade deleted)
      await tx.taskProject.delete({
        where: { id: projectSubId },
      });
    });

    return NextResponse.json({ success: true, message: 'Proyek/fitur berhasil dihapus.' });
  } catch (err: any) {
    console.error('DELETE /api/task-projects/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
