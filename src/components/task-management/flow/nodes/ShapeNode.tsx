'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer, useReactFlow } from '@xyflow/react';
import { FlowNodeData } from '@/types/flow';
import { ShapeRenderer } from './ShapeRenderer';
import styles from './nodeStyles.module.css';

export const ShapeNode: React.FC<NodeProps> = memo(({ id, data, selected, width, height }) => {
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        commitLabel();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setLabelValue(nodeData.label || '');
      }
    },
    [commitLabel, nodeData.label]
  );

  const nodeWidth = width || 160;
  const nodeHeight = height || 70;

  const textStyle: React.CSSProperties = {
    color: nodeData.textColor || '#0f172a',
    fontSize: nodeData.fontSize ? `${nodeData.fontSize}px` : '13px',
    fontFamily: nodeData.fontFamily || 'inherit',
    fontWeight: nodeData.fontWeight || 'normal',
    fontStyle: nodeData.fontStyle || 'normal',
    textDecoration: nodeData.textDecoration || 'none',
    textAlign: nodeData.textAlign || 'center',
  };

  return (
    <div
      className={styles.nodeWrapper}
      style={{ width: '100%', height: '100%', opacity: nodeData.opacity ?? 1 }}
      onDoubleClick={handleDoubleClick}
    >
      <NodeResizer
        isVisible={Boolean(selected && !nodeData.locked)}
        minWidth={60}
        minHeight={40}
        lineClassName="resizer-line"
        handleClassName="resizer-handle"
      />

      <Handle type="target" position={Position.Top} id="top" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} isConnectable={!nodeData.locked} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} isConnectable={!nodeData.locked} />

      <ShapeRenderer
        shapeType={nodeData.shapeType || 'process'}
        width={nodeWidth}
        height={nodeHeight}
        fill={nodeData.fill || '#ffffff'}
        stroke={nodeData.stroke || '#2563eb'}
        strokeWidth={nodeData.strokeWidth ?? 2}
        strokeStyle={nodeData.strokeStyle || 'solid'}
        opacity={nodeData.opacity ?? 1}
      />

      {isEditing ? (
        <textarea
          ref={inputRef}
          value={labelValue}
          onChange={(e) => setLabelValue(e.target.value)}
          onBlur={commitLabel}
          onKeyDown={handleKeyDown}
          className={styles.inlineInput}
          rows={2}
        />
      ) : (
        <div className={styles.labelOverlay} style={textStyle}>
          {nodeData.label || ''}
        </div>
      )}
    </div>
  );
});

ShapeNode.displayName = 'ShapeNode';
