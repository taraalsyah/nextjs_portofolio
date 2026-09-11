import prisma from "@/lib/prisma";

/**
 * Gets all project IDs that the given user is authorized to access
 * (either as owner or as project member).
 */
export async function getUserAuthorizedProjectIds(userId: number): Promise<number[]> {
  if (!userId || isNaN(userId)) return [];

  const ownedProjects = await prisma.project.findMany({
    where: { ownerUserId: userId },
    select: { id: true },
  });

  const memberProjects = await prisma.projectMember.findMany({
    where: { userId: userId },
    select: { projectId: true },
  });

  const projectIdsSet = new Set<number>([
    ...ownedProjects.map((p) => p.id),
    ...memberProjects.map((m) => m.projectId),
  ]);

  return Array.from(projectIdsSet);
}

/**
 * Checks whether a specific user is authorized to access a given project ID.
 */
export async function isUserAuthorizedForProject(
  userId: number,
  projectId: number
): Promise<boolean> {
  if (!userId || isNaN(userId) || !projectId || isNaN(projectId)) {
    return false;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerUserId: userId },
        { members: { some: { userId: userId } } },
      ],
    },
    select: { id: true },
  });

  return !!project;
}
