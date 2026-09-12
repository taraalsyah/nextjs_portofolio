import prisma from "@/lib/prisma";

export interface CountAssignedTasksInput {
  project_id: string | number;
  status?: string;
}

export async function executeCountAssignedTasks(
  { project_id, status }: CountAssignedTasksInput,
  currentUserId: number
): Promise<string> {
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  if (!currentUserId || isNaN(currentUserId)) {
    return "Error: Session user ID tidak valid.";
  }

  const cleanStatus =
    status && typeof status === "string" ? status.trim().toUpperCase() : undefined;

  const project = await prisma.project.findUnique({
    where: { id: parsedId },
    select: { id: true, projectName: true },
  });

  if (!project) {
    return `Project dengan ID '${parsedId}' tidak ditemukan.`;
  }

  const count = await prisma.task.count({
    where: {
      projectId: parsedId,
      assigneeId: currentUserId,
      deletedAt: null,
      ...(cleanStatus ? { status: cleanStatus } : {}),
    },
  });

  return JSON.stringify(
    {
      projectId: project.id,
      projectName: project.projectName,
      assignee: {
        userId: currentUserId,
      },
      filterStatus: cleanStatus || "ALL",
      total: count,
    },
    null,
    2
  );
}
