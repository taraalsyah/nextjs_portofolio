import { prisma } from '@/lib/prisma';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type ProjectVisibility = 'PRIVATE' | 'TEAM';

export type ProjectPermissionKey =
  | 'project.view'
  | 'task.view'
  | 'task.create'
  | 'task.update'
  | 'task.delete'
  | 'task.assign'
  | 'task.workflow.update'
  | 'task.comment'
  | 'task.attachment.upload'
  | 'task.attachment.download'
  | 'activity.view'
  | 'project.member.invite'
  | 'project.member.remove'
  | 'project.member.role.update'
  | 'project.transferOwnership'
  | 'project.settings.update'
  | 'project.archive'
  | 'project.delete';

export interface WorkflowTransitionKey {
  fromStatus: string;
  toStatus: string;
  label: string;
}

export const ALL_WORKFLOW_TRANSITIONS: WorkflowTransitionKey[] = [
  { fromStatus: 'BACKLOG', toStatus: 'OPEN', label: 'Backlog → Open' },
  { fromStatus: 'OPEN', toStatus: 'IN_PROGRESS', label: 'Open → In Progress' },
  { fromStatus: 'IN_PROGRESS', toStatus: 'DONE', label: 'In Progress → Done' },
  { fromStatus: 'DONE', toStatus: 'OPEN', label: 'Done → Reopen' },
];

export const ALL_PERMISSIONS_LIST: { key: ProjectPermissionKey; name: string; category: string }[] = [
  { key: 'project.view', name: 'View Project', category: 'Project Management' },
  { key: 'task.view', name: 'View Task', category: 'Task Management' },
  { key: 'task.create', name: 'Create Task', category: 'Task Management' },
  { key: 'task.update', name: 'Edit Task', category: 'Task Management' },
  { key: 'task.delete', name: 'Delete Task', category: 'Task Management' },
  { key: 'task.assign', name: 'Assign Task', category: 'Task Management' },
  { key: 'task.workflow.update', name: 'Update Workflow Status', category: 'Workflow' },
  { key: 'task.comment', name: 'Comment Task', category: 'Collaboration' },
  { key: 'task.attachment.upload', name: 'Upload Attachment', category: 'Collaboration' },
  { key: 'task.attachment.download', name: 'Download Attachment', category: 'Collaboration' },
  { key: 'activity.view', name: 'View Activity History', category: 'Collaboration' },
  { key: 'project.member.invite', name: 'Invite Member', category: 'Member Management' },
  { key: 'project.member.remove', name: 'Remove Member', category: 'Member Management' },
  { key: 'project.member.role.update', name: 'Change Member Role', category: 'Member Management' },
  { key: 'project.transferOwnership', name: 'Transfer Ownership', category: 'Member Management' },
  { key: 'project.settings.update', name: 'Update Project Settings', category: 'Project Management' },
  { key: 'project.archive', name: 'Archive Project', category: 'Project Management' },
  { key: 'project.delete', name: 'Delete Project', category: 'Project Management' },
];

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
  canApproveWorkflow: boolean;
  permissionsMap: Record<ProjectPermissionKey, boolean>;
}

