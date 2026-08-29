'use client';

import { useState, useEffect, useCallback } from 'react';

export const PROJECT_MEMBERS_UPDATED_EVENT = 'project-members-updated';

/**
 * Dispatches a custom event to notify all components that project members have changed.
 */
export function notifyProjectMembersUpdated(projectId?: number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(PROJECT_MEMBERS_UPDATED_EVENT, { detail: { projectId } })
    );
  }
}

export interface ProjectUser {
  id: number;
  name: string;
  username?: string;
  email?: string;
  image?: string;
  role?: string;
}

/**
 * Custom hook to fetch and reactively sync project members across all components.
 */
export function useProjectMembers() {
  const [users, setUsers] = useState<ProjectUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch('/api/projects/active/members');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch project members:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();

    const handleUpdate = () => {
      fetchMembers();
    };

    window.addEventListener(PROJECT_MEMBERS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('active-project-changed', handleUpdate);
    return () => {
      window.removeEventListener(PROJECT_MEMBERS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('active-project-changed', handleUpdate);
    };
  }, [fetchMembers]);

  return { users, setUsers, isLoading, refetchMembers: fetchMembers };
}
