import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateNextTaskNumber, logTaskActivity } from '@/lib/task';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const role = (session.user as any).role || 'Staff';
    const rawId = (session.user as any).id || (session.user as any).sub || '0';
    const sessionUserId = parseInt(String(rawId), 10) || 0;

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

    // Construct Prisma WHERE clause strictly using FK IDs
    const where: any = {};

    // 🔒 STRICT ROLE-BASED ACCESS CONTROL & FK QUERYING
    if (role !== 'Admin') {
      // Non-Admin can NEVER view tasks assigned to others regardless of client query parameters!
      where.assigneeId = sessionUserId;
    } else {
      // Admin can filter by any specific assignee_id if requested
      if (mode === 'my') {
        where.assigneeId = sessionUserId;
      } else if (reqAssigneeId) {
        const parsedAssId = parseInt(reqAssigneeId, 10);
        if (!isNaN(parsedAssId)) where.assigneeId = parsedAssId;
      }
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

    // Global Search (Task Number, Title, Description, Tags)
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { taskNumber: { contains: q } },
        { title: { contains: q } },
        { description: { contains: q } },
        { tags: { contains: q } },
      ];
    }

    // Sorting
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
        assignee: { select: { id: true, name: true, username: true, email: true, image: true } },
        createdBy: { select: { id: true, name: true, username: true, email: true, image: true } },
        category: { select: { id: true, name: true, description: true } },
        checklists: { select: { id: true, isCompleted: true } },
        _count: { select: { comments: true, attachments: true, checklists: true } },
      },
    });

    return NextResponse.json({
      tasks,
      totalItems,
      currentPage: page,
      totalPages: Math.ceil(totalItems / limit),
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

    const role = (session.user as any).role || 'Staff';
    const rawId = (session.user as any).id || (session.user as any).sub || '0';
    const sessionUserId = parseInt(String(rawId), 10) || 0;
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

    // Validation
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

    // Assignee authorization check: Non-Admin can only assign tasks to themselves!
    let targetAssigneeId = assigneeId ? parseInt(String(assigneeId), 10) : null;
    if (role !== 'Admin') {
      targetAssigneeId = sessionUserId;
    }

    const taskNumber = await generateNextTaskNumber();

    const task = await prisma.task.create({
      data: {
        taskNumber,
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

    // Log to Task History & Global Activity History
    await logTaskActivity({
      taskId: task.id,
      userId: sessionUserId,
      action: 'TASK_CREATED',
      description: `Membuat Task Baru: ${task.taskNumber} - "${task.title}"`,
      newValue: `Status: ${task.status}, Priority: ${task.priority}`,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/tasks error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
