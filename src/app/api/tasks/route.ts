import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateNextTaskNumber, logTaskActivity } from '@/lib/task';
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

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode') || 'all'; // 'all' | 'my' | 'kanban' | 'calendar'
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
    const limit = Math.max(parseInt(searchParams.get('limit') || '10', 10), 1);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const reqAssigneeId = searchParams.get('assigneeId') || '';
    const reqCreatedById = searchParams.get('createdById') || '';
    const dueDate = searchParams.get('dueDate') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = (searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // 🔒 STRICT PROJECT ISOLATION & SOFT DELETE FILTER
    const where: any = {
      projectId: activeProject.projectId,
      deletedAt: null,
    };

    if (mode === 'my') {
      where.assigneeId = sessionUserId;
    } else if (reqAssigneeId) {
      const parsedAssId = parseInt(reqAssigneeId, 10);
      if (!isNaN(parsedAssId)) where.assigneeId = parsedAssId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (categoryId) {
      const parsedCatId = parseInt(categoryId, 10);
      if (!isNaN(parsedCatId)) where.categoryId = parsedCatId;
    }
    if (reqCreatedById) {
      const parsedCreatedById = parseInt(reqCreatedById, 10);
      if (!isNaN(parsedCreatedById)) where.createdById = parsedCreatedById;
    }

    if (dueDate) {
      const targetDate = new Date(dueDate);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.dueDate = { gte: startOfDay, lte: endOfDay };
    }

    // Search scoped to active project
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { taskNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'dueDate') orderBy = { dueDate: sortOrder };
    else if (sortBy === 'priority') orderBy = { priority: sortOrder };
    else if (sortBy === 'updatedAt') orderBy = { updatedAt: sortOrder };
    else orderBy = { createdAt: sortOrder };

    const totalItems = await prisma.task.count({ where });

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip: mode === 'kanban' || mode === 'calendar' ? undefined : (page - 1) * limit,
      take: mode === 'kanban' || mode === 'calendar' ? undefined : limit,
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
        assignee: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true } },
        checklists: { select: { id: true, isCompleted: true } },
        _count: { select: { comments: true, attachments: true, checklists: true } },
      },
    });

    return NextResponse.json({
      tasks,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
      activeProject,
    });
  } catch (err: any) {
    console.error('GET /api/tasks error:', err);
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

    // Permission check
    if (!activeProject.permissions.canCreateTask) {
      return NextResponse.json({ error: 'Peran Anda (VIEWER) tidak memiliki izin membuat task.' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      status = 'BACKLOG',
      priority = 'MEDIUM',
      assigneeId,
      categoryId,
      tags,
      startDate,
      dueDate,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul task wajib diisi.' }, { status: 400 });
    }
    if (title.trim().length > 200) {
      return NextResponse.json({ error: 'Judul task maksimal 200 karakter.' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Deskripsi task wajib diisi.' }, { status: 400 });
    }

    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedDueDate = dueDate ? new Date(dueDate) : null;

    if (parsedStartDate && parsedDueDate && parsedDueDate < parsedStartDate) {
      return NextResponse.json(
        { error: 'Tanggal deadline (Due Date) tidak boleh lebih awal dari Start Date.' },
        { status: 400 }
      );
    }

    let targetAssigneeId = assigneeId ? parseInt(String(assigneeId), 10) : null;

    // 🔒 BACKEND ASSIGNEE VALIDATION: Verify assignee belongs to active project
    if (targetAssigneeId) {
      const isMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: activeProject.projectId,
            userId: targetAssigneeId,
          },
        },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'Assignee harus merupakan anggota dari proyek aktif ini.' },
          { status: 403 }
        );
      }
    }

    // Atomic creation
    const task = await prisma.$transaction(async (tx) => {
      const taskNumber = await generateNextTaskNumber(tx);

      const createdTask = await tx.task.create({
        data: {
          taskNumber,
          projectId: activeProject.projectId,
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          assigneeId: targetAssigneeId,
          createdById: sessionUserId,
          categoryId: categoryId ? parseInt(String(categoryId), 10) : null,
          tags: tags?.trim() || null,
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

      await logTaskActivity({
        taskId: createdTask.id,
        userId: sessionUserId,
        action: 'TASK_CREATED',
        description: `Membuat Task Baru: ${createdTask.taskNumber} - "${createdTask.title}"`,
        newValue: `Status: ${createdTask.status}, Priority: ${createdTask.priority}`,
        tx,
      });

      return createdTask;
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/tasks error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
