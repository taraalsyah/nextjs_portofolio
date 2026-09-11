import prisma from "@/lib/prisma";

export interface SearchProjectsInput {
  keyword: string;
  limit?: number;
}

export async function executeSearchProjects({ keyword, limit = 10 }: SearchProjectsInput) {
  if (!keyword || typeof keyword !== "string" || keyword.trim() === "") {
    return "Error: Parameter keyword wajib diisi.";
  }

  const cleanKeyword = keyword.trim();
  const cappedLimit = Math.min(Math.max(1, limit || 10), 20);

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { projectName: { contains: cleanKeyword } },
        { description: { contains: cleanKeyword } },
      ],
    },
    take: cappedLimit,
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
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  if (projects.length === 0) {
    return `Tidak ditemukan project yang cocok dengan keyword '${cleanKeyword}'.`;
  }

  const results = await Promise.all(
    projects.map(async (p) => {
      const activeTaskCount = await prisma.task.count({
        where: {
          projectId: p.id,
          deletedAt: null,
        },
      });

      return {
        id: p.id,
        projectName: p.projectName,
        description: p.description,
        visibility: p.visibility,
        owner: p.owner ? { id: p.owner.id, name: p.owner.name, email: p.owner.email } : null,
        totalMembers: p._count.members,
        totalTasks: activeTaskCount,
        updatedAt: p.updatedAt.toISOString(),
      };
    })
  );

  return JSON.stringify(
    {
      totalFound: projects.length,
      keyword: cleanKeyword,
      projects: results,
    },
    null,
    2
  );
}
