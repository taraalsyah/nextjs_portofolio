import { prisma } from '@/lib/prisma';
import { ProjectRole } from '@/lib/project';

/**
 * Roles permitted to create, edit, rename, duplicate, delete, or save flows.
 * Checked case-insensitively.
 */
export const FLOW_EDITOR_ROLES = ['owner', 'admin'] as const;

export type FlowEditorRole = (typeof FLOW_EDITOR_ROLES)[number];

/**
 * Check if a project role has edit privileges on flow diagrams.
 */
export function canEditFlow(role?: string | null): boolean {
  if (!role) return false;
  return FLOW_EDITOR_ROLES.includes(role.toLowerCase().trim() as FlowEditorRole);
}

/**
 * Check if a user has view privileges on flow diagrams (any project member).
 */
export function canViewFlow(role?: string | null): boolean {
  return Boolean(role && role.trim().length > 0);
}

export interface FlowPermissionResult {
  allowed: boolean;
  status: 200 | 400 | 401 | 403 | 404;
  error?: string;
  projectId?: number;
  flowId?: number;
  role?: ProjectRole;
}

/**
 * Server-side assertion to verify if a user has permission to view a flow diagram.
 * Validates existence, project context, and project membership.
 */
export async function assertCanViewFlow(
  userId: number,
  flowId: number
): Promise<FlowPermissionResult> {
  if (!userId || userId <= 0) {
    return { allowed: false, status: 401, error: 'Sesi telah berakhir.' };
  }

  if (!flowId || isNaN(flowId) || flowId <= 0) {
    return { allowed: false, status: 400, error: 'ID diagram tidak valid.' };
  }

  const flow = await prisma.flow.findFirst({
    where: { id: flowId, deletedAt: null },
    select: { id: true, projectId: true },
  });

  if (!flow) {
    return { allowed: false, status: 404, error: 'Diagram alur tidak ditemukan.' };
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: flow.projectId,
        userId,
      },
    },
    select: {
      role: true,
      project: { select: { ownerUserId: true } },
    },
  });

  if (!member) {
    return { allowed: false, status: 403, error: 'Akses ditolak. Anda bukan anggota proyek ini.' };
  }

  const effectiveRole: ProjectRole =
    member.project.ownerUserId === userId ? 'OWNER' : (member.role as ProjectRole);

  return {
    allowed: true,
    status: 200,
    projectId: flow.projectId,
    flowId: flow.id,
    role: effectiveRole,
  };
}

/**
 * Server-side assertion to verify if a user has permission to modify a flow diagram.
 * Only project Owner and Admin are permitted.
 */
export async function assertCanEditFlow(
  userId: number,
  flowId: number
): Promise<FlowPermissionResult> {
  const viewResult = await assertCanViewFlow(userId, flowId);
  if (!viewResult.allowed) {
    return viewResult;
  }

  if (!canEditFlow(viewResult.role)) {
    return {
      allowed: false,
      status: 403,
      error: 'Akses ditolak. Hanya Owner dan Admin proyek yang dapat mengubah atau mengedit diagram ini.',
      projectId: viewResult.projectId,
      flowId: viewResult.flowId,
      role: viewResult.role,
    };
  }

  return viewResult;
}

/**
 * Server-side assertion to verify if a user has permission to create a new flow in a project.
 * Only project Owner and Admin are permitted.
 */
export async function assertCanCreateFlow(
  userId: number,
  projectId: number
): Promise<FlowPermissionResult> {
  if (!userId || userId <= 0) {
    return { allowed: false, status: 401, error: 'Sesi telah berakhir.' };
  }

  if (!projectId || isNaN(projectId) || projectId <= 0) {
    return { allowed: false, status: 400, error: 'ID proyek tidak valid.' };
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      },
    },
    select: {
      role: true,
      project: { select: { ownerUserId: true } },
    },
  });

  if (!member) {
    return { allowed: false, status: 403, error: 'Akses ditolak. Anda bukan anggota proyek ini.' };
  }

  const effectiveRole: ProjectRole =
    member.project.ownerUserId === userId ? 'OWNER' : (member.role as ProjectRole);

  if (!canEditFlow(effectiveRole)) {
    return {
      allowed: false,
      status: 403,
      error: 'Akses ditolak. Hanya Owner dan Admin proyek yang dapat membuat diagram alur.',
      projectId,
      role: effectiveRole,
    };
  }

  return {
    allowed: true,
    status: 200,
    projectId,
    role: effectiveRole,
  };
}
