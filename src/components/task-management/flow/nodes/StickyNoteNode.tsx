'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import styles from './nodeStyles.module.css';

export const StickyNoteNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLabelValue(nodeData.label || '');
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
      style={{ width: '100%', height: '100%', minWidth: 120, minHeight: 80 }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={100}
        minHeight={60}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <Handle type="target" position={Position.Top} id="top" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} isConnectable={!nodeData.locked} />

      <div
        className={styles.stickyNote}
        style={{
          background: nodeData.fill || '#fef08a',
          borderColor: nodeData.stroke || '#eab308',
          color: nodeData.textColor || '#713f12',
          fontSize: nodeData.fontSize ? `${nodeData.fontSize}px` : '13px',
          opacity: nodeData.opacity ?? 1,
        }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={labelValue}
            onChange={(e) => setLabelValue(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsEditing(false);
                setLabelValue(nodeData.label || '');
              }
            }}
            className={styles.inlineInput}
            style={{ width: '90%', height: '80%', textAlign: 'left' }}
          />
        ) : (
          <span>{nodeData.label || 'Catatan...'}</span>
        )}
      </div>
    </div>
  );
});

StickyNoteNode.displayName = 'StickyNoteNode';
