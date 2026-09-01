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
      where: { projectId: activeProject.projectId },
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

    const assigneeStatusGroups = await prisma.task.groupBy({
      by: ['assigneeId', 'status'],
      where: accessWhere,
      _count: { id: true },
    });

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: activeProject.projectId },
      select: { user: { select: { id: true, name: true, username: true } } },
    });

    const assigneeMap = new Map<number, { name: string; username?: string | null }>();
    projectMembers.forEach((m) => assigneeMap.set(m.user.id, { name: m.user.name, username: m.user.username }));

    const assigneeStatusMap = new Map<number, { BACKLOG: number; OPEN: number; IN_PROGRESS: number; DONE: number }>();
    assigneeStatusGroups.forEach((g) => {
      const assId = g.assigneeId || 0;
      if (!assigneeStatusMap.has(assId)) {
        assigneeStatusMap.set(assId, { BACKLOG: 0, OPEN: 0, IN_PROGRESS: 0, DONE: 0 });
      }
      const stMap = assigneeStatusMap.get(assId)!;
      if (g.status in stMap) {
        stMap[g.status as keyof typeof stMap] = g._count.id;
      }
    });

    const byAssignee = assigneeGroups.map((g) => {
      const assId = g.assigneeId || 0;
      const stCounts = assigneeStatusMap.get(assId) || { BACKLOG: 0, OPEN: 0, IN_PROGRESS: 0, DONE: 0 };
      return {
        id: assId,
        name: assId ? assigneeMap.get(assId)?.name || 'Unassigned' : 'Unassigned',
        username: assId ? assigneeMap.get(assId)?.username : undefined,
        taskCount: g._count.id,
        statusCounts: {
          backlog: stCounts.BACKLOG,
          open: stCounts.OPEN,
          inProgress: stCounts.IN_PROGRESS,
          done: stCounts.DONE,
        },
      };
    });

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
