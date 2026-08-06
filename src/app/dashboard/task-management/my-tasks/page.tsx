'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { UserCheck, Plus } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskFilterBar } from '@/components/task-management/TaskFilterBar';
import { TaskTable, TaskItem } from '@/components/task-management/TaskTable';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';
import { TaskDetailModal } from '@/components/task-management/TaskDetailModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useSafeToast } from '@/components/ui/Toast';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';
import { TASK_MUTATED_EVENT, notifyTaskMutated } from '@/lib/task-event';

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  categoryId: string | null;
  tags: string | null;
  startDate: string | null;
  dueDate: string | null;
}

export default function MyTasksPage() {
  const { data: session, status } = useSession();
  const { activeProject } = useProjectContext();
  const toastCtx = useSafeToast();
  const activeProjectId = activeProject?.projectId;

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { users } = useProjectMembers();
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch Categories for select dropdowns
  const fetchCategories = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    try {
      const res = await fetch('/api/task-categories');
      if (activeProjectRef.current !== targetProjectId) return;

      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      } else {
        setCategories([]);
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        setCategories([]);
      }
    }
  }, [status, activeProjectId]);

  // Fetch My Tasks
  const fetchTasks = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    setIsLoading(true);

    try {
      const query = new URLSearchParams({
        mode: 'my',
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
        setTasks([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        setTasks([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } finally {
      if (activeProjectRef.current === targetProjectId) {
        setIsLoading(false);
      }
    }
  }, [status, activeProjectId, currentPage, filterParams]);

  // Track whether initial data has been loaded
  const hasInitialized = useRef(false);

  useEffect(() => {
    const loadData = () => {
      setTasks([]);
      setCategories([]);
      setCurrentPage(1);
      fetchCategories();
      fetchTasks();
    };

    const handleProjectChanged = () => loadData();
    const handleTaskMutated = () => fetchTasks();

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      window.addEventListener(TASK_MUTATED_EVENT, handleTaskMutated);
    }

    // Initial data load on mount
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadData();
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
        window.removeEventListener(TASK_MUTATED_EVENT, handleTaskMutated);
      }
    };
    // Only run on mount and when callbacks change due to activeProjectId / status
  }, [fetchCategories, fetchTasks]);

  const handleCreateOrUpdateTask = async (formData: TaskFormData) => {
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

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <UserCheck size={20} />
            </div>
            <div className={styles.headerTitle}>
              My Tasks (Task Saya)
              <p>Daftar seluruh tugas yang ditugaskan khusus kepada Anda.</p>
            </div>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className={styles.createBtn}>
            <Plus size={16} />
            Buat Task Baru
          </button>
        </div>

        <TaskFilterBar
          onFilterChange={(filters) => {
            setFilterParams(filters);
            setCurrentPage(1);
          }}
          categories={categories}
          users={users}
          hideAssigneeFilter={true}
        />

        <TaskTable
          tasks={tasks}
          isLoading={isLoading}
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
