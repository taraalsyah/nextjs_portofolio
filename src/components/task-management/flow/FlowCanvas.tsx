'use client';

import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  BackgroundVariant,
  useReactFlow,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AppNode, AppEdge } from '@/types/flow';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
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

  return (
    <div
      ref={reactFlowWrapper}
      className={styles.canvasArea}
      style={{ backgroundColor: canvasBg }}
      onDrop={onDropFromPalette}
      onDragOver={onDragOver}
      onDoubleClick={onDoubleClickPane}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={readOnly ? undefined : onNodesChange}
        onEdgesChange={readOnly ? undefined : onEdgesChange}
        onConnect={readOnly ? undefined : onConnect}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes as any}
        edgeTypes={edgeTypes as any}
        onSelectionChange={onSelectionChange as any}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={readOnly ? undefined : (onNodeContextMenu as any)}
        onEdgeContextMenu={readOnly ? undefined : (onEdgeContextMenu as any)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        selectionOnDrag={true}
        panOnDrag={[1, 2]} // Mouse wheel click or drag
        panOnScroll={true}
        zoomOnScroll={true}
        elementsSelectable={!readOnly}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
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

        {readOnly && (
          <Panel position="top-center">
            <div
              style={{
                background: 'var(--warning-subtle)',
                color: 'var(--warning)',
                border: '1px solid var(--warning)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              Mode Hanya Lihat (Read-Only) — Anda tidak memiliki izin untuk mengedit diagram ini.
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
