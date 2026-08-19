'use client';

import React, { useState } from 'react';
import { User, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';

interface KanbanTask {
  id: number;
  taskNumber: string;
  title: string;
  status: 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'DONE';
  isLocked?: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignee?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
  dueDate?: string | null;
}

interface TaskKanbanBoardProps {
  tasks: KanbanTask[];
  onStatusChange: (taskId: number, newStatus: string) => Promise<void>;
  onCardClick: (task: KanbanTask) => void;
}

const COLUMNS: { key: 'BACKLOG' | 'OPEN' | 'IN_PROGRESS' | 'DONE'; title: string }[] = [
  { key: 'BACKLOG', title: 'Backlog' },
  { key: 'OPEN', title: 'Open' },
  { key: 'IN_PROGRESS', title: 'In Progress' },
  { key: 'DONE', title: 'Done' },
];

export function TaskKanbanBoard({ tasks, onStatusChange, onCardClick }: TaskKanbanBoardProps) {
  const [movingTaskId, setMovingTaskId] = useState<number | null>(null);

  const getNextStatus = (current: string): string | null => {
    if (current === 'BACKLOG') return 'OPEN';
    if (current === 'OPEN') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'DONE';
    return null;
  };

  const getPrevStatus = (current: string): string | null => {
    if (current === 'DONE') return 'IN_PROGRESS';
    if (current === 'IN_PROGRESS') return 'OPEN';
    if (current === 'OPEN') return 'BACKLOG';
    return null;
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return styles.priorityLow;
      case 'MEDIUM':
        return styles.priorityMedium;
      case 'HIGH':
        return styles.priorityHigh;
      case 'CRITICAL':
        return styles.priorityCritical;
      default:
        return '';
    }
  };

  const handleMove = async (e: React.MouseEvent, taskId: number, newStatus: string) => {
    e.stopPropagation();
    if (movingTaskId !== null) return;
    setMovingTaskId(taskId);
    try {
      await onStatusChange(taskId, newStatus);
    } finally {
      setMovingTaskId(null);
    }
  };

  return (
    <div className={styles.kanbanGrid}>
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.key);

        return (
          <div key={col.key} className={styles.kanbanColumn}>
            <div className={styles.kanbanHeader}>
              <h4 className={styles.kanbanTitle}>
                {col.title} <span className={styles.kanbanCount}>{colTasks.length}</span>
              </h4>
            </div>

            <div className={styles.kanbanCardList}>
              {colTasks.length === 0 ? (
                <div
                  style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'hsla(0,0%,100%,0.3)',
                    fontSize: '0.78rem',
                    border: '1px dashed var(--glass-border)',
                    borderRadius: '8px',
                  }}
                >
                  Tidak ada task
                </div>
              ) : (
                colTasks.map((task) => {
                  const isUpdating = movingTaskId === task.id;
                  const isDone = task.status === 'DONE' || task.status === ('CLOSED' as any) || task.isLocked === true;
                  const isLocked = isDone;
                  const prev = isDone ? null : getPrevStatus(task.status);
                  const next = isDone ? null : getNextStatus(task.status);

                  return (
                    <div
                      key={task.id}
                      className={styles.kanbanCard}
                      onClick={() => {
                        if (isUpdating || movingTaskId !== null) return;
                        onCardClick(task);
                      }}
                      style={{
                        position: 'relative',
                        opacity: isUpdating ? 0.75 : 1,
                        pointerEvents: isUpdating ? 'none' : 'auto',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Individual Card Loading Overlay */}
                      {isUpdating && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(2px)',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            zIndex: 10,
                            color: '#38bdf8',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                          }}
                        >
                          <InlineSpinner size={16} />
                          <span>Updating...</span>
                        </div>
                      )}

                      <div className={styles.kanbanCardHeader}>
                        <span className={styles.taskNumber}>{task.taskNumber}</span>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                          <span className={`${styles.badge} ${getPriorityBadgeClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>

                      <h5 className={styles.kanbanTaskTitle}>{task.title}</h5>

                      {task.category && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', fontWeight: 500 }}>
                          🏷️ {task.category.name}
                        </div>
                      )}

                      <div className={styles.kanbanCardFooter}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <User size={12} />
                          <span>{task.assignee?.name || 'Unassigned'}</span>
                        </div>

                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          {prev && (
                            <button
                              title={`Kembalikan ke ${prev}`}
                              onClick={(e) => handleMove(e, task.id, prev)}
                              disabled={movingTaskId !== null || isLocked}
                              className={styles.actionBtn}
                              style={{ width: '24px', height: '24px', opacity: movingTaskId !== null || isLocked ? 0.4 : 1 }}
                            >
                              <ChevronLeft size={13} />
                            </button>
                          )}
                          {next && (
                            <button
                              title={`Pindahkan ke ${next}`}
                              onClick={(e) => handleMove(e, task.id, next)}
                              disabled={movingTaskId !== null || isLocked}
                              className={styles.actionBtn}
                              style={{ width: '24px', height: '24px', opacity: movingTaskId !== null || isLocked ? 0.4 : 1 }}
                            >
                              <ChevronRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
