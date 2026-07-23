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

    const userId = parseInt((session.user as any).id || '0', 10);
    const membership = await getProjectMember(projectId, userId);

    if (!membership) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek ini.' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        projectName: true,
        description: true,
        ownerUserId: true,
        visibility: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { members: true, tasks: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const permissions = getProjectPermissions(membership.role);
    return NextResponse.json({ project, permissions, currentRole: membership.role });
  } catch (err: any) {
    console.error('GET /api/projects/[id] error:', err);
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

    const userId = parseInt((session.user as any).id || '0', 10);
    const membership = await getProjectMember(projectId, userId);
    const permissions = getProjectPermissions(membership?.role);

    if (!permissions.canEditProject) {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat mengubah detail proyek.' }, { status: 403 });
    }

    const body = await req.json();
    const { projectName, description, visibility } = body;

    if (!projectName || !projectName.trim()) {
      return NextResponse.json({ error: 'Nama proyek wajib diisi.' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.update({
        where: { id: projectId },
        data: {
          projectName: projectName.trim(),
          description: description?.trim() || null,
          visibility: visibility === 'TEAM' ? 'TEAM' : 'PRIVATE',
        },
        select: {
          id: true,
          projectName: true,
          description: true,
          ownerUserId: true,
          visibility: true,
          updatedAt: true,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          projectId,
          action: 'PROJECT_UPDATED',
          description: `Memperbarui Proyek: "${proj.projectName}"`,
        },
      });

      return proj;
    });

    return NextResponse.json({ project: updated });
  } catch (err: any) {
    console.error('PUT /api/projects/[id] error:', err);
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

    const userId = parseInt((session.user as any).id || '0', 10);
    const membership = await getProjectMember(projectId, userId);
    const permissions = getProjectPermissions(membership?.role);

    if (!permissions.canDeleteProject) {
      return NextResponse.json({ error: 'Hanya OWNER proyek yang dapat menghapus proyek.' }, { status: 403 });
    }

    // Full cascading transactional deletion of project resources
    await prisma.$transaction(
      async (tx) => {
        // Fetch all task IDs belonging to project
        const projectTasks = await tx.task.findMany({
          where: { projectId },
          select: { id: true },
        });
        const taskIds = projectTasks.map((t) => t.id);

        if (taskIds.length > 0) {
          await tx.taskChecklist.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.taskComment.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.taskAttachment.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.taskHistory.deleteMany({ where: { taskId: { in: taskIds } } });
          await tx.task.deleteMany({ where: { id: { in: taskIds } } });
        }

        await tx.projectMember.deleteMany({ where: { projectId } });
        await tx.activityLog.create({
          data: {
            userId,
            action: 'PROJECT_DELETED',
            description: `Menghapus Proyek (ID: ${projectId}) beserta seluruh task di dalamnya.`,
          },
        });
        await tx.project.delete({ where: { id: projectId } });
      },
      { timeout: 20000 }
    );

    return NextResponse.json({ success: true, message: 'Proyek berhasil dihapus.' });
  } catch (err: any) {
    console.error('DELETE /api/projects/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
