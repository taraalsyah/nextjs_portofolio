'use client';

import React from 'react';
import { useDemo, DemoTask, TaskStatus } from '@/context/DemoContext';
import { ChevronLeft, ChevronRight, User, Plus, Download, ChevronDown, Kanban } from 'lucide-react';
import styles from './demo.module.css';

interface DemoKanbanBoardProps {
  onSelectTask: (task: DemoTask) => void;
  onOpenCreateTask?: () => void;
}

export const DemoKanbanBoard: React.FC<DemoKanbanBoardProps> = ({
  onSelectTask,
  onOpenCreateTask,
}) => {
  const { tasks, activeProjectId, moveTaskStatus } = useDemo();

  const columns: { id: TaskStatus; title: string; defaultCount: number }[] = [
    { id: 'BACKLOG', title: 'Backlog', defaultCount: 12 },
    { id: 'OPEN', title: 'Open', defaultCount: 7 },
    { id: 'IN_PROGRESS', title: 'In Progress', defaultCount: 2 },
    { id: 'DONE', title: 'Done', defaultCount: 25 },
  ];

  const getFilteredTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => {
      if (activeProjectId !== 'ALL' && t.projectId !== activeProjectId) return false;
      return t.status === status;
    });
  };

  const statusOrder: TaskStatus[] = ['BACKLOG', 'OPEN', 'IN_PROGRESS', 'DONE'];

  const handleMoveLeft = (e: React.MouseEvent, task: DemoTask) => {
    e.stopPropagation();
    const currIdx = statusOrder.indexOf(task.status);
    if (currIdx > 0) {
      moveTaskStatus(task.id, statusOrder[currIdx - 1]);
    }
  };

  const handleMoveRight = (e: React.MouseEvent, task: DemoTask) => {
    e.stopPropagation();
    const currIdx = statusOrder.indexOf(task.status);
    if (currIdx < statusOrder.length - 1) {
      moveTaskStatus(task.id, statusOrder[currIdx + 1]);
    }
  };

  return (
    <div>
      {/* Kanban Board Header Card matching Screenshot */}
      <div className={styles.kanbanHeaderCard}>
        <div className={styles.kanbanTitleRow}>
          <div>
            <h2 className={styles.kanbanTitleText}>
              <Kanban size={22} color="#2563eb" /> Kanban Board
            </h2>
            <p className={styles.kanbanSubtext}>
              Pindahkan alur kerja task secara fleksibel dari Backlog hingga Done.
            </p>
          </div>

          <div className={styles.kanbanActionGroup}>
            <button className={styles.downloadReportBtn}>
              <Download size={14} /> Download Report <ChevronDown size={14} />
            </button>
            {onOpenCreateTask && (
              <button className={styles.primaryBlueBtn} onClick={onOpenCreateTask}>
                <Plus size={16} /> Buat Task Baru
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Columns Grid matching Screenshot */}
      <div className={styles.kanbanGrid}>
        {columns.map((col) => {
          const colTasks = getFilteredTasksByStatus(col.id);
          const displayCount = colTasks.length > 0 ? colTasks.length : col.defaultCount;

          return (
            <div key={col.id} className={styles.kanbanCol}>
              <div className={styles.colHeader}>
                <span className={styles.colTitle}>{col.title}</span>
                <span className={styles.badgeCountPill}>{displayCount}</span>
              </div>

              <div>
                {colTasks.map((task) => {
                  const currIdx = statusOrder.indexOf(task.status);
                  const canMoveLeft = currIdx > 0;
                  const canMoveRight = currIdx < statusOrder.length - 1;

                  return (
                    <div
                      key={task.id}
                      className={styles.taskCard}
                      onClick={() => onSelectTask(task)}
                    >
                      {/* Top Row: Task Number & MEDIUM Priority Badge */}
                      <div className={styles.taskHeader}>
                        <span className={styles.taskNum}>{task.taskNumber}</span>
                        <span className={styles.priorityMediumBadge}>
                          {task.priority || 'MEDIUM'}
                        </span>
                      </div>

                      {/* Title */}
                      <div className={styles.taskTitle}>{task.title}</div>

                      {/* Tag / Category Indicator */}
                      <div className={styles.tagRow}>
                        <span className={styles.tagDot} />
                        <span>{task.category || 'Enhancement'}</span>
                      </div>

                      {/* Bottom Row: Assignee Name & Arrow Move Buttons */}
                      <div className={styles.taskBottomRow}>
                        <div className={styles.assigneeBadge}>
                          <User size={12} color="#64748b" />
                          <span>{task.assigneeName || 'Tara Alsyah Icode'}</span>
                        </div>

                        <div className={styles.moveBtnPair}>
                          {canMoveLeft && (
                            <button
                              className={styles.arrowBtn}
                              onClick={(e) => handleMoveLeft(e, task)}
                              title="Pindahkan ke status sebelumnya"
                            >
                              <ChevronLeft size={14} />
                            </button>
                          )}
                          {canMoveRight && (
                            <button
                              className={styles.arrowBtn}
                              onClick={(e) => handleMoveRight(e, task)}
                              title="Pindahkan ke status berikutnya"
                            >
                              <ChevronRight size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DemoKanbanBoard;
