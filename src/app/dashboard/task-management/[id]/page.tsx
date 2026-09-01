'use client';

import React, { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit3, Trash2, ShieldAlert, User, UserCheck, Tag, Calendar, Hash, CheckCircle, X } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskChecklistSection } from '@/components/task-management/TaskChecklistSection';
import { TaskCommentSection } from '@/components/task-management/TaskCommentSection';
import { TaskAttachmentSection } from '@/components/task-management/TaskAttachmentSection';
import { TaskHistorySection } from '@/components/task-management/TaskHistorySection';
import { TaskFormModal } from '@/components/task-management/TaskFormModal';
import { ConfirmDeleteModal } from '@/components/ui/ConfirmDeleteModal';
import { useSafeToast } from '@/components/ui/Toast';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useProjectContext } from '@/context/ProjectContext';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';
import type { ProjectPermissions } from '@/lib/project';
import type { TaskStatus, TaskPriority } from '@/lib/task';

interface TaskDetail {
  id: number;
  taskNumber: string;
  projectId: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number | null;
  createdById: number;
  categoryId: number | null;
  tags: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee: { id: number; name: string; username?: string; email?: string; image?: string | null } | null;
  createdBy: { id: number; name: string; username?: string; email?: string; image?: string | null } | null;
  category: { id: number; name: string; description?: string } | null;
  checklists: { id: number; title: string; isCompleted: boolean }[];
  comments: { id: number; content: string; createdAt: string; userId: number; user: { id: number; name: string; username?: string; image?: string } }[];
  attachments: { id: number; fileName: string; fileUrl: string; fileSize: number; fileType: string; createdAt: string; uploadedById: number; uploadedBy: { id: number; name: string } }[];
  histories: { id: number; action: string; fieldName: string | null; previousValue: string | null; newValue: string | null; createdAt: string; userId: number; user: { id: number; name: string } }[];
}

interface TaskFormData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: number | null;
  categoryId?: number | null;
  tags?: string;
  startDate?: string | null;
  dueDate?: string | null;
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'BACKLOG':
      return styles.statusBacklog;
    case 'OPEN':
      return styles.statusOpen;
    case 'IN_PROGRESS':
      return styles.statusInProgress;
    case 'DONE':
      return styles.statusDone;
    case 'CLOSED':
    case 'LOCKED':
      return styles.statusLocked;
    default:
      return styles.statusBacklog;
  }
};

const getPriorityBadgeClass = (priority: string) => {
  switch (priority) {
    case 'LOW':
    case 'Low':
      return styles.priorityLow;
    case 'MEDIUM':
    case 'Medium':
      return styles.priorityMedium;
    case 'HIGH':
    case 'High':
      return styles.priorityHigh;
    case 'CRITICAL':
    case 'Critical':
      return styles.priorityCritical;
    default:
      return styles.priorityLow;
  }
};

