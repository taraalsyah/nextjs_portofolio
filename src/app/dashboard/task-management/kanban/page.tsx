'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Kanban, Plus } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskKanbanBoard } from '@/components/task-management/TaskKanbanBoard';
import { TaskDetailModal } from '@/components/task-management/TaskDetailModal';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';
import { useProjectMembers } from '@/hooks/useProjectMembers';

export default function KanbanPage() {
  const { data: session, status } = useSession();

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

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetch('/api/task-categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, [status]);

  const fetchKanbanTasks = async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const mode = isAdmin ? 'all' : 'my';
      const res = await fetch(`/api/tasks?mode=${mode}&limit=200`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKanbanTasks();
  }, [status, isAdmin]);

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    const res = await fetch(`/api/tasks/${taskId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      fetchKanbanTasks();
    } else {
      const json = await res.json();
      alert(json.error || 'Gagal merubah status workflow.');
    }
  };

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
    fetchKanbanTasks();
  };

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <Kanban size={20} />
            </div>
            <div className={styles.headerTitle}>
              Kanban Board
              <p>Pindahkan alur kerja task secara fleksibel dari Backlog hingga Done.</p>
            </div>
          </div>

          <button onClick={() => setIsCreateModalOpen(true)} className={styles.createBtn}>
            <Plus size={16} />
            Buat Task Baru
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'hsla(0,0%,100%,0.5)' }}>
            Memuat Kanban Board...
          </div>
        ) : (
          <TaskKanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onCardClick={(task) => setSelectedTaskId(task.id)}
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