/**
 * Default permission matrix mapping by Project Role.
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<ProjectRole, Record<ProjectPermissionKey, boolean>> = {
  OWNER: {
    'project.view': true,
    'task.view': true,
    'task.create': true,
    'task.update': true,
    'task.delete': true,
    'task.assign': true,
    'task.workflow.update': true,
    'task.comment': true,
    'task.attachment.upload': true,
    'task.attachment.download': true,
    'activity.view': true,
    'project.member.invite': true,
    'project.member.remove': true,
    'project.member.role.update': true,
    'project.transferOwnership': true,
    'project.settings.update': true,
    'project.archive': true,
    'project.delete': true,
  },
  ADMIN: {
    'project.view': true,
    'task.view': true,
    'task.create': true,
    'task.update': true,
    'task.delete': true,
    'task.assign': true,
    'task.workflow.update': true,
    'task.comment': true,
    'task.attachment.upload': true,
    'task.attachment.download': true,
    'activity.view': true,
    'project.member.invite': true,
    'project.member.remove': false,
    'project.member.role.update': false,
    'project.transferOwnership': false,
    'project.settings.update': true,
    'project.archive': true,
    'project.delete': false,
  },
  MEMBER: {
    'project.view': true,
    'task.view': true,
    'task.create': false,
    'task.update': false,
    'task.delete': false,
    'task.assign': false,
    'task.workflow.update': true,
    'task.comment': true,
    'task.attachment.upload': true,
    'task.attachment.download': true,
    'activity.view': true,
    'project.member.invite': false,
    'project.member.remove': false,
    'project.member.role.update': false,
    'project.transferOwnership': false,
    'project.settings.update': false,
    'project.archive': false,
    'project.delete': false,
  },
  VIEWER: {
    'project.view': true,
    'task.view': true,
    'task.create': false,
    'task.update': false,
    'task.delete': false,
    'task.assign': false,
    'task.workflow.update': false,
    'task.comment': false,
    'task.attachment.upload': false,
    'task.attachment.download': true,
    'activity.view': true,
    'project.member.invite': false,
    'project.member.remove': false,
    'project.member.role.update': false,
    'project.transferOwnership': false,
    'project.settings.update': false,
    'project.archive': false,
    'project.delete': false,
  },
};

export const DEFAULT_WORKFLOW_PERMISSIONS: Record<ProjectRole, Record<string, boolean>> = {
  OWNER: {
    'BACKLOG->OPEN': true,
    'OPEN->IN_PROGRESS': true,
    'IN_PROGRESS->DONE': true,
    'DONE->OPEN': true,
  },
  ADMIN: {
    'BACKLOG->OPEN': true,
    'OPEN->IN_PROGRESS': true,
    'IN_PROGRESS->DONE': true,
    'DONE->OPEN': true,
  },
  MEMBER: {
    'BACKLOG->OPEN': true,
    'OPEN->IN_PROGRESS': true,
    'IN_PROGRESS->DONE': false,
    'DONE->OPEN': false,
  },
  VIEWER: {
    'BACKLOG->OPEN': false,
    'OPEN->IN_PROGRESS': false,
    'IN_PROGRESS->DONE': false,
    'DONE->OPEN': false,
  },
};

/**
 * Gets project permission matrix from database or generates defaults.
 */
export async function getProjectFullPermissionMatrix(projectId: number) {
  const roles: ProjectRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'];

  const dbRolePerms = await prisma.projectRolePermission.findMany({
    where: { projectId },
  });

  const dbWorkflowPerms = await prisma.projectWorkflowPermission.findMany({
    where: { projectId },
  });

  const matrix: Record<ProjectRole, Record<ProjectPermissionKey, boolean>> = JSON.parse(
    JSON.stringify(DEFAULT_ROLE_PERMISSIONS)
  );

  const workflowMatrix: Record<ProjectRole, Record<string, boolean>> = JSON.parse(
    JSON.stringify(DEFAULT_WORKFLOW_PERMISSIONS)
  );

  for (const item of dbRolePerms) {
    if (roles.includes(item.role as ProjectRole)) {
      matrix[item.role as ProjectRole][item.permissionKey as ProjectPermissionKey] = item.isAllowed;
    }
  }

  for (const item of dbWorkflowPerms) {
    if (roles.includes(item.role as ProjectRole)) {
      const key = `${item.fromStatus}->${item.toStatus}`;
      workflowMatrix[item.role as ProjectRole][key] = item.isAllowed;
    }
  }

  return { matrix, workflowMatrix };
}

/**
 * Resolves permissions for a user in a project using dynamic database matrix.
 */
