'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Folder, ChevronDown, Plus, Settings, Check, Lock, Users, UserPlus } from 'lucide-react';
import styles from './project.module.css';
import { CreateProjectModal } from './CreateProjectModal';
import { ProjectSettingsModal } from './ProjectSettingsModal';
import { JoinProjectModal } from './JoinProjectModal';
import { useProjectContext } from '@/context/ProjectContext';

interface ProjectSwitcherProps {
  isCollapsed?: boolean;
}

export function ProjectSwitcher({ isCollapsed = false }: ProjectSwitcherProps) {
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
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const top = rect.bottom + 4;
      const left = isCollapsed ? Math.max(12, rect.left) : rect.left;
      const width = isCollapsed ? 240 : rect.width;

      setMenuStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        zIndex: 9999,
      });
    }
  };

  const handleToggle = () => {
    if (isSwitching) return;
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  // Close dropdown on click outside or window resize/scroll
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedButton = buttonRef.current && buttonRef.current.contains(target);
      const clickedDropdown = dropdownRef.current && dropdownRef.current.contains(target);

      if (!clickedButton && !clickedDropdown) {
        setIsOpen(false);
      }
    }

    function handleReposition() {
      updatePosition();
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleReposition);
      window.addEventListener('scroll', handleReposition, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, isCollapsed]);

  const handleSelectProject = (projectId: number) => {
    setIsOpen(false);
    const currentId = (optimisticProject || activeProject)?.projectId;
    if (isSwitching || currentId === projectId) {
      return;
    }
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

  const dropdownMenuElement = (
    <div className={styles.dropdownMenu} style={menuStyle} ref={dropdownRef}>
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
          setIsJoinOpen(true);
        }}
        className={styles.actionBtn}
        style={{ color: '#38bdf8' }}
      >
        <UserPlus size={16} /> Join Proyek via Code
      </button>

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
  );

  return (
    <div className={styles.switcherWrapper}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={isSwitching}
        className={`${styles.switcherBtn} ${isSwitching ? styles.switcherBtnDisabled : ''} ${
          isCollapsed ? styles.switcherCollapsed : ''
        }`}
        aria-label="Switch project"
        title={isCollapsed ? (currentDisplayProject ? currentDisplayProject.projectName : 'Proyek') : undefined}
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
        <ChevronDown size={14} className={styles.switcherChevron} style={{ opacity: isSwitching ? 0.3 : undefined }} />
      </button>

      {isOpen && !isSwitching && mounted && createPortal(dropdownMenuElement, document.body)}

      {/* Join Project Modal */}
      <JoinProjectModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onProjectJoined={() => {
          fetchProjects();
          fetchActiveProject();
        }}
      />

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
