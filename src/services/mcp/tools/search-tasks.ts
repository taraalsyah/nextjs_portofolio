import prisma from "@/lib/prisma";

export interface SearchTasksInput {
  keyword: string;
  limit?: number;
}

export async function executeSearchTasks({ keyword, limit = 10 }: SearchTasksInput) {
  if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
    return "Error: Parameter keyword wajib diisi.";
  }

  const cleanKeyword = keyword.trim();
  const cappedLimit = Math.min(Math.max(1, limit || 10), 20);

  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      OR: [
        { taskNumber: { contains: cleanKeyword } },
        { title: { contains: cleanKeyword } },
        { description: { contains: cleanKeyword } },
        { tags: { contains: cleanKeyword } },
      ],
    },
    take: cappedLimit,
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
        },
      },
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
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (tasks.length === 0) {
    return `Tidak ditemukan task yang cocok dengan keyword '${cleanKeyword}'.`;
  }

  const results = tasks.map((t) => ({
    id: t.id,
    taskNumber: t.taskNumber,
    title: t.title,
    status: t.status,
    priority: t.priority,
    project: t.project ? t.project.projectName : null,
    category: t.category ? t.category.name : null,
    assignee: t.assignee ? t.assignee.name : "Unassigned",
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    updatedAt: t.updatedAt.toISOString(),
  }));

  return JSON.stringify(
    {
      totalFound: tasks.length,
      keyword: cleanKeyword,
      tasks: results,
    },
    null,
    2
  );
}