export async function getProjectPermissions(
  role?: string | null,
  projectId?: number
): Promise<ProjectPermissions> {
  const currentRole: ProjectRole = (role as ProjectRole) || 'VIEWER';

  let permMap: Record<ProjectPermissionKey, boolean> = { ...DEFAULT_ROLE_PERMISSIONS[currentRole] };

  if (projectId) {
    const { matrix } = await getProjectFullPermissionMatrix(projectId);
    permMap = matrix[currentRole] || permMap;
  }

  return {
    role: currentRole,
    canEditProject: permMap['project.settings.update'],
    canDeleteProject: permMap['project.delete'],
    canManageMembers: permMap['project.member.invite'],
    canManageMemberRoles: permMap['project.member.role.update'],
    canRemoveMembers: permMap['project.member.remove'],
    canCreateTask: permMap['task.create'],
    canAssignTask: permMap['task.assign'],
    canDeleteTask: permMap['task.delete'],
    canUpdateAnyTask: permMap['task.update'],
    canComment: permMap['task.comment'],
    canUploadAttachment: permMap['task.attachment.upload'],
    canApproveWorkflow: currentRole === 'OWNER' || currentRole === 'ADMIN',
    permissionsMap: permMap,
  };
}

/**
 * Configurable permission checker helper function.
 */
export function hasPermission(
  permissions: ProjectPermissions | null | undefined,
  permissionKey: ProjectPermissionKey
): boolean {
  if (!permissions) return false;
  return !!permissions.permissionsMap[permissionKey];
}

/**
 * Validates workflow status transitions and task ownership rules against DB matrix.
 */
export async function validateWorkflowTransition(
  role: ProjectRole,
  permissions: ProjectPermissions,
  currentUserId: number,
  assigneeId: number | null,
  fromStatus: string,
  toStatus: string,
  projectId?: number
): Promise<{ allowed: boolean; reason?: string }> {
  if (role === 'VIEWER' || !hasPermission(permissions, 'task.workflow.update')) {
    return {
      allowed: false,
      reason: 'Anda tidak memiliki izin untuk memperbarui status workflow task.',
    };
  }

  if (projectId) {
    const { workflowMatrix } = await getProjectFullPermissionMatrix(projectId);
    const transitionKey = `${fromStatus}->${toStatus}`;
    const roleWorkflows = workflowMatrix[role];

    if (roleWorkflows && roleWorkflows[transitionKey] === false) {
      return {
        allowed: false,
        reason: `Peran Anda (${role}) tidak diizinkan melakukan transisi dari ${fromStatus} ke ${toStatus}.`,
      };
    }
  }

  if (role === 'OWNER' || role === 'ADMIN') {
    return { allowed: true };
  }

  // Member role task ownership check
  if (assigneeId !== currentUserId) {
    return {
      allowed: false,
      reason: 'Anda hanya dapat memperbarui status workflow pada tugas yang ditugaskan kepada Anda.',
    };
  }

  if (toStatus === 'DONE') {
    return {
      allowed: false,
      reason: 'Hanya Owner atau Admin yang dapat menyetujui (Approve) atau menyelesaikan task ini ke status DONE.',
    };
  }

  if (fromStatus === 'DONE') {
    return {
      allowed: false,
      reason: 'Hanya Owner atau Admin yang dapat membuka kembali (Reopen) task yang sudah selesai (DONE).',
    };
  }

  return { allowed: true };
}

/**
 * Ensures a user has a Personal Workspace. Automatically creates one if not present.
 */
export async function ensurePersonalWorkspace(userId: number, userName: string, tx?: any) {
  const db = tx || prisma;

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
 * Migrates existing unassigned tasks into creator's Personal Workspace.
 */
export async function migrateTasksToPersonalWorkspace() {
  try {
    const orphanTasks = await prisma.task.findMany({
      where: { projectId: null },
      select: { id: true, createdById: true, createdBy: { select: { id: true, name: true } } },
    });

    if (orphanTasks.length === 0) return;

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
