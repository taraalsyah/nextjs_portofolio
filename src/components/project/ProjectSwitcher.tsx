'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Folder, ChevronDown, Plus, Settings, Check, Lock, Users } from 'lucide-react';
import styles from './project.module.css';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';

interface ProjectItem {
  id: number;
  projectName: string;
  description?: string | null;
  ownerUserId: number;
  visibility: 'PRIVATE' | 'TEAM';
  memberRole: string;
  isOwner: boolean;
}

interface ActiveProjectContextItem {
  projectId: number;
  projectName: string;
  visibility: 'PRIVATE' | 'TEAM';
  ownerUserId: number;
  memberRole: string;
}

export function ProjectSwitcher() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProject, setActiveProject] = useState<ActiveProjectContextItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchActiveProject = async () => {
    try {
      const res = await fetch('/api/projects/active');
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.activeProject);
      }
    } catch (err) {
      console.error('Failed to fetch active project:', err);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveProject();
    fetchProjects();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitchProject = async (projectId: number) => {
    if (activeProject?.projectId === projectId) {
      setIsOpen(false);
      return;
    }

    try {
      const res = await fetch('/api/projects/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveProject(data.activeProject);
        setIsOpen(false);
        // Refresh page data across dashboard
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to switch project:', err);
    }
  };

  const roleClass = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return styles.roleOwner;
      case 'ADMIN':
        return styles.roleAdmin;
      case 'MEMBER':
        return styles.roleMember;
      default:
        return styles.roleViewer;
    }
  };

  return (
    <div className={styles.switcherWrapper} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.switcherBtn}
        aria-label="Switch project"
      >
        <div className={styles.switcherLeft}>
          <div className={styles.projectIconBg}>
            <Folder size={16} />
          </div>
          <div className={styles.projectInfo}>
            <span className={styles.projectName}>
              {activeProject ? activeProject.projectName : 'Memuat Proyek...'}
            </span>
            <div className={styles.projectMeta}>
              {activeProject?.visibility === 'PRIVATE' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Lock size={10} /> Private
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Users size={10} /> Team
                </span>
              )}
              {activeProject && (
                <span className={`${styles.roleBadge} ${roleClass(activeProject.memberRole)}`}>
                  {activeProject.memberRole}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown size={14} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownTitle}>Proyek Saya</div>

          {projects.map((p) => {
            const isActive = activeProject?.projectId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSwitchProject(p.id)}
                className={`${styles.projectOption} ${isActive ? styles.projectOptionActive : ''}`}
              >
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.projectName}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    {p.visibility === 'PRIVATE' ? 'Private' : 'Team Workspace'} • {p.memberRole}
                  </span>
                </div>
                {isActive && <Check size={16} style={{ color: '#60a5fa' }} />}
              </button>
            );
          })}

          <div className={styles.dropdownDivider} />

          <button
            onClick={() => {
              setIsOpen(false);
              setIsCreateOpen(true);
            }}
            className={styles.actionBtn}
          >
            <Plus size={16} /> Buat Proyek Baru
          </button>

          {activeProject && (
            <button
              onClick={() => {
                setIsOpen(false);
                setIsSettingsOpen(true);
              }}
              className={styles.actionBtn}
              style={{ color: '#cbd5e1' }}
            >
              <Settings size={16} /> Pengaturan Proyek
            </button>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          fetchProjects();
          fetchActiveProject();
          window.location.reload();
        }}
      />

      {/* Project Settings Modal */}
      {activeProject && (
        <ProjectSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          activeProjectId={activeProject.projectId}
          onProjectUpdated={() => {
            fetchProjects();
            fetchActiveProject();
          }}
        />
      )}
    </div>
  );
}
