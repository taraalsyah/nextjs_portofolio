'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import { UserCheck } from 'lucide-react';
import styles from './nodeStyles.module.css';

export const RoleNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Project Role / Person');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabelValue(nodeData.label || 'Project Role / Person');
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

  const initials = (nodeData.label || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={styles.nodeWrapper}
      style={{ width: '100%', height: '100%', minWidth: 160, minHeight: 44 }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={140}
        minHeight={40}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <Handle type="target" position={Position.Top} id="top" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} isConnectable={!nodeData.locked} />

      <div
        className={styles.roleCard}
        style={{
          background: nodeData.fill || 'var(--surface)',
          borderColor: nodeData.stroke || 'var(--border)',
          opacity: nodeData.opacity ?? 1,
        }}
      >
        <div className={styles.roleAvatar}>
          {initials || <UserCheck size={14} />}
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
              {nodeData.label || 'Role / User'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

RoleNode.displayName = 'RoleNode';