const renderFormattedStatusMsg = (msg: string) => {
  const statusKeys = ['BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE', 'CLOSED'];
  const foundStatus = statusKeys.find((key) => msg.includes(key));

  if (foundStatus) {
    const parts = msg.split(foundStatus);
    const displayLabel = foundStatus === 'IN_PROGRESS' ? 'IN PROGRESS' : foundStatus;
    const badgeClass = getStatusBadgeClass(foundStatus);
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.2rem' }}>
        <span>{parts[0]}</span>
        <span
          className={`${styles.badge} ${badgeClass}`}
          style={{
            margin: '0 0.25rem',
            padding: '0.2rem 0.55rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          {displayLabel}
        </span>
        <span>{parts[1]}</span>
      </span>
    );
  }

  return <span>{msg}</span>;
};

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const taskId = parseInt(id, 10);

  const { data: session, status } = useSession();
  const router = useRouter();
  const toastCtx = useSafeToast();
  const { activeProject, switchProject } = useProjectContext();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [userPermissions, setUserPermissions] = useState<ProjectPermissions | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { users } = useProjectMembers();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'comments' | 'attachments' | 'history'>('info');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const currentUserId = parseInt(session?.user?.id || '0', 10);

  const taskRole = userPermissions?.role || 'MEMBER';
  const isOwnerOrAdmin = taskRole === 'OWNER' || taskRole === 'ADMIN';
  const isAssignee = task?.assigneeId === currentUserId;
  const canEditMetadata = isOwnerOrAdmin;
  const canUpdateProgress = isOwnerOrAdmin || isAssignee;

  const handleStatusChange = async (newStatus: string) => {
    if (!task || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          message: data.error || 'Anda tidak memiliki izin untuk mengubah status ini.',
        });
        return;
      }

      setTask((prev) => (prev ? { ...prev, status: data.task.status as TaskStatus } : prev));
      setStatusMsg({
        type: 'success',
        message: `Status workflow berhasil diubah ke ${data.task.status}.`,
      });
      fetchTaskDetails();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal mengubah status workflow.';
      setStatusMsg({
        type: 'error',
        message: errMsg,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') return;

    const targetProjId = activeProject?.projectId;
    const url = targetProjId ? `/api/task-categories?projectId=${targetProjId}` : '/api/task-categories';

    fetch(url)
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, [status, activeProject?.projectId]);

  const fetchTaskDetails = async () => {
    if (!taskId || isNaN(taskId)) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setUserPermissions(data.userPermissions);

        // Auto sync active project if task belongs to a different project
        if (data.task?.projectId && activeProject?.projectId !== data.task.projectId) {
          switchProject(data.task.projectId).catch(() => {});
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      void (async () => {
        await fetchTaskDetails();
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId, status]);

  const handleUpdateTask = async (formData: TaskFormData) => {
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

  const handleDeleteTaskClick = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteTask = async () => {
    if (!task) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        if (toastCtx?.showToast) toastCtx.showToast(`Task ${task.taskNumber} berhasil dihapus.`, 'success');
        setIsDeleteModalOpen(false);
        router.push('/dashboard/task-management');
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || 'Gagal menghapus task.');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menghapus task. Silakan coba lagi.';
      if (toastCtx?.showToast) toastCtx.showToast(errMsg, 'error');
    }
  };

  if (isLoading || !task) {
    return (
      <div className={styles.container}>
        <TaskNavTab />
        <div className={styles.tableCard}>
          <div className={styles.loadingBox}>
            <InlineSpinner size={18} color="var(--primary)" />
            <span>Memuat detail task #{id}...</span>
          </div>
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
            {canEditMetadata && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`${styles.createBtn} ${task.status === 'CLOSED' ? styles.disabledBtn : styles.noPointerBtn}`}
                >
                  <Edit3 size={15} />
                  Edit Task
                </button>
                <button
                  onClick={handleDeleteTaskClick}
                  className={`${styles.actionBtn} ${styles.deleteBtn} ${task.status === 'CLOSED' ? styles.disabledBtn : styles.noPointerBtn}`}
                  style={{ width: '38px', height: '38px' }}
                  title="Hapus Task"
                >
                  <Trash2 size={16} />
                </button>
              </>
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

        {/* Status Alert Banner */}
        {statusMsg && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              margin: '0.65rem 0 1rem',
              background: statusMsg.type === 'error' ? '#FEF2F2' : '#F0FDF4',
              border: statusMsg.type === 'error' ? '1px solid #FCA5A5' : '1px solid #BBF7D0',
              color: statusMsg.type === 'error' ? '#991B1B' : '#15803D',
              fontSize: '0.85rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
              {statusMsg.type === 'error' ? (
                <ShieldAlert size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
              ) : (
                <CheckCircle size={18} style={{ color: '#16A34A', flexShrink: 0 }} />
              )}
              <div style={{ lineHeight: '1.4' }}>
                {renderFormattedStatusMsg(statusMsg.message)}
              </div>
            </div>
            <button
              onClick={() => setStatusMsg(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: statusMsg.type === 'error' ? '#991B1B' : '#15803D',
                cursor: 'pointer',
                padding: '0.2rem',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.7,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
              title="Tutup notifikasi"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Active Tab Body */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className={styles.infoGrid}>
              {/* Status Workflow */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Status Workflow</label>
                <div className={styles.infoValue}>
                  {canUpdateProgress ? (
                    <>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={styles.select}
                        disabled={isUpdatingStatus || task.status === 'CLOSED'}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.85rem', opacity: isUpdatingStatus ? 0.7 : 1 }}
                      >
                        <option value="BACKLOG">Backlog</option>
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE" disabled={!isOwnerOrAdmin}>
                          Done {!isOwnerOrAdmin ? '(Membutuhkan Approval)' : ''}
                        </option>
                        {task.status === 'CLOSED' && <option value="CLOSED">Closed</option>}
                      </select>
                      {isUpdatingStatus && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <InlineSpinner size={14} /> Updating...
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={`${styles.badge} ${getStatusBadgeClass(task.status)}`}>
                      {task.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Prioritas */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Prioritas</label>
                <div className={styles.infoValue}>
                  <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Assignee */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Assignee (Penanggung Jawab)</label>
                <div className={styles.infoValue}>
                  <User size={15} className={styles.infoIcon} />
                  <span>{task.assignee?.name || 'Unassigned'}</span>
                </div>
              </div>

              {/* Reporter */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Reporter (Pembuat Task)</label>
                <div className={styles.infoValue}>
                  <UserCheck size={15} className={styles.infoIcon} />
                  <span>{task.createdBy?.name || '-'}</span>
                </div>
              </div>

              {/* Kategori */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Kategori</label>
                <div className={styles.infoValue}>
                  <Tag size={15} className={styles.infoIcon} />
                  <span>{task.category?.name || '-'}</span>
                </div>
              </div>

              {/* Tags */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Tags</label>
                <div className={styles.infoValue}>
                  <Hash size={15} className={styles.infoIcon} />
                  <span>{task.tags || '-'}</span>
                </div>
              </div>

              {/* Start Date */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Start Date</label>
                <div className={styles.infoValue}>
                  <Calendar size={15} className={styles.infoIcon} />
                  <span>
                    {task.startDate
                      ? new Date(task.startDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div className={styles.infoCard}>
                <label className={styles.label}>Due Date (Deadline)</label>
                <div className={styles.infoValue}>
                  <Calendar size={15} className={styles.infoIcon} />
                  <span>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </span>
                </div>
              </div>

              {/* Deskripsi Lengkap */}
              <div className={`${styles.infoCard} ${styles.infoCardFull}`}>
                <label className={styles.label}>Deskripsi Lengkap</label>
                <p className={styles.descriptionBox}>
                  {task.description || 'Tidak ada deskripsi.'}
                </p>
              </div>
            </div>
          </div>
        )}

            {activeTab === 'checklist' && (
          <TaskChecklistSection
            taskId={task.id}
            checklists={task.checklists || []}
            onRefresh={fetchTaskDetails}
            canUpdateProgress={canUpdateProgress}
          />
        )}

        {activeTab === 'comments' && (
          <TaskCommentSection
            taskId={task.id}
            comments={task.comments || []}
            currentUserId={currentUserId}
            onRefresh={fetchTaskDetails}
            canUpdateProgress={canUpdateProgress}
          />
        )}

        {activeTab === 'attachments' && (
          <TaskAttachmentSection
            taskId={task.id}
            attachments={task.attachments || []}
            onRefresh={fetchTaskDetails}
            canUpdateProgress={canUpdateProgress}
            currentUserId={currentUserId}
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

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title={`Hapus Task ${task?.taskNumber || ''}?`}
        description={`Apakah Anda yakin ingin menghapus task ${task?.taskNumber || ''}${task?.title ? ` - "${task.title}"` : ''}? Data yang dihapus tidak dapat dikembalikan.`}
        onConfirm={handleConfirmDeleteTask}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
