'use client';

import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import { ExternalLink, AlertTriangle, Calendar, User as UserIcon } from 'lucide-react';
import styles from './nodeStyles.module.css';

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  BACKLOG: { label: 'Backlog', bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  OPEN: { label: 'Open', bg: '#eff6ff', color: '#1e40af', dot: '#3b82f6' },
  IN_PROGRESS: { label: 'In Progress', bg: '#fffbeb', color: '#92400e', dot: '#f59e0b' },
  DONE: { label: 'Done', bg: '#f0fdf4', color: '#166534', dot: '#22c55e' },
};

const PRIORITY_CONFIG: Record<string, { bg: string; color: string }> = {
  LOW: { bg: 'rgba(56, 189, 248, 0.15)', color: '#0369a1' },
  MEDIUM: { bg: 'rgba(245, 158, 11, 0.15)', color: '#b45309' },
  HIGH: { bg: 'rgba(249, 115, 22, 0.15)', color: '#c2410c' },
  CRITICAL: { bg: 'rgba(244, 63, 94, 0.15)', color: '#be123c' },
};

export const TaskNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;

  const handleOpenTask = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (nodeData.taskId) {
        window.dispatchEvent(
          new CustomEvent('flow:open-task-modal', {
            detail: { taskId: nodeData.taskId },
          })
        );
      }
    },
    [nodeData.taskId]
  );

  const statusInfo = STATUS_CONFIG[nodeData.taskStatus || 'OPEN'] || STATUS_CONFIG.OPEN;
  const priorityInfo = PRIORITY_CONFIG[nodeData.taskPriority || 'MEDIUM'] || PRIORITY_CONFIG.MEDIUM;

  const formattedDueDate = nodeData.dueDate
    ? new Date(nodeData.dueDate).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })
    : null;

  return (
    <div
      className={styles.nodeWrapper}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 220,
        minHeight: 120,
        opacity: nodeData.opacity ?? 1,
      }}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={200}
        minHeight={100}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <Handle type="target" position={Position.Top} id="top" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} isConnectable={!nodeData.locked} />

      <div className={styles.taskCard}>
        {nodeData.isNotFound ? (
          <div className={styles.taskNotFound}>
            <AlertTriangle size={24} />
            <div>Task tidak ditemukan</div>
            <div style={{ fontSize: 11, fontWeight: 400, opacity: 0.8 }}>
              Task #{nodeData.taskId} mungkin telah dihapus dari proyek ini.
            </div>
          </div>
        ) : (
          <>
            <div className={styles.taskHeader}>
              <span className={styles.taskNumber}>
                {nodeData.taskNumber || (nodeData.taskId ? `#TASK-${nodeData.taskId}` : 'TASK')}
              </span>
              <span
                className={styles.taskPriorityBadge}
                style={{ background: priorityInfo.bg, color: priorityInfo.color }}
              >
                {nodeData.taskPriority || 'MEDIUM'}
              </span>
            </div>

            <div className={styles.taskBody}>
              <div className={styles.taskTitle}>
                {nodeData.taskTitle || nodeData.label || 'Task Tanpa Judul'}
              </div>
            </div>

            <div className={styles.taskFooter}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  className={styles.statusPill}
                  style={{ background: statusInfo.bg, color: statusInfo.color }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: statusInfo.dot,
                    }}
                  />
                  {statusInfo.label}
                </span>

                {formattedDueDate && (
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--muted-foreground)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Calendar size={11} />
                    {formattedDueDate}
                  </span>
                )}
              </div>

              {nodeData.taskId && (
                <button
                  type="button"
                  className={styles.openTaskBtn}
                  onClick={handleOpenTask}
                  title="Buka detail task"
                >
                  <span>Buka</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
