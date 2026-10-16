'use client';

import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  BaseEdge,
  EdgeProps,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  EdgeLabelRenderer,
  useReactFlow,
} from '@xyflow/react';
import { FlowEdgeData } from '@/types/flow';

export const CustomEdge: React.FC<EdgeProps> = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    style = {},
    markerEnd,
    markerStart,
    selected,
  }) => {
    const edgeData = (data || {}) as FlowEdgeData;
    const { setEdges } = useReactFlow();

    const [isEditing, setIsEditing] = useState(false);
    const [labelValue, setLabelValue] = useState(edgeData.label || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      setLabelValue(edgeData.label || '');
    }, [edgeData.label]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const lineType = edgeData.lineType || 'smoothstep';

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    const pathParams = {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    };

    if (lineType === 'straight') {
      [edgePath, labelX, labelY] = getStraightPath(pathParams);
    } else if (lineType === 'bezier') {
      [edgePath, labelX, labelY] = getBezierPath(pathParams);
    } else if (lineType === 'step') {
      [edgePath, labelX, labelY] = getSmoothStepPath({ ...pathParams, borderRadius: 0 });
    } else {
      [edgePath, labelX, labelY] = getSmoothStepPath({ ...pathParams, borderRadius: 10 });
    }

    let strokeDasharray: string | undefined;
    if (edgeData.strokeStyle === 'dashed') strokeDasharray = '5 5';
    if (edgeData.strokeStyle === 'dotted') strokeDasharray = '2 3';

    const stroke = edgeData.stroke || style.stroke || '#64748b';
    const strokeWidth = edgeData.strokeWidth || style.strokeWidth || 2;

    const edgeStyle: React.CSSProperties = {
      ...style,
      stroke: selected ? 'var(--primary)' : stroke,
      strokeWidth: selected ? Number(strokeWidth) + 1 : strokeWidth,
      strokeDasharray,
    };

    const commitLabel = useCallback(() => {
      setIsEditing(false);
      const newLabel = labelValue.trim();
      setEdges((edges) =>
        edges.map((e) =>
          e.id === id
            ? {
                ...e,
                label: newLabel || undefined,
                data: { ...e.data, label: newLabel },
              }
            : e
        )
      );
    }, [id, labelValue, setEdges]);

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          markerStart={markerStart}
          style={edgeStyle}
        />

        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              zIndex: 20,
            }}
            className="nodrag nopan"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
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
                    setLabelValue(edgeData.label || '');
                  }
                }}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--primary)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  outline: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  minWidth: 50,
                  textAlign: 'center',
                }}
              />
            ) : edgeData.label ? (
              <span
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--foreground)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
                title="Klik dua kali untuk mengedit label"
              >
                {edgeData.label}
              </span>
            ) : selected ? (
              <span
                style={{
                  background: 'var(--surface)',
                  border: '1px dashed var(--border)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontSize: 10,
                  color: 'var(--muted-foreground)',
                  cursor: 'pointer',
                  opacity: 0.7,
                }}
                title="Klik dua kali untuk menambahkan label"
              >
                + Label
              </span>
            ) : null}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
);

CustomEdge.displayName = 'CustomEdge';
