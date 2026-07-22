'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag, CheckSquare, MessageSquare, Image, History, Edit3 } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { TaskChecklistSection } from './TaskChecklistSection';
import { TaskCommentSection } from './TaskCommentSection';
import { TaskAttachmentSection } from './TaskAttachmentSection';
import { TaskHistorySection } from './TaskHistorySection';

interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
  onEditRequest: (task: any) => void;
}

export function TaskDetailModal({
  taskId,
  isOpen,
  onClose,
  currentUserId,
  onEditRequest,
}: TaskDetailModalProps) {
  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'checklist' | 'comments' | 'attachments' | 'history'>('info');

  const fetchTaskDetails = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const json = await res.json();
        setTask(json.task);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTaskDetails();
    } else {
      setTask(null);
    }
  }, [isOpen, taskId]);

  if (!isOpen || !taskId) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <div>
            <span className={styles.taskNumber}>{task?.taskNumber || 'Task Detail'}</span>
            <h3 className={styles.modalTitle} style={{ marginTop: '0.2rem' }}>
              {task?.title || 'Memuat...'}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            {task && (
              <button
                onClick={() => {
                  onClose();
                  onEditRequest(task);
                }}
                className={styles.actionBtn}
                title="Edit Task"
              >
                <Edit3 size={15} />
              </button>
            )}
            <button onClick={onClose} className={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.65rem' }}>
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
            Checklist ({task?.checklists?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`${styles.tabItem} ${activeTab === 'comments' ? styles.activeTabItem : ''}`}
          >
            Komentar ({task?.comments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`${styles.tabItem} ${activeTab === 'attachments' ? styles.activeTabItem : ''}`}
          >
            Lampiran ({task?.attachments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${styles.tabItem} ${activeTab === 'history' ? styles.activeTabItem : ''}`}
          >
            Riwayat ({task?.histories?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        {isLoading || !task ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'hsla(0,0%,100%,0.5)' }}>
            Memuat detail task...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '300px' }}>
            {activeTab === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className={styles.formGrid}>
                  <div>
                    <label className={styles.label}>Status Workflow</label>
                    <div style={{ marginTop: '0.3rem' }}>
                      <span className={`${styles.badge} ${styles[`status${task.status}`]}`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className={styles.label}>Prioritas</label>
                    <div style={{ marginTop: '0.3rem' }}>
                      <span className={`${styles.badge} ${styles[`priority${task.priority}`]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className={styles.label}>Assignee (Penanggung Jawab)</label>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                      👤 {task.assignee?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <label className={styles.label}>Reporter (Dibuat Oleh)</label>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                      ✍️ {task.createdBy?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className={styles.label}>Kategori</label>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                      🏷️ {task.category?.name || '-'}
                    </p>
                  </div>
                  <div>
                    <label className={styles.label}>Tags</label>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                      {task.tags || '-'}
                    </p>
                  </div>
                  <div>
                    <label className={styles.label}>Start Date</label>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                      📅 {task.startDate ? new Date(task.startDate).toLocaleDateString('id-ID') : '-'}
                    </p>
                  </div>
                  <div>
                    <label className={styles.label}>Due Date (Deadline)</label>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>
                      📅 {task.dueDate ? new Date(task.dueDate).toLocaleDateString('id-ID') : '-'}
                    </p>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '0.85rem' }}>
                  <label className={styles.label}>Deskripsi Lengkap</label>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
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
        )}
      </div>
    </div>
  );
}
