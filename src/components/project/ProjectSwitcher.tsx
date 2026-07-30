'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Folder, ChevronDown, Plus, Settings, Check, Lock, Users } from 'lucide-react';
import styles from './project.module.css';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { useProjectContext } from '@/context/ProjectContext';

export function ProjectSwitcher() {
  const {
    projects,
    activeProject,
    optimisticProject,
    isSwitching,
    switchProject,
    fetchProjects,
    fetchActiveProject,
  } = useProjectContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const handleSelectProject = (projectId: number) => {
    // 1. Instantly close dropdown
    setIsOpen(false);

    // 2. Prevent switching if already switching or selecting current project
    const currentId = (optimisticProject || activeProject)?.projectId;
    if (isSwitching || currentId === projectId) {
      return;
    }

    // 3. Trigger optimistic switch
    switchProject(projectId);
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

  const currentDisplayProject = optimisticProject || activeProject;

  return (
    <div className={styles.switcherWrapper} ref={dropdownRef}>
      <button
        onClick={() => !isSwitching && setIsOpen(!isOpen)}
        disabled={isSwitching}
        className={`${styles.switcherBtn} ${isSwitching ? styles.switcherBtnDisabled : ''}`}
        aria-label="Switch project"
      >
        <div className={styles.switcherLeft}>
          <div className={styles.projectIconBg}>
            <Folder size={16} />
          </div>
          <div className={styles.projectInfo}>
            <span className={styles.projectName}>
              {currentDisplayProject ? currentDisplayProject.projectName : 'Memuat Proyek...'}
            </span>
            <div className={styles.projectMeta}>
              {currentDisplayProject?.visibility === 'PRIVATE' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Lock size={10} /> Private
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Users size={10} /> Team
                </span>
              )}
              {currentDisplayProject && (
                <span className={`${styles.roleBadge} ${roleClass(currentDisplayProject.memberRole)}`}>
                  {currentDisplayProject.memberRole}
                </span>
              )}
            </div>
          </div>
        </div>
        <ChevronDown size={14} style={{ opacity: isSwitching ? 0.3 : 0.6 }} />
      </button>

      {isOpen && !isSwitching && (
        <div className={styles.dropdownMenu}>
          <div className={styles.dropdownTitle}>Proyek Saya</div>

          {projects.map((p) => {
            const isActive = currentDisplayProject?.projectId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                disabled={isSwitching}
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

          {currentDisplayProject && (
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
        }}
      />

      {/* Project Settings Modal */}
      {currentDisplayProject && (
        <ProjectSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          activeProjectId={currentDisplayProject.projectId}
          onProjectUpdated={() => {
            fetchProjects();
            fetchActiveProject();
          }}
        />
      )}
    </div>
  );
}
