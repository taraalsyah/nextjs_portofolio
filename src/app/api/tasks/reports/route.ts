import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const role = (session.user as any).role || 'Staff';
    const rawId = (session.user as any).id || (session.user as any).sub || '0';
    const sessionUserId = parseInt(String(rawId), 10) || 0;

    const isAdmin = role === 'Admin';
    const accessWhere = isAdmin ? {} : { assigneeId: sessionUserId };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Total tasks count by status strictly scoped by role & assignee FK ID
    const totalTasks = await prisma.task.count({ where: accessWhere });
    const backlogCount = await prisma.task.count({ where: { ...accessWhere, status: 'BACKLOG' } });
    const openCount = await prisma.task.count({ where: { ...accessWhere, status: 'OPEN' } });
    const inProgressCount = await prisma.task.count({ where: { ...accessWhere, status: 'IN_PROGRESS' } });
    const doneCount = await prisma.task.count({ where: { ...accessWhere, status: 'DONE' } });

    // Tasks completed this month
    const completedThisMonth = await prisma.task.count({
      where: {
        ...accessWhere,
        status: 'DONE',
        updatedAt: { gte: startOfMonth },
      },
    });

    // Overdue tasks count
    const overdueTasks = await prisma.task.count({
      where: {
        ...accessWhere,
        dueDate: { lt: now },
        NOT: { status: 'DONE' },
      },
    });

    // Tasks grouped by Priority
    const lowPriority = await prisma.task.count({ where: { ...accessWhere, priority: 'LOW' } });
    const mediumPriority = await prisma.task.count({ where: { ...accessWhere, priority: 'MEDIUM' } });
    const highPriority = await prisma.task.count({ where: { ...accessWhere, priority: 'HIGH' } });
    const criticalPriority = await prisma.task.count({ where: { ...accessWhere, priority: 'CRITICAL' } });

    // Tasks grouped by Category
    const categoriesWithCount = await prisma.taskCategory.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            tasks: isAdmin ? true : { where: { assigneeId: sessionUserId } },
          },
        },
      },
    });

    // Tasks grouped by Assignee (Admin only sees all, Non-Admin sees self)
    const assigneesWithCount = await prisma.user.findMany({
      where: isAdmin ? { status: 'ACTIVE' } : { id: sessionUserId },
      select: {
        id: true,
        name: true,
        username: true,
        _count: { select: { assignedTasks: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      summary: {
        totalTasks,
        backlogCount,
        openCount,
        inProgressCount,
        doneCount,
        completedThisMonth,
        overdueTasks,
      },
      byPriority: {
        low: lowPriority,
        medium: mediumPriority,
        high: highPriority,
        critical: criticalPriority,
      },
      byCategory: categoriesWithCount.map((c) => ({
        id: c.id,
        name: c.name,
        taskCount: c._count.tasks,
      })),
      byAssignee: assigneesWithCount.map((a) => ({
        id: a.id,
        name: a.name,
        username: a.username,
        taskCount: a._count.assignedTasks,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
