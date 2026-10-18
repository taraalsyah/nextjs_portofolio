import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveProjectContext } from '@/lib/active-project';
import { DEFAULT_PHASE_NAME } from '@/lib/task-project-service';

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
    const phaseId = parseInt(id, 10);
    if (isNaN(phaseId) || phaseId <= 0) {
      return NextResponse.json({ error: 'ID Phase tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (!activeProject.permissions.canCreateTask && activeProject.permissions.role === 'VIEWER') {
      return NextResponse.json({ error: 'Anda tidak memiliki izin mengedit phase.' }, { status: 403 });
    }

    const phase = await prisma.taskPhase.findUnique({
      where: { id: phaseId },
      include: { taskProject: true },
    });

    if (!phase || phase.taskProject.projectId !== activeProject.projectId) {
      return NextResponse.json({ error: 'Phase tidak ditemukan.' }, { status: 404 });
    }

    const body = await req.json();
    const { name, action } = body;

    // Handle reordering: move_up or move_down
    if (action === 'move_up') {
      // Find previous phase with highest order < current
      const prevPhase = await prisma.taskPhase.findFirst({
        where: {
          taskProjectId: phase.taskProjectId,
          order: { lt: phase.order },
        },
        orderBy: { order: 'desc' },
      });

      if (!prevPhase) {
        return NextResponse.json({ message: 'Phase sudah berada di posisi teratas.' });
      }

      await prisma.$transaction([
        prisma.taskPhase.update({
          where: { id: phase.id },
          data: { order: prevPhase.order },
        }),
        prisma.taskPhase.update({
          where: { id: prevPhase.id },
          data: { order: phase.order },
        }),
      ]);

      return NextResponse.json({ success: true, message: 'Urutan phase berhasil diubah.' });
    }

    if (action === 'move_down') {
      // Find next phase with lowest order > current
      const nextPhase = await prisma.taskPhase.findFirst({
        where: {
          taskProjectId: phase.taskProjectId,
          order: { gt: phase.order },
        },
        orderBy: { order: 'asc' },
      });

      if (!nextPhase) {
        return NextResponse.json({ message: 'Phase sudah berada di posisi terbawah.' });
      }

      await prisma.$transaction([
        prisma.taskPhase.update({
          where: { id: phase.id },
          data: { order: nextPhase.order },
        }),
        prisma.taskPhase.update({
          where: { id: nextPhase.id },
          data: { order: phase.order },
        }),
      ]);

      return NextResponse.json({ success: true, message: 'Urutan phase berhasil diubah.' });
    }

    // Handle rename
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: 'Nama phase wajib diisi.' }, { status: 400 });
      }
      if (trimmedName.length > 100) {
        return NextResponse.json({ error: 'Nama phase maksimal 100 karakter.' }, { status: 400 });
      }
      if (trimmedName.toLowerCase() === DEFAULT_PHASE_NAME.toLowerCase()) {
        return NextResponse.json({ error: `Nama "${DEFAULT_PHASE_NAME}" adalah nama khusus.` }, { status: 400 });
      }

      // Check duplicate
      const duplicate = await prisma.taskPhase.findFirst({
        where: {
          taskProjectId: phase.taskProjectId,
          name: trimmedName,
          id: { not: phaseId },
        },
      });

      if (duplicate) {
        return NextResponse.json({ error: 'Phase dengan nama tersebut sudah ada di proyek ini.' }, { status: 409 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.taskPhase.update({
          where: { id: phaseId },
          data: { name: trimmedName },
          select: { id: true, name: true, order: true, taskProjectId: true },
        });

        // Also sync phase string column on linked tasks
        await tx.task.updateMany({
          where: { phaseId: phaseId },
          data: { phase: trimmedName },
        });

        return p;
      });

      return NextResponse.json({ taskPhase: updated });
    }

    return NextResponse.json({ error: 'Tidak ada perubahan yang dikirim.' }, { status: 400 });
  } catch (err: any) {
    console.error('PUT /api/task-phases/[id] error:', err);
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
    const phaseId = parseInt(id, 10);
    if (isNaN(phaseId) || phaseId <= 0) {
      return NextResponse.json({ error: 'ID Phase tidak valid.' }, { status: 400 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (!activeProject.permissions.canCreateTask && activeProject.permissions.role === 'VIEWER') {
      return NextResponse.json({ error: 'Anda tidak memiliki izin menghapus phase.' }, { status: 403 });
    }

    const phase = await prisma.taskPhase.findUnique({
      where: { id: phaseId },
      include: {
        taskProject: true,
        _count: { select: { tasks: true } },
      },
    });

    if (!phase || phase.taskProject.projectId !== activeProject.projectId) {
      return NextResponse.json({ error: 'Phase tidak ditemukan.' }, { status: 404 });
    }

    // Safely reassign all linked tasks to 'Tanpa Phase' and null phaseId
    await prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: { phaseId },
        data: {
          phaseId: null,
          phase: DEFAULT_PHASE_NAME,
        },
      });

      await tx.taskPhase.delete({
        where: { id: phaseId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Phase berhasil dihapus dan task telah dipindahkan ke "Tanpa Phase".',
    });
  } catch (err: any) {
    console.error('DELETE /api/task-phases/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
