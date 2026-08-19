'use client';

import React from 'react';
import { Eye, Edit3, Trash2, Calendar, User, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';

export interface TaskItem {
  id: number;
  taskNumber: string;
  title: string;
  description: string;
  status: 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CLOSED' | 'LOCKED';
  isLocked?: boolean;
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
  isFetching?: boolean;
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
  isFetching = false,
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

  // Helper to generate page numbers array
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, currentPage + 1);

      if (currentPage <= 2) {
        end = Math.min(totalPages, maxVisible - 1);
      } else if (currentPage >= totalPages - 1) {
        start = Math.max(1, totalPages - (maxVisible - 2));
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const isInitialLoading = isLoading && tasks.length === 0;

  return (
    <div className={styles.tableWrapper}>
      {/* Subtle overlay during pagination/filter background fetching while tasks stay visible */}
      {isFetching && tasks.length > 0 && (
        <div className={styles.tableLoadingOverlay}>
          <div className={styles.tableLoadingBadge}>
            <InlineSpinner size={16} color="var(--primary)" />
            <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>Memuat data task...</span>
          </div>
        </div>
      )}

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
          {isInitialLoading ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem' }}>
                  <InlineSpinner size={18} color="var(--primary)" />
                  <span>Memuat data task...</span>
                </div>
              </td>
            </tr>
          ) : tasks.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>
                <div style={{ color: 'var(--muted-foreground)' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--foreground)', margin: 0 }}>
                    Tidak ada task ditemukan
                  </p>
                  <p style={{ fontSize: '0.78rem', marginTop: '0.2rem', color: 'var(--muted-foreground)' }}>
                    Coba sesuaikan kata kunci pencarian atau filter Anda.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            tasks.map((task) => {
              const completedCount = task.checklists?.filter((c) => c.isCompleted).length || 0;
              const totalChecklists = task.checklists?.length || 0;

              const isDone = task.status === 'DONE' || task.status === 'CLOSED' || task.isLocked === true;
              const isActionDisabled = isDone;

              const editTooltip = isDone
                ? 'Task yang telah selesai tidak dapat diedit atau dihapus.'
                : 'Edit Task';

              const deleteTooltip = isDone
                ? 'Task yang telah selesai tidak dapat diedit atau dihapus.'
                : 'Hapus Task';

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
                        type="button"
                        disabled={isActionDisabled}
                        onClick={(e) => {
                          if (isActionDisabled) {
                            e.preventDefault();
                            e.stopPropagation();
                            return;
                          }
                          onEdit(task);
                        }}
                        className={`${styles.actionBtn} ${isActionDisabled ? styles.lockedOrDoneBtn : ''}`}
                        style={{ cursor: isActionDisabled ? 'not-allowed' : 'pointer' }}
                        title={editTooltip}
                      >
                        <Edit3 size={14} />
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={isActionDisabled}
                          onClick={(e) => {
                            if (isActionDisabled) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            onDelete(task);
                          }}
                          className={`${styles.actionBtn} ${styles.deleteBtn} ${isActionDisabled ? styles.lockedOrDoneBtn : ''}`}
                          style={{ cursor: isActionDisabled ? 'not-allowed' : 'pointer' }}
                          title={deleteTooltip}
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
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span>
            Menampilkan halaman {currentPage} dari {totalPages} ({totalItems} total task)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              disabled={currentPage <= 1 || isFetching}
              onClick={() => onPageChange(currentPage - 1)}
              className={styles.pageBtn}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>

            {getPageNumbers().map((page, idx) =>
              typeof page === 'number' ? (
                <button
                  key={idx}
                  disabled={isFetching}
                  onClick={() => onPageChange(page)}
                  className={`${styles.pageBtn} ${currentPage === page ? styles.pageBtnActive : ''}`}
                >
                  {page}
                </button>
              ) : (
                <span key={idx} style={{ padding: '0 0.25rem', color: 'hsla(0,0%,100%,0.3)' }}>
                  {page}
                </span>
              )
            )}

            <button
              disabled={currentPage >= totalPages || isFetching}
              onClick={() => onPageChange(currentPage + 1)}
              className={styles.pageBtn}
              title="Halaman Selanjutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
