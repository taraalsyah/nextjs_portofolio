'use client';

import React, { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2 } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskChecklistSection } from '@/components/task-management/TaskChecklistSection';
import { TaskCommentSection } from '@/components/task-management/TaskCommentSection';
import { TaskAttachmentSection } from '@/components/task-management/TaskAttachmentSection';
import { TaskHistorySection } from '@/components/task-management/TaskHistorySection';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const taskId = parseInt(id, 10);

  const { data: session, status } = useSession();
  const router = useRouter();

  const [task, setTask] = useState<any>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'comments' | 'attachments' | 'history'>('info');

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';
  const currentUserId = parseInt((session?.user as any)?.id || '0', 10);

  useEffect(() => {
    if (status !== 'authenticated') return;

    fetch('/api/task-categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => setUsers(data.users || []))
      .catch(() => {});
  }, [status]);

  const fetchTaskDetails = async () => {
    if (!taskId || isNaN(taskId)) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId, status]);

  const handleUpdateTask = async (formData: any) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal merubah task.');
    }

    setIsEditing(false);
    fetchTaskDetails();
  };

  const handleDeleteTask = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus task ${task.taskNumber}?`)) return;

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/dashboard/task-management');
    } else {
      const json = await res.json();
      alert(json.error || 'Gagal menghapus task.');
    }
  };

  if (isLoading || !task) {
    return (
      <div className={styles.container}>
        <TaskNavTab />
        <div className={styles.tableCard} style={{ textAlign: 'center', padding: '3rem' }}>
          Memuat detail task #{id}...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <button onClick={() => router.back()} className={styles.actionBtn} title="Kembali">
              <ArrowLeft size={16} />
            </button>
            <div>
              <span className={styles.taskNumber}>{task.taskNumber}</span>
              <h2 className={styles.headerTitle} style={{ marginTop: '0.2rem', fontSize: '1.2rem' }}>
                {task.title}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setIsEditing(true)} className={styles.createBtn}>
              <Edit3 size={15} />
              Edit Task
            </button>
            {isAdmin && (
              <button
                onClick={handleDeleteTask}
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                style={{ width: '38px', height: '38px' }}
                title="Hapus Task"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            borderBottom: '1px solid var(--glass-border)',
            paddingBottom: '0.85rem',
            marginBottom: '1.25rem',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('info')}
            className={`${styles.tabItem} ${activeTab === 'info' ? styles.activeTabItem : ''}`}
          >
            Informasi Umum
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`${styles.tabItem} ${activeTab === 'checklist' ? styles.activeTabItem : ''}`}
          >
            Checklist ({task.checklists?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`${styles.tabItem} ${activeTab === 'comments' ? styles.activeTabItem : ''}`}
          >
            Komentar ({task.comments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`${styles.tabItem} ${activeTab === 'attachments' ? styles.activeTabItem : ''}`}
          >
            Lampiran Gambar ({task.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${styles.tabItem} ${activeTab === 'history' ? styles.activeTabItem : ''}`}
          >
            Riwayat Aktivitas ({task.histories?.length || 0})
          </button>
        </div>

        {/* Active Tab Body */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.label}>Status Workflow</label>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className={`${styles.badge} ${styles[`status${task.status}`]}`}>
                    {task.status}
                  </span>
                </div>
              </div>
              <div>
                <label className={styles.label}>Prioritas</label>
                <div style={{ marginTop: '0.35rem' }}>
                  <span className={`${styles.badge} ${styles[`priority${task.priority}`]}`}>
                    {task.priority}
                  </span>
                </div>
              </div>
              <div>
                <label className={styles.label}>Assignee (Penanggung Jawab)</label>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
                  👤 {task.assignee?.name || 'Unassigned'}
                </p>
              </div>
              <div>
                <label className={styles.label}>Reporter (Pembuat Task)</label>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
                  ✍️ {task.createdBy?.name || '-'}
                </p>
              </div>
              <div>
                <label className={styles.label}>Kategori</label>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
                  🏷️ {task.category?.name || '-'}
                </p>
              </div>
              <div>
                <label className={styles.label}>Tags</label>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
                  {task.tags || '-'}
                </p>
              </div>
              <div>
                <label className={styles.label}>Start Date</label>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
                  📅 {task.startDate ? new Date(task.startDate).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
              <div>
                <label className={styles.label}>Due Date (Deadline)</label>
                <p style={{ margin: '0.35rem 0 0', fontWeight: 600 }}>
                  📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
              <label className={styles.label}>Deskripsi Lengkap</label>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.88rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {task.description}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <TaskChecklistSection
            taskId={task.id}
            checklists={task.checklists || []}
            onRefresh={fetchTaskDetails}
          />
        )}

        {activeTab === 'comments' && (
          <TaskCommentSection
            taskId={task.id}
            comments={task.comments || []}
            currentUserId={currentUserId}
            onRefresh={fetchTaskDetails}
          />
        )}

        {activeTab === 'attachments' && (
          <TaskAttachmentSection
            taskId={task.id}
            attachments={task.attachments || []}
            onRefresh={fetchTaskDetails}
          />
        )}

        {activeTab === 'history' && (
          <TaskHistorySection histories={task.histories || []} />
        )}
      </div>

      <TaskFormModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleUpdateTask}
        initialData={task}
        categories={categories}
        users={users}
      />
    </div>
  );
}
