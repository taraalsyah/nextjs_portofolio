'use client';

import { useMemo } from 'react';
import { useProjectContext } from '@/context/ProjectContext';
import { canEditFlow, canViewFlow } from '@/lib/flow/permissions';

export interface FlowPermissions {
  canView: boolean;
  canEdit: boolean;
  role: string | null;
  isLoading: boolean;
}

/**
 * Client hook to resolve user permissions for Flow diagrams based on project role.
 * - Safe by default: during role loading, canEdit is false to prevent UI button flickering.
 * - Owner & Admin: canView = true, canEdit = true
 * - Member & Viewer: canView = true, canEdit = false
 */
export function useFlowPermissions(projectId?: number): FlowPermissions {
  const { activeProject, projects, isLoading } = useProjectContext();

  return useMemo(() => {
    // While project context is resolving, stay safe (read-only default)
    if (isLoading) {
      return {
        canView: false,
        canEdit: false,
        role: null,
        isLoading: true,
      };
    }

    let targetRole: string | null = null;
    let hasProject = false;

    if (projectId && activeProject?.projectId !== projectId) {
      const matched = projects.find((p) => p.id === projectId);
      if (matched) {
        targetRole = matched.memberRole;
        hasProject = true;
      }
    } else if (activeProject) {
      targetRole = activeProject.memberRole;
      hasProject = true;
    }

    const canEdit = canEditFlow(targetRole);
    const canView = hasProject && canViewFlow(targetRole);

    return {
      canView,
      canEdit,
      role: targetRole,
      isLoading: false,
    };
  }, [activeProject, projects, isLoading, projectId]);
}
