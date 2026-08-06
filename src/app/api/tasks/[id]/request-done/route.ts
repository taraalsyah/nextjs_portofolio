import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity, isTaskLocked, getTaskLockedResponse } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { sendTaskDoneNotification } from '@/lib/notification';
import { ensureDoneRequestColumns } from '@/lib/ensure-db-columns';
import { getProjectMember, getProjectPermissions, ProjectRole } from '@/lib/project';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDoneRequestColumns().catch(() => {});
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(session.user.id || '0', 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const { id: paramsId } = await params;
    const taskId = parseInt(paramsId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        taskNumber: true,
        title: true,
        status: true,
        isLocked: true,
        assigneeId: true,
        projectId: true,
        doneRequestStatus: true,
        doneRequestedAt: true,
        doneReviewedAt: true,
        project: { select: { id: true, projectName: true } },
      },
    });

    if (!task || !task.projectId) {
      return NextResponse.json(
        { error: 'Task tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (isTaskLocked(task)) {
      return getTaskLockedResponse();
    }

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

    // Owner/Admin doesn't need to request done - they can set status directly
    const isOwnerOrAdmin = userRole === 'OWNER' || userRole === 'ADMIN';
    if (isOwnerOrAdmin) {
      return NextResponse.json(
        { error: 'Owner atau Admin tidak perlu mengajukan Request to Done. Anda dapat langsung mengubah status task ke Done.' },
        { status: 400 }
      );
    }

    // Only current Assignee can submit a done request
    if (task.assigneeId !== sessionUserId) {
      return NextResponse.json(
        { error: 'Hanya Assignee yang dapat mengajukan permintaan penyelesaian task (Request to Done).' },
        { status: 403 }
      );
    }

    // Task must not already be DONE or CLOSED
    if (task.status === 'DONE' || task.status === 'CLOSED') {
      return NextResponse.json(
        { error: `Task sudah dalam status ${task.status}. Tidak perlu mengajukan Request to Done.` },
        { status: 400 }
      );
    }

    // Task must be in IN_PROGRESS status
    if (task.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: `Tidak dapat mengajukan Request to Done. Task harus dalam status IN_PROGRESS terlebih dahulu. Status saat ini: ${task.status}` },
        { status: 400 }
      );
    }

    // Prevent duplicate pending requests
    if (task.doneRequestStatus === 'PENDING') {
      return NextResponse.json(
        { error: 'Done Request sudah diajukan dan masih menunggu persetujuan. Tidak dapat membuat permintaan duplikat.' },
        { status: 409 }
      );
    }

    // Parse optional request note
    const body = await req.json().catch(() => ({}));
    const note = body.note?.trim() || body.doneRequestNote?.trim() || null;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          doneRequestStatus: 'PENDING',
          doneRequestedById: sessionUserId,
          doneRequestedAt: new Date(),
          doneRequestNote: note,
          doneReviewedById: null,
          doneReviewedAt: null,
          doneRejectReason: null,
        },
        select: {
          id: true,
          taskNumber: true,
          title: true,
          status: true,
          doneRequestStatus: true,
          doneRequestedById: true,
          doneRequestedAt: true,
          doneRequestNote: true,
          doneReviewedAt: true,
          doneRequestedBy: {
            select: { id: true, name: true, username: true },
          },
        },
      });

      const userName = session.user?.name || 'Assignee';

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'DONE_REQUESTED',
        description: `${userName} requested task completion.${note ? ` Note: ${note}` : ''}`,
        fieldName: 'doneRequestStatus',
        previousValue: 'NONE',
        newValue: 'PENDING',
        tx,
      });

      return result;
    }, { timeout: 15000 });

    // Send notification asynchronously
    sendTaskDoneNotification({
      taskId,
      taskTitle: task.title,
      taskNumber: task.taskNumber,
      projectId: activeProject.projectId,
      projectName: task.project?.projectName || 'Project',
      userTitle: session.user.name || 'Assignee',
      requestStatus: 'PENDING',
      reason: note,
      actorUserId: sessionUserId,
    }).catch((err) => console.error('Notification dispatch error:', err));

    return NextResponse.json({ task: updatedTask }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
