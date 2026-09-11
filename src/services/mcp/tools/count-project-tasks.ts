import prisma from "@/lib/prisma";

export interface CountProjectTasksInput {
  project_id: string | number;
  status?: string;
}

export async function executeCountProjectTasks({
  project_id,
  status,
}: CountProjectTasksInput) {
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const cleanStatus = status && typeof status === "string" ? status.trim().toUpperCase() : undefined;

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
      deletedAt: null,
      ...(cleanStatus ? { status: cleanStatus } : {}),
    },
  });

  return JSON.stringify(
    {
      projectId: project.id,
      projectName: project.projectName,
      filterStatus: cleanStatus || "ALL",
      count,
    },
    null,
    2
  );
}
