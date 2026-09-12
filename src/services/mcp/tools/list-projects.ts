import prisma from "@/lib/prisma";

export interface ListProjectsInput {
  limit?: number;
}

export async function executeListProjects({ limit = 50 }: ListProjectsInput = {}) {
  const cappedLimit = Math.min(Math.max(1, limit || 50), 100);

  const totalCount = await prisma.project.count();

  const projects = await prisma.project.findMany({
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
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

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
      total: totalCount,
      limit: cappedLimit,
      projects: results,
    },
    null,
    2
  );
}
