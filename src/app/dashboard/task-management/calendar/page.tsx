'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskCalendarView } from '@/components/task-management/TaskCalendarView';
import { TaskDetailModal } from '@/components/task-management/TaskDetailModal';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const { activeProject } = useProjectContext();
  const activeProjectId = activeProject?.projectId;

  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { users } = useProjectMembers();
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';
  const currentUserId = parseInt((session?.user as any)?.id || '0', 10);

  // Ref to track latest active project ID for race condition prevention
  const activeProjectRef = useRef<number | undefined>(activeProjectId);

  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);

  // Clear state when active project changes
  useEffect(() => {
    setTasks([]);
    setCategories([]);
    setIsLoading(true);
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

  const fetchCalendarTasks = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    setIsLoading(true);
    try {
      const mode = isAdmin ? 'all' : 'my';
      const res = await fetch(`/api/tasks?mode=${mode}&limit=300`);
      if (activeProjectRef.current !== targetProjectId) return;

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        setTasks([]);
      }
    } finally {
      if (activeProjectRef.current === targetProjectId) {
        setIsLoading(false);
      }
    }
  }, [status, isAdmin, activeProjectId]);

  useEffect(() => {
    fetchCategories();
    fetchCalendarTasks();
  }, [fetchCategories, fetchCalendarTasks]);

  useEffect(() => {
    const handleProjectChanged = () => {
      setTasks([]);
      setCategories([]);
      fetchCategories();
      fetchCalendarTasks();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      return () => {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      };
    }
  }, [fetchCategories, fetchCalendarTasks]);

  const handleCreateOrUpdateTask = async (formData: any) => {
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
    fetchCalendarTasks();
  };

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <CalendarIcon size={20} />
            </div>
            <div className={styles.headerTitle}>
              Calendar Deadline View
              <p>Visualisasi jadwal tenggat waktu (due date) seluruh task pada tampilan kalender bulanan.</p>
            </div>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className={styles.createBtn}>
            <Plus size={16} />
            Buat Task Baru
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsla(0,0%,100%,0.5)' }}>
            Memuat Kalender Task...
          </div>
        ) : (
          <TaskCalendarView
            tasks={tasks}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
          />
        )}
      </div>

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

      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        currentUserId={currentUserId}
        onEditRequest={(t) => setEditingTask(t)}
      />
    </div>
  );
}
