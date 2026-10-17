'use client';

import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppNode, AppEdge } from '@/types/flow';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { sanitizeColorToId } from '@/lib/flow/edgeMarkers';
import styles from './flowComponents.module.css';

interface FlowCanvasProps {
  nodes: AppNode[];
  edges: AppEdge[];
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange<AppEdge>;
  onConnect: (connection: Connection) => void;
  onSelectionChange: (params: { nodes: AppNode[]; edges: AppEdge[] }) => void;
  onPaneContextMenu: (e: React.MouseEvent | MouseEvent) => void;
  onNodeContextMenu: (e: React.MouseEvent, node: AppNode) => void;
  onEdgeContextMenu: (e: React.MouseEvent, edge: AppEdge) => void;
  onPaneClick: (e: React.MouseEvent) => void;
  onDropFromPalette: (e: React.DragEvent) => void;
  onDoubleClickPane: (e: React.MouseEvent) => void;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  canvasBg: string;
  showMinimap: boolean;
  readOnly?: boolean;
  defaultViewport?: { x: number; y: number; zoom: number };
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onPaneContextMenu,
  onNodeContextMenu,
  onEdgeContextMenu,
  onPaneClick,
  onDropFromPalette,
  onDoubleClickPane,
  showGrid,
  snapToGrid,
  gridSize,
  canvasBg,
  showMinimap,
  readOnly = false,
  defaultViewport,
}: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      // Prevent self-loop
      if (connection.source === connection.target) return false;

      // Prevent duplicate edges
      const isDuplicate = edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === connection.sourceHandle &&
          e.targetHandle === connection.targetHandle
      );
      return !isDuplicate;
    },
    [edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Dynamic SVG defs for custom circle markers based on active edge colors
  const circleMarkers = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const edge of edges) {
      const data = edge.data;
      const stroke = (data?.stroke as string) || (edge.style?.stroke as string) || '#64748b';
      if (data?.markerEnd === 'circle' || data?.markerStart === 'circle') {
        const id = `flow-circle-${sanitizeColorToId(stroke)}`;
        map.set(id, stroke);
      }
    }
    return Array.from(map.entries()).map(([id, color]) => ({ id, color }));
  }, [edges]);

  // When in read-only mode, render nodes with locked & readOnly flags to disable resizers & inline text editing
  const renderedNodes = React.useMemo(() => {
    if (!readOnly) return nodes;
    return nodes.map((node) => ({
      ...node,
      draggable: false,
      connectable: false,
      selectable: true,
      data: {
        ...node.data,
        locked: true,
        readOnly: true,
      },
    }));
  }, [nodes, readOnly]);

  return (
    <div
      ref={reactFlowWrapper}
      className={styles.canvasArea}
      style={{ backgroundColor: canvasBg }}
      onDrop={readOnly ? undefined : onDropFromPalette}
      onDragOver={readOnly ? undefined : onDragOver}
      onDoubleClick={readOnly ? undefined : onDoubleClickPane}
    >
      {circleMarkers.length > 0 && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <defs>
            {circleMarkers.map(({ id, color }) => (
              <marker
                key={id}
                id={id}
                viewBox="-6 -6 12 12"
                refX="0"
                refY="0"
                markerWidth={10}
                markerHeight={10}
                orient="auto"
              >
                <circle cx="0" cy="0" r="3.5" fill={color} stroke={color} strokeWidth="1" />
              </marker>
            ))}
          </defs>
        </svg>
      )}
      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        onSelectionChange={onSelectionChange as any}
        onPaneClick={onPaneClick}
        onPaneContextMenu={readOnly ? undefined : onPaneContextMenu}
        onNodeContextMenu={readOnly ? undefined : (onNodeContextMenu as any)}
        onEdgeContextMenu={readOnly ? undefined : (onEdgeContextMenu as any)}
        defaultViewport={defaultViewport}
        fitView={!defaultViewport}
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionOnDrag={!readOnly}
        panOnDrag={[1, 2]} // Mouse wheel click or drag
        panOnScroll={true}
        zoomOnScroll={true}
        elementsSelectable={true}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        edgesReconnectable={!readOnly}
        minZoom={0.1}
        maxZoom={3}
      >
        {showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={gridSize}
            size={1.5}
            color="rgba(100, 116, 139, 0.25)"
          />
        )}

        <Controls
          showInteractive={false}
          position="bottom-left"
          className={styles.flowControls}
          style={{
            margin: '14px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        />

        {showMinimap && (
          <MiniMap
            zoomable
            pannable
            position="bottom-right"
            nodeColor={(n) => {
              if (n.type === 'taskNode') return 'var(--primary)';
              if (n.type === 'groupNode') return 'rgba(203, 213, 225, 0.5)';
              return (n.data?.fill as string) || '#cbd5e1';
            }}
            nodeStrokeColor={(n) => (n.data?.stroke as string) || '#94a3b8'}
            nodeBorderRadius={4}
            maskColor="rgba(241, 245, 249, 0.7)"
            style={{
              margin: '14px',
              width: 140,
              height: 90,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            }}
          />
        )}

      </ReactFlow>
    </div>
  );
}
