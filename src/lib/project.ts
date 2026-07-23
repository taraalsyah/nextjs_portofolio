import { prisma } from '@/lib/prisma';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type ProjectVisibility = 'PRIVATE' | 'TEAM';

export interface ProjectPermissions {
  role: ProjectRole;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canManageMembers: boolean;
  canManageMemberRoles: boolean;
  canRemoveMembers: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canDeleteTask: boolean;
  canUpdateAnyTask: boolean;
  canComment: boolean;
  canUploadAttachment: boolean;
}

/**
 * Resolves full granular permissions based on project member role.
 */
export function getProjectPermissions(role?: string | null): ProjectPermissions {
  const currentRole: ProjectRole = (role as ProjectRole) || 'VIEWER';

  switch (currentRole) {
    case 'OWNER':
      return {
        role: 'OWNER',
        canEditProject: true,
        canDeleteProject: true,
        canManageMembers: true,
        canManageMemberRoles: true,
        canRemoveMembers: true,
        canCreateTask: true,
        canAssignTask: true,
        canDeleteTask: true,
        canUpdateAnyTask: true,
        canComment: true,
        canUploadAttachment: true,
      };
    case 'ADMIN':
      return {
        role: 'ADMIN',
        canEditProject: false,
        canDeleteProject: false,
        canManageMembers: true,
        canManageMemberRoles: false,
        canRemoveMembers: false,
        canCreateTask: true,
        canAssignTask: true,
        canDeleteTask: true,
        canUpdateAnyTask: true,
        canComment: true,
        canUploadAttachment: true,
      };
    case 'MEMBER':
      return {
        role: 'MEMBER',
        canEditProject: false,
        canDeleteProject: false,
        canManageMembers: false,
        canManageMemberRoles: false,
        canRemoveMembers: false,
        canCreateTask: true,
        canAssignTask: false,
        canDeleteTask: false,
        canUpdateAnyTask: false,
        canComment: true,
        canUploadAttachment: true,
      };
    case 'VIEWER':
    default:
      return {
        role: 'VIEWER',
        canEditProject: false,
        canDeleteProject: false,
        canManageMembers: false,
        canManageMemberRoles: false,
        canRemoveMembers: false,
        canCreateTask: false,
        canAssignTask: false,
        canDeleteTask: false,
        canUpdateAnyTask: false,
        canComment: false,
        canUploadAttachment: false,
      };
  }
}

/**
 * Ensures a user has a Personal Workspace. Automatically creates one if not present.
 */
export async function ensurePersonalWorkspace(userId: number, userName: string, tx?: any) {
  const db = tx || prisma;

  // Check if personal workspace already exists
  const existingMembership = await db.projectMember.findFirst({
    where: {
      userId,
      project: {
        ownerUserId: userId,
        visibility: 'PRIVATE',
      },
    },
    select: {
      projectId: true,
      project: {
        select: {
          id: true,
          projectName: true,
          description: true,
          ownerUserId: true,
          visibility: true,
        },
      },
    },
  });

  if (existingMembership?.project) {
    return existingMembership.project;
  }

  const workspaceName = `${userName}'s Personal Workspace`;

  if (tx) {
    const project = await tx.project.create({
      data: {
        projectName: workspaceName,
        description: 'Ruang kerja pribadi untuk mengelola tugas-tugas individu Anda.',
        ownerUserId: userId,
        visibility: 'PRIVATE',
      },
      select: {
        id: true,
        projectName: true,
        description: true,
        ownerUserId: true,
        visibility: true,
      },
    });

    await tx.projectMember.create({
      data: {
        projectId: project.id,
        userId,
        role: 'OWNER',
      },
    });

    return project;
  } else {
    return await prisma.$transaction(
      async (client) => {
        const project = await client.project.create({
          data: {
            projectName: workspaceName,
            description: 'Ruang kerja pribadi untuk mengelola tugas-tugas individu Anda.',
            ownerUserId: userId,
            visibility: 'PRIVATE',
          },
          select: {
            id: true,
            projectName: true,
            description: true,
            ownerUserId: true,
            visibility: true,
          },
        });

        await client.projectMember.create({
          data: {
            projectId: project.id,
            userId,
            role: 'OWNER',
          },
        });

        return project;
      },
      { timeout: 15000 }
    );
  }
}

/**
 * Migrates existing unassigned tasks (projectId IS NULL) into their creator's Personal Workspace.
 */
export async function migrateTasksToPersonalWorkspace() {
  try {
    const orphanTasks = await prisma.task.findMany({
      where: { projectId: null },
      select: { id: true, createdById: true, createdBy: { select: { id: true, name: true } } },
    });

    if (orphanTasks.length === 0) return;

    // Group tasks by creator ID
    const tasksByCreator = new Map<number, { creatorName: string; taskIds: number[] }>();
    for (const t of orphanTasks) {
      const existing = tasksByCreator.get(t.createdById) || {
        creatorName: t.createdBy?.name || 'User',
        taskIds: [],
      };
      existing.taskIds.push(t.id);
      tasksByCreator.set(t.createdById, existing);
    }

    for (const [creatorId, { creatorName, taskIds }] of tasksByCreator.entries()) {
      await prisma.$transaction(async (tx) => {
        const workspace = await ensurePersonalWorkspace(creatorId, creatorName, tx);
        await tx.task.updateMany({
          where: { id: { in: taskIds } },
          data: { projectId: workspace.id },
        });
      });
    }
  } catch (err) {
    console.error('Task migration error:', err);
  }
}

/**
 * Gets all projects accessible by a user.
 */
export async function getUserProjects(userId: number) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: {
      role: true,
      joinedAt: true,
      project: {
        select: {
          id: true,
          projectName: true,
          description: true,
          ownerUserId: true,
          visibility: true,
          createdAt: true,
          updatedAt: true,
          owner: {
            select: { id: true, name: true, image: true },
          },
          _count: {
            select: { members: true, tasks: true },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    ...m.project,
    memberRole: m.role as ProjectRole,
    isOwner: m.project.ownerUserId === userId,
  }));
}

/**
 * Gets a user's membership and role in a specific project.
 */
export async function getProjectMember(projectId: number, userId: number) {
  return await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      id: true,
      projectId: true,
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });
}
