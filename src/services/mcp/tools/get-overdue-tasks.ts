import prisma from "@/lib/prisma";

export interface GetOverdueTasksInput {
  project_id: string | number;
  limit?: number;
}

export async function executeGetOverdueTasks({
  project_id,
  limit = 50,
}: GetOverdueTasksInput) {
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const cappedLimit = Math.min(Math.max(1, limit || 50), 100);

  const project = await prisma.project.findUnique({
    where: { id: parsedId },
    select: { id: true, projectName: true },
  });

  if (!project) {
    return `Project dengan ID '${parsedId}' tidak ditemukan.`;
  }

  const now = new Date();

  const overdueWhere = {
    projectId: parsedId,
    deletedAt: null,
    dueDate: {
      not: null,
      lt: now,
    },
    status: {
      notIn: ["DONE", "Done", "done"],
    },
  };

  const totalOverdueCount = await prisma.task.count({
    where: overdueWhere,
  });

  const tasks = await prisma.task.findMany({
    where: overdueWhere,
    take: cappedLimit,
    orderBy: {
      dueDate: "asc",
    },
    include: {
      assignee: {
        select: {
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const results = tasks.map((t) => ({
    id: t.id,
    taskNumber: t.taskNumber,
    title: t.title,
    status: t.status,
    priority: t.priority,
    category: t.category ? t.category.name : null,
    assignee: t.assignee ? t.assignee.name : "Unassigned",
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
  }));

  return JSON.stringify(
    {
      projectId: project.id,
      projectName: project.projectName,
      total: totalOverdueCount,
      limit: cappedLimit,
      tasks: results,
    },
    null,
    2
  );
}
