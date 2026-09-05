'use client';

import React, { createContext, useContext, useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import { useTaskRealtime } from '@/hooks/useTaskRealtime';

export interface ProjectItem {
  id: number;
  projectName: string;
  description?: string | null;
  ownerUserId: number;
  visibility: 'PRIVATE' | 'TEAM';
  memberRole: string;
  isOwner: boolean;
}

export interface ActiveProjectContextItem {
  projectId: number;
  projectName: string;
  visibility: 'PRIVATE' | 'TEAM';
  ownerUserId: number;
  memberRole: string;
  permissions?: any;
}

export const ACTIVE_PROJECT_CHANGED_EVENT = 'active-project-changed';

interface ProjectContextType {
  projects: ProjectItem[];
  activeProject: ActiveProjectContextItem | null;
  optimisticProject: ActiveProjectContextItem | null;
  isSwitching: boolean;
  isLoading: boolean;
  switchProject: (projectId: number) => Promise<boolean>;
  fetchProjects: () => Promise<void>;
  fetchActiveProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<ActiveProjectContextItem | null>(null);
  const [optimisticProject, setOptimisticProject] = useState<ActiveProjectContextItem | null>(null);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [, startTransition] = useTransition();

  // Subscribe active project to Pusher real-time task updates
  useTaskRealtime({ projectId: activeProject?.projectId });

  const fetchActiveProject = useCallback(async () => {
    try {
      const res = await fetch('/api/projects/active');
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.activeProject);
        setOptimisticProject(data.activeProject);
      } else if (res.status === 401) {
        router.push('/login?error=SessionExpired');
      }
    } catch (err) {
      console.error('Failed to fetch active project:', err);
    }
  }, [router]);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else if (res.status === 401) {
        router.push('/login?error=SessionExpired');
      }
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchActiveProject();
    fetchProjects();
  }, [fetchActiveProject, fetchProjects]);

  const switchProject = async (targetProjectId: number): Promise<boolean> => {
    const currentActive = activeProject;
    if (currentActive?.projectId === targetProjectId || isSwitching) {
      return false;
    }

    // Find project details from projects list for immediate optimistic preview
    const targetItem = projects.find((p) => p.id === targetProjectId);
    if (targetItem) {
      const optimisticData: ActiveProjectContextItem = {
        projectId: targetItem.id,
        projectName: targetItem.projectName,
        visibility: targetItem.visibility,
        ownerUserId: targetItem.ownerUserId,
        memberRole: targetItem.memberRole,
      };
      // Optimistically update UI right away
      setOptimisticProject(optimisticData);
    }

    setIsSwitching(true);

    try {
      const res = await fetch('/api/projects/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: targetProjectId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 401 || errData.error === 'Session expired.') {
          setOptimisticProject(currentActive);
          showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'error');
          router.push('/login?error=SessionExpired');
          return false;
        }
        throw new Error(errData.error || 'Gagal mengubah proyek aktif.');
      }

      const data = await res.json();
      const updatedProject = data.activeProject;

      // Update state & notify components
      setActiveProject(updatedProject);
      setOptimisticProject(updatedProject);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(ACTIVE_PROJECT_CHANGED_EVENT, { detail: updatedProject })
        );
      }

      // Trigger Next.js App Router transition to revalidate server component data smoothly
      startTransition(() => {
        router.refresh();
      });

      return true;
    } catch (err: any) {
      console.error('Error switching project:', err);
      // Rollback optimistic state on failure
      setOptimisticProject(currentActive);
      showToast(err.message || 'Gagal mengubah proyek. Silakan coba lagi.', 'error');
      return false;
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        optimisticProject,
        isSwitching,
        isLoading,
        switchProject,
        fetchProjects,
        fetchActiveProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
