'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import styles from './nodeStyles.module.css';

export const TextNode: React.FC<NodeProps> = memo(({ id, data, selected }) => {
  const nodeData = data as FlowNodeData;
  const { setNodes } = useReactFlow();

  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(nodeData.label || 'Teks');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLabelValue(nodeData.label || 'Teks');
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
      style={{
        width: '100%',
        height: '100%',
        minWidth: 80,
        minHeight: 30,
        opacity: nodeData.opacity ?? 1,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={60}
        minHeight={24}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <Handle type="target" position={Position.Top} id="top" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} isConnectable={!nodeData.locked} />

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              commitLabel();
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setLabelValue(nodeData.label || '');
            }
          }}
          className={styles.inlineInput}
          rows={2}
          style={{ width: '90%' }}
        />
      ) : (
        <div
          style={{
            padding: '4px 8px',
            color: nodeData.textColor || 'var(--foreground)',
            fontSize: nodeData.fontSize ? `${nodeData.fontSize}px` : '14px',
            fontWeight: nodeData.fontWeight || 'normal',
            fontStyle: nodeData.fontStyle || 'normal',
            textDecoration: nodeData.textDecoration || 'none',
            textAlign: nodeData.textAlign || 'center',
            wordBreak: 'break-word',
            width: '100%',
          }}
        >
          {nodeData.label || 'Teks'}
        </div>
      )}
    </div>
  );
});

TextNode.displayName = 'TextNode';
