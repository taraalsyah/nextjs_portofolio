'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { GanttChart, Plus } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import {
  TaskTimelineView,
  TaskItem,
  TaskProjectItem,
  TaskPhaseItem,
} from '@/components/task-management/TaskTimelineView';
import { TaskDetailModal } from '@/components/task-management/TaskDetailModal';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';
import {
  ProjectModal,
  PhaseModal,
  ConfirmDeleteModal,
} from '@/components/task-management/TimelineModals';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';
import { TASK_MUTATED_EVENT, notifyTaskMutated } from '@/lib/task-event';
import { InlineSpinner } from '@/components/ui/loading';

export default function TimelinePage() {
  const { data: session, status } = useSession();
  const { activeProject } = useProjectContext();
  const activeProjectId = activeProject?.projectId;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskProjects, setTaskProjects] = useState<TaskProjectItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { users } = useProjectMembers();
  const [isLoading, setIsLoading] = useState(true);

  // Selected project filter in timeline view ('all' or string(id))
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Modals state for Task
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  // Modals state for Project & Phase
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<TaskProjectItem | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<TaskProjectItem | null>(null);

  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<TaskPhaseItem | null>(null);
  const [phaseTargetProjectId, setPhaseTargetProjectId] = useState<number | null>(null);
  const [phaseToDelete, setPhaseToDelete] = useState<TaskPhaseItem | null>(null);

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin' || role === 'Operation' || role?.toLowerCase() === 'operation';
  const currentUserId = parseInt((session?.user as any)?.id || '0', 10);

  // Ref to track latest active project ID for race condition prevention
  const activeProjectRef = useRef<number | undefined>(activeProjectId);

  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);

  // Clear state when workspace project changes
  useEffect(() => {
    setTasks([]);
    setTaskProjects([]);
    setCategories([]);
    setSelectedProjectId('all');
    setIsLoading(true);
  }, [activeProjectId]);

  // Fetch task projects for grouping & filter
  const fetchTaskProjects = useCallback(async () => {
    if (status !== 'authenticated' || !activeProjectId) return;
    try {
      const res = await fetch('/api/task-projects');
      if (activeProjectRef.current !== activeProjectId) return;
      if (res.ok) {
        const data = await res.json();
        setTaskProjects(data.taskProjects || []);
      }
    } catch {
      // silently fail
    }
  }, [status, activeProjectId]);

  // Fetch Categories for form modal
  const fetchCategories = useCallback(async () => {
    if (status !== 'authenticated' || !activeProjectId) return;
    try {
      const res = await fetch(`/api/task-categories?projectId=${activeProjectId}`);
      if (activeProjectRef.current !== activeProjectId) return;
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch {
      // silently fail
    }
  }, [status, activeProjectId]);

  // Fetch all tasks for timeline
  const fetchTimelineTasks = useCallback(async () => {
    if (status !== 'authenticated' || !activeProjectId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks?mode=all&limit=500`);
      if (activeProjectRef.current !== activeProjectId) return;

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch {
      if (activeProjectRef.current === activeProjectId) {
        setTasks([]);
      }
    } finally {
      if (activeProjectRef.current === activeProjectId) {
        setIsLoading(false);
      }
    }
  }, [status, activeProjectId]);

  const fetchTimelineTasksRef = useRef(fetchTimelineTasks);
  const fetchTaskProjectsRef = useRef(fetchTaskProjects);
  const fetchCategoriesRef = useRef(fetchCategories);

  useEffect(() => {
    fetchTimelineTasksRef.current = fetchTimelineTasks;
    fetchTaskProjectsRef.current = fetchTaskProjects;
    fetchCategoriesRef.current = fetchCategories;
  }, [fetchTimelineTasks, fetchTaskProjects, fetchCategories]);

  useEffect(() => {
    fetchCategories();
    fetchTaskProjects();
    fetchTimelineTasks();
  }, [fetchCategories, fetchTaskProjects, fetchTimelineTasks]);

  // Event listeners for project change and task mutations
  useEffect(() => {
    const handleProjectChanged = () => {
      setTasks([]);
      setTaskProjects([]);
      setCategories([]);
      setSelectedProjectId('all');
      fetchCategoriesRef.current();
      fetchTaskProjectsRef.current();
      fetchTimelineTasksRef.current();
    };

    const handleTaskMutated = () => {
      fetchTimelineTasksRef.current();
      fetchTaskProjectsRef.current();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      window.addEventListener(TASK_MUTATED_EVENT, handleTaskMutated);
      return () => {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
        window.removeEventListener(TASK_MUTATED_EVENT, handleTaskMutated);
      };
    }
  }, []);

  // --- Handlers for Task Creation & Updating ---
  const handleCreateOrUpdateTask = async (formData: any) => {
    const isEdit = Boolean(editingTask && editingTask.id);
    const url = isEdit ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal menyimpan data task.');
    }

    setEditingTask(null);
    setIsCreateModalOpen(false);
    await fetchTimelineTasks();
    await fetchTaskProjects();
    notifyTaskMutated();
  };

  const handleGenericCreateTask = () => {
    const defaultTpId = selectedProjectId !== 'all' ? parseInt(selectedProjectId, 10) : undefined;
    setEditingTask(defaultTpId ? { taskProjectId: defaultTpId } : null);
    setIsCreateModalOpen(true);
  };

  const handleCreateTaskInPhase = (taskProjId: number, phaseName: string, phaseId?: number | null) => {
    setEditingTask({
      taskProjectId: taskProjId,
      phase: phaseName,
      phaseId: phaseId || null,
    });
    setIsCreateModalOpen(true);
  };

  // --- Handlers for Project (TaskProject) Management ---
  const handleOpenCreateProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: TaskProjectItem) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleSaveProject = async (data: { name: string; description?: string }) => {
    const isEdit = Boolean(editingProject?.id);
    const url = isEdit ? `/api/task-projects/${editingProject!.id}` : '/api/task-projects';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal menyimpan proyek/fitur.');
    }

    const resData = await res.json();

    // Auto-select newly created project so chart immediately shows the empty project
    if (!isEdit && resData?.taskProject?.id) {
      setSelectedProjectId(String(resData.taskProject.id));
    }

    await fetchTaskProjects();
    await fetchTimelineTasks();
    notifyTaskMutated(undefined, 'project_changed');
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    const res = await fetch(`/api/task-projects/${projectToDelete.id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal menghapus proyek/fitur.');
    }

    if (selectedProjectId === String(projectToDelete.id)) {
      setSelectedProjectId('all');
    }

    setProjectToDelete(null);
    await fetchTaskProjects();
    await fetchTimelineTasks();
    notifyTaskMutated(undefined, 'project_deleted');
  };

  // --- Handlers for Phase (TaskPhase) Management ---
  const handleOpenCreatePhase = (taskProjId: number) => {
    setEditingPhase(null);
    setPhaseTargetProjectId(taskProjId);
    setIsPhaseModalOpen(true);
  };

  const handleOpenEditPhase = (phase: TaskPhaseItem) => {
    setEditingPhase(phase);
    setPhaseTargetProjectId(phase.taskProjectId);
    setIsPhaseModalOpen(true);
  };

  const handleSavePhase = async (name: string) => {
    const isEdit = Boolean(editingPhase?.id);
    const url = isEdit ? `/api/task-phases/${editingPhase!.id}` : '/api/task-phases';
    const method = isEdit ? 'PUT' : 'POST';

    const body = isEdit
      ? { name }
      : { name, taskProjectId: phaseTargetProjectId };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal menyimpan phase.');
    }

    await fetchTaskProjects();
    await fetchTimelineTasks();
    notifyTaskMutated(undefined, 'phase_changed');
  };

  const handleDeletePhase = async () => {
    if (!phaseToDelete) return;
    const res = await fetch(`/api/task-phases/${phaseToDelete.id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal menghapus phase.');
    }

    setPhaseToDelete(null);
    await fetchTaskProjects();
    await fetchTimelineTasks();
    notifyTaskMutated(undefined, 'phase_deleted');
  };

  const handleMovePhase = async (phaseId: number, direction: 'up' | 'down') => {
    const res = await fetch(`/api/task-phases/${phaseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: direction === 'up' ? 'move_up' : 'move_down' }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal mengubah urutan phase.');
    }

    await fetchTaskProjects();
  };

  // Target project name for phase creation modal
  const targetProjectForPhase = taskProjects.find((p) => p.id === phaseTargetProjectId);

  // Counts for delete confirmation warnings
  const projectTasksCount = projectToDelete
    ? tasks.filter((t) => t.taskProjectId === projectToDelete.id).length
    : 0;
  const projectPhasesCount = projectToDelete?.phases?.length || 0;

  const phaseTasksCount = phaseToDelete
    ? tasks.filter(
        (t) =>
          t.phaseId === phaseToDelete.id ||
          (t.taskProjectId === phaseToDelete.taskProjectId && t.phase === phaseToDelete.name)
      ).length
    : 0;

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <GanttChart size={20} />
            </div>
            <div className={styles.headerTitle}>
              Timeline (Gantt Chart)
              <p>
                Visualisasi jadwal pengerjaan task berdasarkan hari kerja (Senin - Jumat) yang
                selalu sinkron dengan Kanban dan Kalender.
              </p>
            </div>
          </div>

          <button onClick={handleGenericCreateTask} className={styles.createBtn}>
            <Plus size={16} />
            Buat Task Baru
          </button>
        </div>

        {/* Viewport / Content */}
        {isLoading ? (
          <div className={styles.loadingBox}>
            <InlineSpinner size={18} color="var(--primary)" />
            <span>Memuat Timeline Gantt Chart...</span>
          </div>
        ) : (
          <TaskTimelineView
            tasks={tasks}
            taskProjects={taskProjects}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
            onCreateTask={handleGenericCreateTask}
            onCreateTaskInPhase={handleCreateTaskInPhase}
            onCreateProject={handleOpenCreateProject}
            onEditProject={handleOpenEditProject}
            onDeleteProject={(proj) => setProjectToDelete(proj)}
            onCreatePhase={(tpId) => handleOpenCreatePhase(tpId)}
            onEditPhase={handleOpenEditPhase}
            onDeletePhase={(phase) => setPhaseToDelete(phase)}
            onMovePhase={handleMovePhase}
          />
        )}
      </div>

      {/* Task Create / Edit Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen || (editingTask !== null && editingTask.id !== undefined)}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialData={editingTask}
        categories={categories}
        users={users}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        currentUserId={currentUserId}
        onEditRequest={(t) => setEditingTask(t)}
        onTaskUpdated={() => {
          fetchTimelineTasks();
          fetchTaskProjects();
        }}
      />

      {/* Project Modal (Create / Edit) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSaveProject}
        initialData={editingProject}
      />

      {/* Phase Modal (Create / Edit) */}
      <PhaseModal
        isOpen={isPhaseModalOpen}
        onClose={() => {
          setIsPhaseModalOpen(false);
          setEditingPhase(null);
          setPhaseTargetProjectId(null);
        }}
        onSubmit={handleSavePhase}
        initialData={editingPhase}
        projectName={targetProjectForPhase?.name}
      />

      {/* Confirm Delete Project Modal */}
      <ConfirmDeleteModal
        isOpen={projectToDelete !== null}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDeleteProject}
        title={`Hapus Proyek / Fitur "${projectToDelete?.name}"?`}
        message={`Apakah Anda yakin ingin menghapus proyek "${projectToDelete?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        warningNote={
          projectToDelete && (projectPhasesCount > 0 || projectTasksCount > 0)
            ? `Proyek ini memiliki ${projectPhasesCount} phase dan ${projectTasksCount} task terkait. Seluruh phase akan dihapus dan semua task akan dipindahkan ke kategori proyek default "Tanpa Proyek".`
            : undefined
        }
        confirmText="Hapus Proyek"
      />

      {/* Confirm Delete Phase Modal */}
      <ConfirmDeleteModal
        isOpen={phaseToDelete !== null}
        onClose={() => setPhaseToDelete(null)}
        onConfirm={handleDeletePhase}
        title={`Hapus Phase "${phaseToDelete?.name}"?`}
        message={`Apakah Anda yakin ingin menghapus phase "${phaseToDelete?.name}"?`}
        warningNote={
          phaseTasksCount > 0
            ? `Terdapat ${phaseTasksCount} task di dalam phase ini. Task tidak akan dihapus, melainkan otomatis dipindahkan ke status "Tanpa Phase".`
            : 'Phase ini belum memiliki task dan akan langsung dihapus.'
        }
        confirmText={phaseTasksCount > 0 ? 'Pindahkan Task & Hapus' : 'Hapus Phase'}
      />
    </div>
  );
}
