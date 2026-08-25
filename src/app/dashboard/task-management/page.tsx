'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { ListTodo, Plus } from 'lucide-react';
import styles from './task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskFilterBar } from '@/components/task-management/TaskFilterBar';
import { TaskTable, TaskItem } from '@/components/task-management/TaskTable';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';
import { TaskDetailModal } from '@/components/task-management/TaskDetailModal';
import { DownloadReportButton } from '@/components/task-management/DownloadReportButton';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useSafeToast } from '@/components/ui/Toast';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';
import { TASK_MUTATED_EVENT, notifyTaskMutated } from '@/lib/task-event';

import { InlineSpinner } from '@/components/ui/loading';

export default function AllTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeProject } = useProjectContext();
  const toastCtx = useSafeToast();
  const activeProjectId = activeProject?.projectId;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { users } = useProjectMembers();
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const tasksRef = useRef<TaskItem[]>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterParams, setFilterParams] = useState<Record<string, string>>({});

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskItem | null>(null);

  const role = session?.user?.role || 'Staff';
  const isAdmin = role === 'Admin';
  const currentUserId = parseInt(session?.user?.id || '0', 10);

  // Ref to track latest active project ID for race condition prevention
  const activeProjectRef = useRef<number | undefined>(activeProjectId);

  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);

  // Redirect Non-Admin users to My Tasks page
  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard/task-management/my-tasks');
    }
  }, [status, isAdmin, router]);

  // Fetch Categories for select dropdowns
  const fetchCategories = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    try {
      const res = await fetch('/api/task-categories');
      if (activeProjectRef.current !== targetProjectId) return;

      if (res.ok) {
        const data = await res.json();
        if (activeProjectRef.current === targetProjectId) {
          setCategories(data.categories || []);
        }
      } else {
        if (activeProjectRef.current === targetProjectId) {
          setCategories([]);
        }
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        setCategories([]);
      }
    }
  }, [status, activeProjectId]);

  // Fetch Tasks with filters & pagination
  const fetchTasks = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    if (tasksRef.current.length === 0) {
      setIsLoading(true);
    } else {
      setIsFetching(true);
    }

    try {
      const query = new URLSearchParams({
        mode: 'all',
        page: String(currentPage),
        limit: '10',
        ...filterParams,
      });

      const res = await fetch(`/api/tasks?${query.toString()}`);
      if (activeProjectRef.current !== targetProjectId) return;

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setTotalPages(data.totalPages || 1);
        setTotalItems(data.totalItems || 0);
      } else {
        if (tasksRef.current.length === 0) {
          setTasks([]);
        }
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        if (tasksRef.current.length === 0) {
          setTasks([]);
        }
        setTotalPages(1);
        setTotalItems(0);
      }
    } finally {
      if (activeProjectRef.current === targetProjectId) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [status, activeProjectId, currentPage, filterParams]);

  // Data fetching effect — called on mount and when fetch functions change.
  // The fetch functions call setState in response to external API results, which is
  // the intended use of effects as described in the React docs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching from external API is the intended use of effects; the setState calls inside fetchTasks power the loading UI
    fetchCategories();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching from external API is the intended use of effects; the setState calls inside fetchTasks power the loading UI
    fetchTasks();
  }, [fetchCategories, fetchTasks]);

  useEffect(() => {
    const handleProjectChanged = () => {
      setTasks([]);
      setCategories([]);
      setCurrentPage(1);
      fetchCategories();
      fetchTasks();
    };

    const handleTaskMutated = () => {
      fetchTasks();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      window.addEventListener(TASK_MUTATED_EVENT, handleTaskMutated);
      return () => {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
        window.removeEventListener(TASK_MUTATED_EVENT, handleTaskMutated);
      };
    }
  }, [fetchCategories, fetchTasks]);

  const handleCreateOrUpdateTask = async (formData: Record<string, unknown>) => {
    const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
    const method = editingTask ? 'PUT' : 'POST';

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
    fetchTasks();
  };

  const handleDeleteTask = (task: TaskItem) => {
    setTaskToDelete(task);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (toastCtx?.showToast) toastCtx.showToast(`Task ${taskToDelete.taskNumber} berhasil dihapus.`, 'success');
        setTaskToDelete(null);
        fetchTasks();
        notifyTaskMutated();
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus task.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus task. Silakan coba lagi.';
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingBox}>
        <InlineSpinner size={18} color="var(--primary)" />
        <span>Memuat data task...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <ListTodo size={20} />
            </div>
            <div className={styles.headerTitle}>
              All Tasks (Manajemen Seluruh Task)
              <p>Kelola seluruh daftar task, penugasan, status workflow, dan prioritas.</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DownloadReportButton filterParams={filterParams} />
            <button onClick={() => setIsCreateModalOpen(true)} className={styles.createBtn}>
              <Plus size={16} />
              Buat Task Baru
            </button>
          </div>
        </div>

        <TaskFilterBar
          categories={categories}
          users={users}
          onFilterChange={(params) => {
            setFilterParams(params);
            setCurrentPage(1);
          }}
        />

        <TaskTable
          tasks={tasks}
          isLoading={isLoading}
          isFetching={isFetching}
          isAdmin={isAdmin}
          onView={(t) => setSelectedTaskId(t.id)}
          onEdit={(t) => setEditingTask(t)}
          onDelete={handleDeleteTask}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* Create / Edit Form Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen || editingTask !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={handleCreateOrUpdateTask}
        initialData={editingTask}
        categories={categories}
        users={users}
      />

      {/* Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        currentUserId={currentUserId}
        onEditRequest={(t) => setEditingTask(t as unknown as TaskItem)}
        onTaskUpdated={fetchTasks}
      />

      {/* Custom Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!taskToDelete}
        title={`Hapus Task ${taskToDelete?.taskNumber || ''}?`}
        description={`Apakah Anda yakin ingin menghapus task ${taskToDelete?.taskNumber || ''}${taskToDelete?.title ? ` - "${taskToDelete.title}"` : ''}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setTaskToDelete(null)}
      />
    </div>
  );
}
