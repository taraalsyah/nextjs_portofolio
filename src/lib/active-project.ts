import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensurePersonalWorkspace, getProjectPermissions, ProjectPermissions, ProjectRole } from './project';

export const ACTIVE_PROJECT_COOKIE = 'active_project_id';

export interface ActiveProjectContext {
  projectId: number;
  projectName: string;
  visibility: string;
  ownerUserId: number;
  memberRole: ProjectRole;
  permissions: ProjectPermissions;
}

/**
 * Resolves the currently active project for a given user from cookies or database fallback.
 */
export async function getActiveProjectContext(
  userId: number,
  userName?: string,
  req?: NextRequest
): Promise<ActiveProjectContext | null> {
  if (!userId || userId <= 0) return null;

  let requestedProjectId: number | null = null;

  // 1. Extract cookie value
  if (req) {
    const cookieVal = req.cookies.get(ACTIVE_PROJECT_COOKIE)?.value;
    if (cookieVal) requestedProjectId = parseInt(cookieVal, 10);
  } else {
    try {
      const cookieStore = await cookies();
      const cookieVal = cookieStore.get(ACTIVE_PROJECT_COOKIE)?.value;
      if (cookieVal) requestedProjectId = parseInt(cookieVal, 10);
    } catch {
      // Ignore if called outside request context
    }
  }

  // 2. If cookie contains a valid project ID, verify membership
  if (requestedProjectId && !isNaN(requestedProjectId) && requestedProjectId > 0) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: requestedProjectId,
          userId,
        },
      },
      select: {
        role: true,
        project: {
          select: {
            id: true,
            projectName: true,
            visibility: true,
            ownerUserId: true,
          },
        },
      },
    });

    if (membership?.project) {
      const role = membership.role as ProjectRole;
      return {
        projectId: membership.project.id,
        projectName: membership.project.projectName,
        visibility: membership.project.visibility,
        ownerUserId: membership.project.ownerUserId,
        memberRole: role,
        permissions: await getProjectPermissions(role, membership.project.id),
      };
    }
  }

  // 3. Fallback: Find user's first available project
  const firstMembership = await prisma.projectMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: {
      role: true,
      project: {
        select: {
          id: true,
          projectName: true,
          visibility: true,
          ownerUserId: true,
        },
      },
    },
  });

  if (firstMembership?.project) {
    const role = firstMembership.role as ProjectRole;
    return {
      projectId: firstMembership.project.id,
      projectName: firstMembership.project.projectName,
      visibility: firstMembership.project.visibility,
      ownerUserId: firstMembership.project.ownerUserId,
      memberRole: role,
      permissions: await getProjectPermissions(role, firstMembership.project.id),
    };
  }

  // 4. Fallback 2: Auto-create Personal Workspace if user has no projects at all
  const fallbackUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  const name = userName || fallbackUser?.name || 'User';
  const personalProject = await ensurePersonalWorkspace(userId, name);

  const role: ProjectRole = 'OWNER';
  return {
    projectId: personalProject.id,
    projectName: personalProject.projectName,
    visibility: personalProject.visibility,
    ownerUserId: personalProject.ownerUserId,
    memberRole: role,
    permissions: await getProjectPermissions(role, personalProject.id),
  };
}
