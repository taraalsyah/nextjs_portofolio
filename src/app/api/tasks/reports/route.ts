import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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

    // 🔒 STRICT ACTIVE PROJECT & SOFT DELETE CLAUSE
    const accessWhere: any = {
      projectId: activeProject.projectId,
      deletedAt: null,
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 🚀 SQL COUNT AGGREGATE QUERIES SCOPED TO ACTIVE PROJECT
    const totalTasks = await prisma.task.count({ where: accessWhere });

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

    const completedThisMonth = await prisma.task.count({
      where: {
        ...accessWhere,
        status: 'DONE',
        updatedAt: { gte: startOfMonth },
      },
    });

    const overdueTasks = await prisma.task.count({
      where: {
        ...accessWhere,
        dueDate: { lt: now },
        NOT: { status: 'DONE' },
      },
    });

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

    const assigneeGroups = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: accessWhere,
      _count: { id: true },
    });

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: activeProject.projectId },
      select: { user: { select: { id: true, name: true, username: true } } },
    });

    const assigneeMap = new Map<number, { name: string; username?: string | null }>();
    projectMembers.forEach((m) => assigneeMap.set(m.user.id, { name: m.user.name, username: m.user.username }));

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
      activeProject,
    });
  } catch (err: any) {
    console.error('GET /api/tasks/reports error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
