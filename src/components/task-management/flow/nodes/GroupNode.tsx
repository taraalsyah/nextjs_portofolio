'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import styles from './nodeStyles.module.css';

export const GroupNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Swimlane / Group');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLabelValue(nodeData.label || 'Swimlane / Group');
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
      style={{ width: '100%', height: '100%', minWidth: 260, minHeight: 180 }}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={200}
        minHeight={120}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <div
        className={styles.swimlaneContainer}
        style={{
          background: nodeData.fill || 'rgba(248, 250, 252, 0.6)',
          borderColor: nodeData.stroke || '#94a3b8',
          borderWidth: nodeData.strokeWidth ?? 2,
          opacity: nodeData.opacity ?? 1,
        }}
      >
        <div
          className={styles.swimlaneHeader}
          style={{ background: nodeData.headerColor || 'rgba(226, 232, 240, 0.8)' }}
          onDoubleClick={handleDoubleClick}
        >
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
                background: 'transparent',
                border: '1px solid var(--primary)',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 12,
                fontWeight: 700,
                color: 'inherit',
                outline: 'none',
              }}
            />
          ) : (
            <span>{nodeData.label || 'Swimlane / Container'}</span>
          )}
        </div>
        <div className={styles.swimlaneBody} />
      </div>
    </div>
  );
});

GroupNode.displayName = 'GroupNode';
