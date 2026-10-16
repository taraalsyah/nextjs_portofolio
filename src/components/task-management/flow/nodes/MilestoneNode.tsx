'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import { Flag, CheckCircle2 } from 'lucide-react';
import styles from './nodeStyles.module.css';

export const MilestoneNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Milestone');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabelValue(nodeData.label || 'Milestone');
  }, [nodeData.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nodeData.locked) {
      setIsEditing(true);
    }
  }, [nodeData.locked]);

  const commitLabel = useCallback(() => {
    setIsEditing(false);
    const newText = labelValue.trim();
    setNodes((nodes) =>
      nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: newText } } : n))
    );
  }, [id, labelValue, setNodes]);

  return (
    <div
      className={styles.nodeWrapper}
      style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 50 }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={140}
        minHeight={45}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <Handle type="target" position={Position.Top} id="top" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} isConnectable={!nodeData.locked} />

      <div
        className={styles.milestoneCard}
        style={{
          background: nodeData.fill || 'var(--surface)',
          borderColor: nodeData.stroke || '#8b5cf6',
          opacity: nodeData.opacity ?? 1,
        }}
      >
        <div className={styles.milestoneIcon}>
          {nodeData.completed ? (
            <CheckCircle2 size={18} color="#16a34a" />
          ) : (
            <Flag size={18} />
          )}
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitLabel();
                if (e.key === 'Escape') {
                  setIsEditing(false);
                  setLabelValue(nodeData.label || '');
                }
              }}
              style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid var(--primary)',
                borderRadius: 4,
                padding: '2px 4px',
                fontSize: 12,
                fontWeight: 600,
                color: 'inherit',
                outline: 'none',
              }}
            />
          ) : (
            <div
              style={{
                fontSize: nodeData.fontSize ? `${nodeData.fontSize}px` : '12px',
                fontWeight: 600,
                color: nodeData.textColor || 'var(--foreground)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {nodeData.label || 'Milestone'}
            </div>
          )}

          {nodeData.milestoneDate && (
            <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
              {new Date(nodeData.milestoneDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

MilestoneNode.displayName = 'MilestoneNode';
