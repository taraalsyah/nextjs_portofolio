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

    // 🔒 STRICT SOFT DELETE & ASSIGNEE FK CLAUSE
    const accessWhere: any = {
      deletedAt: null,
    };

    if (!isAdmin) {
      accessWhere.assigneeId = sessionUserId;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 🚀 SQL COUNT AGGREGATE QUERIES FOR MAXIMUM PERFORMANCE (100K+ RECORDS)
    const totalTasks = await prisma.task.count({ where: accessWhere });

    // Group By Status in SQL
    const statusGroups = await prisma.task.groupBy({
      by: ['status'],
      where: accessWhere,
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {
      BACKLOG: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };
    statusGroups.forEach((g) => {
      statusCounts[g.status] = g._count.id;
    });

    // Completed this month in SQL
    const completedThisMonth = await prisma.task.count({
      where: {
        ...accessWhere,
        status: 'DONE',
        updatedAt: { gte: startOfMonth },
      },
    });

    // Overdue tasks count in SQL
    const overdueTasks = await prisma.task.count({
      where: {
        ...accessWhere,
        dueDate: { lt: now },
        NOT: { status: 'DONE' },
      },
    });

    // Group By Priority in SQL
    const priorityGroups = await prisma.task.groupBy({
      by: ['priority'],
      where: accessWhere,
      _count: { id: true },
    });

    const priorityCounts: Record<string, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    priorityGroups.forEach((g) => {
      priorityCounts[g.priority] = g._count.id;
    });

    // Group By Category in SQL
    const categoryGroups = await prisma.task.groupBy({
      by: ['categoryId'],
      where: accessWhere,
      _count: { id: true },
    });

    const categories = await prisma.taskCategory.findMany({
      select: { id: true, name: true },
    });

    const catMap = new Map<number, string>();
    categories.forEach((c) => catMap.set(c.id, c.name));

    const byCategory = categoryGroups.map((g) => ({
      id: g.categoryId || 0,
      name: g.categoryId ? catMap.get(g.categoryId) || 'Uncategorized' : 'Uncategorized',
      taskCount: g._count.id,
    }));

    // Group By Assignee in SQL
    const assigneeGroups = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: accessWhere,
      _count: { id: true },
    });

    const assignees = await prisma.user.findMany({
      where: isAdmin ? { status: 'ACTIVE' } : { id: sessionUserId },
      select: { id: true, name: true, username: true },
      orderBy: { name: 'asc' },
    });

    const assigneeMap = new Map<number, { name: string; username?: string | null }>();
    assignees.forEach((a) => assigneeMap.set(a.id, { name: a.name, username: a.username }));

    const byAssignee = assigneeGroups.map((g) => ({
      id: g.assigneeId || 0,
      name: g.assigneeId ? assigneeMap.get(g.assigneeId)?.name || 'Unassigned' : 'Unassigned',
      username: g.assigneeId ? assigneeMap.get(g.assigneeId)?.username : undefined,
      taskCount: g._count.id,
    }));

    return NextResponse.json({
      summary: {
        totalTasks,
        backlogCount: statusCounts.BACKLOG,
        openCount: statusCounts.OPEN,
        inProgressCount: statusCounts.IN_PROGRESS,
        doneCount: statusCounts.DONE,
        completedThisMonth,
        overdueTasks,
      },
      byPriority: {
        low: priorityCounts.LOW,
        medium: priorityCounts.MEDIUM,
        high: priorityCounts.HIGH,
        critical: priorityCounts.CRITICAL,
      },
      byCategory,
      byAssignee,
    });
  } catch (err: any) {
    console.error('GET /api/tasks/reports error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
