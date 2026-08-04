'use client';

import React from 'react';
import { Eye, Edit3, Trash2, Calendar, User, Tag } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

export interface TaskItem {
  id: number;
  taskNumber: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignee?: { id: number; name: string; username?: string; image?: string } | null;
  createdBy?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  tags?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  checklists?: { id: number; isCompleted: boolean }[];
  _count?: { comments: number; attachments: number; checklists: number };
}

interface TaskTableProps {
  tasks: TaskItem[];
  isLoading: boolean;
  isAdmin: boolean;
  onView: (task: TaskItem) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function TaskTable({
  tasks,
  isLoading,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: TaskTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BACKLOG':
        return <span className={`${styles.badge} ${styles.statusBacklog}`}>Backlog</span>;
      case 'OPEN':
        return <span className={`${styles.badge} ${styles.statusOpen}`}>Open</span>;
      case 'IN_PROGRESS':
        return <span className={`${styles.badge} ${styles.statusInProgress}`}>In Progress</span>;
      case 'DONE':
        return <span className={`${styles.badge} ${styles.statusDone}`}>Done</span>;
      default:
        return <span className={styles.badge}>{status}</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return <span className={`${styles.badge} ${styles.priorityLow}`}>Low</span>;
      case 'MEDIUM':
        return <span className={`${styles.badge} ${styles.priorityMedium}`}>Medium</span>;
      case 'HIGH':
        return <span className={`${styles.badge} ${styles.priorityHigh}`}>High</span>;
      case 'CRITICAL':
        return <span className={`${styles.badge} ${styles.priorityCritical}`}>Critical</span>;
      default:
        return <span className={styles.badge}>{priority}</span>;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Task Number</th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Category</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Updated At</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>
                <span style={{ color: 'hsla(0,0%,100%,0.5)' }}>Memuat data task...</span>
              </td>
            </tr>
          ) : tasks.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ color: 'hsla(0,0%,100%,0.5)' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>
                    Tidak ada task ditemukan
                  </p>
                  <p style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                    Coba sesuaikan kata kunci pencarian atau filter Anda.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const completedCount = task.checklists?.filter((c) => c.isCompleted).length || 0;
              const totalChecklists = task.checklists?.length || 0;

              return (
                <tr key={task.id}>
                  <td>
                    <span className={styles.taskNumber}>{task.taskNumber}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span
                        onClick={() => onView(task)}
                        style={{
                          fontWeight: 600,
                          cursor: 'pointer',
                          color: 'var(--fg-color)',
                        }}
                      >
                        {task.title}
                      </span>
                      {totalChecklists > 0 && (
                        <span style={{ fontSize: '0.72rem', color: 'hsla(0,0%,100%,0.4)' }}>
                          Checklist: {completedCount}/{totalChecklists} Selesai
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{getStatusBadge(task.status)}</td>
                  <td>{getPriorityBadge(task.priority)}</td>
                  <td>
                    <span style={{ color: 'hsla(0,0%,100%,0.7)', fontSize: '0.8rem' }}>
                      {task.category?.name || '-'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <User size={13} style={{ color: 'var(--secondary)' }} />
                      <span style={{ fontSize: '0.8rem' }}>
                        {task.assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} style={{ color: 'hsla(0,0%,100%,0.4)' }} />
                      <span style={{ fontSize: '0.78rem' }}>{formatDate(task.dueDate)}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', color: 'hsla(0,0%,100%,0.4)' }}>
                      {formatDate(task.updatedAt)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        gap: '0.35rem',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        onClick={() => onView(task)}
                        className={styles.actionBtn}
                        title="Lihat Detail"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => onEdit(task)}
                        className={styles.actionBtn}
                        title="Edit Task"
                      >
                        <Edit3 size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => onDelete(task)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Hapus Task"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1rem',
            borderTop: '1px solid var(--glass-border)',
            fontSize: '0.78rem',
            color: 'hsla(0,0%,100%,0.5)',
          }}
        >
          <span>
            Menampilkan halaman {currentPage} dari {totalPages} ({totalItems} total task)
          </span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              className={styles.actionBtn}
              style={{ width: 'auto', padding: '0 0.6rem', opacity: currentPage <= 1 ? 0.4 : 1 }}
            >
              Sebelumnya
            </button>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              className={styles.actionBtn}
              style={{
                width: 'auto',
                padding: '0 0.6rem',
                opacity: currentPage >= totalPages ? 0.4 : 1,
              }}
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
