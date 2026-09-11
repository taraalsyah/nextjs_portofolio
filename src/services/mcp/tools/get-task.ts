import prisma from "@/lib/prisma";

export interface GetTaskInput {
  task_id: string;
}

export async function executeGetTask({ task_id }: GetTaskInput) {
  if (!task_id || typeof task_id !== "string" || task_id.trim() === "") {
    return "Error: Parameter task_id wajib diisi.";
  }

  const cleanTaskId = task_id.trim();
  const parsedId = parseInt(cleanTaskId, 10);
  const isNumeric = !isNaN(parsedId) && String(parsedId) === cleanTaskId;

  const task = await prisma.task.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { taskNumber: cleanTaskId },
        ...(isNumeric ? [{ id: parsedId }] : []),
      ],
    },
    include: {
      project: {
        select: {
          id: true,
          projectName: true,
        },
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      checklists: {
        select: {
          id: true,
          title: true,
          isCompleted: true,
        },
      },
    },
  });

  if (!task) {
    return `Task dengan ID '${cleanTaskId}' tidak ditemukan.`;
  }

  const checklistSummary =
    task.checklists && task.checklists.length > 0
      ? task.checklists
          .map((c) => `- [${c.isCompleted ? "x" : " "}] ${c.title}`)
          .join("\n")
      : "Tidak ada checklist";

  return JSON.stringify(
    {
      id: task.id,
      taskNumber: task.taskNumber,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      project: task.project
        ? { id: task.project.id, name: task.project.projectName }
        : null,
      category: task.category ? task.category.name : null,
      assignee: task.assignee
        ? { name: task.assignee.name, email: task.assignee.email }
        : "Unassigned",
      createdBy: task.createdBy
        ? { name: task.createdBy.name, email: task.createdBy.email }
        : null,
      tags: task.tags ? task.tags.split(",").map((t) => t.trim()) : [],
      startDate: task.startDate ? task.startDate.toISOString() : null,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      checklists: task.checklists.map((c) => ({
        title: c.title,
        isCompleted: c.isCompleted,
      })),
      checklistSummary,
    },
    null,
    2
  );
}
