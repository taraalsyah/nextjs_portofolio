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
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';

export default function AllTasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeProject } = useProjectContext();
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

    setIsLoading(true);

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

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      return () => {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
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

  const handleDeleteTask = async (task: TaskItem) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus task ${task.taskNumber} - "${task.title}"?`)) {
      return;
    }

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      fetchTasks();
    } else {
      const json = await res.json();
      alert(json.error || 'Gagal menghapus task.');
    }
  };

  if (status === 'loading') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Memuat...</div>;
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

          {isAdmin && (
            <button onClick={() => setIsCreateModalOpen(true)} className={styles.createBtn}>
              <Plus size={16} />
              Buat Task Baru
            </button>
          )}
        </div>

        <TaskFilterBar
          onFilterChange={(filters) => {
            setFilterParams(filters);
            setCurrentPage(1);
          }}
          categories={categories}
          users={users}
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
      />
    </div>
  );
}
