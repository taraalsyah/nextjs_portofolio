import prisma from "@/lib/prisma";

export interface GetProjectInput {
  project_id: string | number;
}

export async function executeGetProject({ project_id }: GetProjectInput) {
  const parsedId =
    typeof project_id === "number"
      ? project_id
      : parseInt(String(project_id).trim(), 10);

  if (isNaN(parsedId)) {
    return "Error: project_id harus berupa angka atau string angka yang valid.";
  }

  const project = await prisma.project.findUnique({
    where: { id: parsedId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          members: true,
          tasks: true,
          categories: true,
        },
      },
    },
  });

  if (!project) {
    return `Project dengan ID '${parsedId}' tidak ditemukan.`;
  }

  const activeTaskCount = await prisma.task.count({
    where: {
      projectId: parsedId,
      deletedAt: null,
    },
  });

  return JSON.stringify(
    {
      id: project.id,
      projectName: project.projectName,
      description: project.description,
      visibility: project.visibility,
      inviteCode: project.inviteCode,
      owner: project.owner
        ? { id: project.owner.id, name: project.owner.name, email: project.owner.email }
        : null,
      stats: {
        totalMembers: project._count.members,
        totalTasks: activeTaskCount,
        totalCategories: project._count.categories,
      },
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    },
    null,
    2
  );
}
