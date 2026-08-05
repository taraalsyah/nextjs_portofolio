import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskActivity } from '@/lib/task';
import { getActiveProjectContext } from '@/lib/active-project';
import { validateWorkflowTransition, getProjectMember, getProjectPermissions, ProjectRole } from '@/lib/project';
import { ensureDoneRequestColumns } from '@/lib/ensure-db-columns';

// Updated route with Done Request Approval Workflow & Stale-Client Purging
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureDoneRequestColumns().catch(() => { });
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(session.user.id || '0', 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const { id: getParamsId } = await params;
    const taskId = parseInt(getParamsId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
      select: {
        id: true,
        taskNumber: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        assigneeId: true,
        createdById: true,
        categoryId: true,
        tags: true,
        startDate: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        closeRequestStatus: true,
        closeRequestedById: true,
        closeRequestedAt: true,
        closeRequestReason: true,
        closeReviewedById: true,
        closeReviewedAt: true,
        closeRejectReason: true,
        closeRequestedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        closeReviewedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        doneRequestStatus: true,
        doneRequestedById: true,
        doneRequestedAt: true,
        doneRequestNote: true,
        doneReviewedById: true,
        doneReviewedAt: true,
        doneRejectReason: true,
        doneRequestedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        doneReviewedBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        assignee: { select: { id: true, name: true, username: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        category: { select: { id: true, name: true, description: true } },
        checklists: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true, username: true, image: true } },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileSize: true,
            fileType: true,
            createdAt: true,
            uploadedById: true,
            uploadedBy: { select: { id: true, name: true } },
          },
        },
        histories: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            fieldName: true,
            previousValue: true,
            newValue: true,
            createdAt: true,
            userId: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!task || !task.projectId) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    let userPermissions = activeProject.permissions;
    if (task.projectId !== activeProject.projectId) {
      const membership = await getProjectMember(task.projectId, sessionUserId);
      if (!membership) {
        return NextResponse.json({ error: 'Anda tidak memiliki akses ke proyek task ini.' }, { status: 403 });
      }
      userPermissions = await getProjectPermissions(membership.role as ProjectRole, task.projectId);
    }

    return NextResponse.json({ task, userPermissions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
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

    const sessionUserId = parseInt(session.user.id || '0', 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    const { id: putParamsId } = await params;
    const taskId = parseInt(putParamsId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const oldTask = await prisma.task.findFirst({
      where: { id: taskId, projectId: activeProject.projectId, deletedAt: null },
      include: { assignee: true, category: true },
    });

    if (!oldTask) {
      return NextResponse.json({ error: 'Task tidak ditemukan atau tidak berada pada proyek ini.' }, { status: 404 });
    }

    const permissions = activeProject.permissions;

    // 🔒 PATCH/PUT full task update: ONLY OWNER or ADMIN
    if (permissions.role !== 'OWNER' && permissions.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Anda tidak memiliki izin untuk memperbarui task ini. Hanya OWNER atau ADMIN yang dapat mengubah informasi task.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      categoryId,
      tags,
      startDate,
      dueDate,
    } = body;

    // 🔒 WORKFLOW STATUS VALIDATION
    if (status !== undefined && status !== oldTask.status) {
      const val = await validateWorkflowTransition(
        permissions.role,
        permissions,
        sessionUserId,
        oldTask.assigneeId,
        oldTask.status,
        status,
        activeProject.projectId
      );

      if (!val.allowed) {
        return NextResponse.json({ error: val.reason || 'Akses ditolak.' }, { status: 403 });
      }
    }

    if (title !== undefined && (!title || !title.trim())) {
      return NextResponse.json({ error: 'Judul task wajib diisi.' }, { status: 400 });
    }
    if (title && title.trim().length > 200) {
      return NextResponse.json({ error: 'Judul task maksimal 200 karakter.' }, { status: 400 });
    }

    const parsedStartDate = startDate !== undefined ? (startDate ? new Date(startDate) : null) : oldTask.startDate;
    const parsedDueDate = dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : oldTask.dueDate;

    if (parsedStartDate && parsedDueDate && parsedDueDate < parsedStartDate) {
      return NextResponse.json(
        { error: 'Tanggal deadline (Due Date) tidak boleh lebih awal dari Start Date.' },
        { status: 400 }
      );
    }

    let newAssigneeId = oldTask.assigneeId;
    if (assigneeId !== undefined) {
      const parsedAssId = assigneeId ? parseInt(String(assigneeId), 10) : null;
      if (parsedAssId !== oldTask.assigneeId && !permissions.canAssignTask && permissions.role !== 'OWNER' && permissions.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Hanya OWNER atau ADMIN yang dapat melakukan penugasan (assignee).' }, { status: 403 });
      }

      if (parsedAssId) {
        const isMember = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: activeProject.projectId,
              userId: parsedAssId,
            },
          },
        });

        if (!isMember) {
          return NextResponse.json({ error: 'Assignee harus merupakan anggota dari proyek ini.' }, { status: 403 });
        }
      }
      newAssigneeId = parsedAssId;
    }

    const updatedTask = await prisma.$transaction(async (tx) => {
      const taskRes = await tx.task.update({
        where: { id: taskId },
        data: {
          title: title ? title.trim() : oldTask.title,
          description: description !== undefined ? description.trim() : oldTask.description,
          status: status || oldTask.status,
          priority: priority || oldTask.priority,
          assigneeId: newAssigneeId,
          categoryId: categoryId !== undefined ? (categoryId ? parseInt(String(categoryId), 10) : null) : oldTask.categoryId,
          tags: tags !== undefined ? (tags?.trim() || null) : oldTask.tags,
          startDate: parsedStartDate,
          dueDate: parsedDueDate,
        },
        select: {
          id: true,
          taskNumber: true,
          projectId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          assigneeId: true,
          createdById: true,
          categoryId: true,
          tags: true,
          startDate: true,
          dueDate: true,
          createdAt: true,
          updatedAt: true,
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
        },
      });

      const changes: string[] = [];
      if (oldTask.status !== taskRes.status) {
        changes.push(`Status: ${oldTask.status} → ${taskRes.status}`);
        await logTaskActivity({
          taskId,
          userId: sessionUserId,
          action: 'STATUS_CHANGE',
          description: `Mengubah status task ${oldTask.taskNumber} dari ${oldTask.status} ke ${taskRes.status}`,
          fieldName: 'status',
          previousValue: oldTask.status,
          newValue: taskRes.status,
          tx,
        });
      }

      if (oldTask.priority !== taskRes.priority) {
        changes.push(`Priority: ${oldTask.priority} → ${taskRes.priority}`);
        await logTaskActivity({
          taskId,
          userId: sessionUserId,
          action: 'PRIORITY_CHANGE',
          description: `Mengubah priority task ${oldTask.taskNumber} dari ${oldTask.priority} ke ${taskRes.priority}`,
          fieldName: 'priority',
          previousValue: oldTask.priority,
          newValue: taskRes.priority,
          tx,
        });
      }

      if (changes.length > 0) {
        await logTaskActivity({
          taskId,
          userId: sessionUserId,
          action: 'TASK_UPDATED',
          description: `Memperbarui Task ${taskRes.taskNumber}:\n${changes.join('\n')}`,
          tx,
        });
      }

      return taskRes;
    });

    return NextResponse.json({ task: updatedTask });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
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

    const sessionUserId = parseInt(session.user.id || '0', 10);
    const activeProject = await getActiveProjectContext(sessionUserId, session.user.name || undefined, req);

    if (!activeProject) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    if (!activeProject.permissions.canDeleteTask) {
      return NextResponse.json({ error: 'Akses ditolak. Hanya OWNER atau ADMIN proyek yang dapat menghapus task.' }, { status: 403 });
    }

    const { id: deleteParamsId } = await params;
    const taskId = parseInt(deleteParamsId, 10);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'ID Task tidak valid.' }, { status: 400 });
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, projectId: activeProject.projectId, deletedAt: null },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task tidak ditemukan.' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: { id: taskId },
        data: { deletedAt: new Date() },
      });

      await logTaskActivity({
        taskId,
        userId: sessionUserId,
        action: 'TASK_DELETED',
        description: `Soft Delete Task ${task.taskNumber} - "${task.title}"`,
        tx,
      });
    });

    return NextResponse.json({ message: 'Task berhasil dihapus (Soft Delete).' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
