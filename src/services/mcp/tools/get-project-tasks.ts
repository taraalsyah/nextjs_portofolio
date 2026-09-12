import prisma from "@/lib/prisma";

export interface GetProjectTasksInput {
  project_id: string | number;
  status?: string;
  limit?: number;
  assigned_to_me?: boolean;
}

export async function executeGetProjectTasks(
  { project_id, status, limit = 20, assigned_to_me }: GetProjectTasksInput,
  currentUserId?: number
) {
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const cappedLimit = Math.min(Math.max(1, limit || 20), 50);
  const cleanStatus = status && typeof status === "string" ? status.trim().toUpperCase() : undefined;

  const project = await prisma.project.findUnique({
    where: { id: parsedId },
    select: { id: true, projectName: true },
  });

  if (!project) {
    return `Project dengan ID '${parsedId}' tidak ditemukan.`;
  }

  const filterByAssignee = assigned_to_me && currentUserId && !isNaN(currentUserId);

  const tasks = await prisma.task.findMany({
    where: {
      projectId: parsedId,
      deletedAt: null,
      ...(cleanStatus ? { status: cleanStatus } : {}),
      ...(filterByAssignee ? { assigneeId: currentUserId } : {}),
    },
    take: cappedLimit,
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
    orderBy: {
      createdAt: "desc",
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
    updatedAt: t.updatedAt.toISOString(),
    doneReviewedAt: t.doneReviewedAt ? t.doneReviewedAt.toISOString() : null,
  }));

  return JSON.stringify(
    {
      projectId: project.id,
      projectName: project.projectName,
      assignedToMeOnly: !!filterByAssignee,
      filterStatus: cleanStatus || "ALL",
      count: tasks.length,
      limit: cappedLimit,
      tasks: results,
    },
    null,
    2
  );
}
