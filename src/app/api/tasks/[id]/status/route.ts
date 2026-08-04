import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidStatusTransition, logTaskActivity } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { validateWorkflowTransition, getProjectMember, getProjectPermissions, ProjectRole } from '@/lib/project';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(session.user.id || '0', 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const { id: statusParamsId } = await params;
    const taskId = parseInt(statusParamsId, 10);

    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus || !['BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE', 'CLOSED'].includes(newStatus)) {
      return NextResponse.json({ error: 'Status tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        assigneeId: true,
        projectId: true,
        doneRequestStatus: true,
        closeRequestStatus: true,
      },
    });

    if (!task || !task.projectId) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    // Dynamic resolution of project membership & permissions for the task's project
    let userRole: ProjectRole | null = null;
    let permissions = activeProject.permissions;

    if (task.projectId === activeProject.projectId) {
      userRole = activeProject.permissions.role;
    } else {
      const membership = await getProjectMember(task.projectId, sessionUserId);
      if (membership) {
        userRole = membership.role as ProjectRole;
        permissions = await getProjectPermissions(userRole, task.projectId);
      }
    }

    if (!userRole) {
      return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek task ini.' }, { status: 403 });
    }

    // 🔒 WORKFLOW TRANSITION & TASK OWNERSHIP SECURITY VALIDATION
    const validation = await validateWorkflowTransition(
      userRole,
      permissions,
      sessionUserId,
      task.assigneeId,
      task.status,
      newStatus,
      task.projectId
    );

    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.reason || 'Anda tidak memiliki izin untuk mengubah status task ini.' },
        { status: 403 }
      );
    }

    if (!isValidStatusTransition(task.status, newStatus)) {
      return NextResponse.json(
        { error: `Perubahan status dari ${task.status} ke ${newStatus} tidak diizinkan.` },
        { status: 400 }
      );
    }

    // Transactional Update & Activity History Logging
    const updatedTask = await prisma.$transaction(async (tx) => {
      const requestUpdates: Record<string, unknown> = {};

      // If Owner/Admin sets to DONE or CLOSED directly and there's a pending done request, auto-resolve it
      if ((newStatus === 'DONE' || newStatus === 'CLOSED') && task.doneRequestStatus === 'PENDING') {
        requestUpdates.doneRequestStatus = 'APPROVED';
        requestUpdates.doneReviewedById = sessionUserId;
        requestUpdates.doneReviewedAt = new Date();
        requestUpdates.doneRejectReason = null;
      }

      // If Owner/Admin sets to CLOSED and there's a pending close request, auto-resolve it
      if (newStatus === 'CLOSED' && task.closeRequestStatus === 'PENDING') {
        requestUpdates.closeRequestStatus = 'APPROVED';
        requestUpdates.closeReviewedById = sessionUserId;
        requestUpdates.closeReviewedAt = new Date();
        requestUpdates.closeRejectReason = null;
      }

      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          ...requestUpdates,
        },
        select: {
          id: true,
          taskNumber: true,
          projectId: true,
          title: true,
          status: true,
          priority: true,
          assigneeId: true,
          assignee: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'STATUS_CHANGE',
        description: `Workflow Transition: Transisi status ${task.taskNumber} (${task.status} → ${newStatus}) oleh ${session.user?.name || 'User'}.`,
        fieldName: 'status',
        previousValue: task.status,
        newValue: newStatus,
        tx,
      });

      return updated;
    }, { timeout: 15000 });

    return NextResponse.json({ task: updatedTask });
  } catch (err: unknown) {
    console.error('PATCH /api/tasks/[id]/status error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}