import type { Node, Edge, Viewport } from '@xyflow/react';

export type FlowchartShape =
  | 'process'
  | 'decision'
  | 'startEnd'
  | 'inputOutput'
  | 'document'
  | 'database'
  | 'manualInput'
  | 'predefinedProcess'
  | 'connector'
  | 'delay';

export type BasicShape =
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'triangle'
  | 'hexagon'
  | 'cylinder'
  | 'cloud';

export type AnnotationShape =
  | 'text'
  | 'stickyNote'
  | 'swimlane'
  | 'callout';

export type ProjectIntegrationShape =
  | 'task'
  | 'milestone'
  | 'role';

export type FlowShapeType =
  | FlowchartShape
  | BasicShape
  | AnnotationShape
  | ProjectIntegrationShape;

export type LineType = 'straight' | 'step' | 'smoothstep' | 'bezier';
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowMarkerType = 'none' | 'arrow' | 'arrowclosed' | 'circle';
export type EdgeAnimationMode = 'oneway' | 'reverse' | 'pingpong';

export interface FlowNodeData {
  label: string;
  shapeType: FlowShapeType;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  textColor?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
  opacity?: number;
  zIndex?: number;
  locked?: boolean;

  // Task-specific fields
  taskId?: number | null;
  taskNumber?: string | null;
  taskTitle?: string | null;
  taskStatus?: string | null;
  taskPriority?: string | null;
  assigneeName?: string | null;
  assigneeImage?: string | null;
  dueDate?: string | null;
  isNotFound?: boolean;

  // Milestone-specific fields
  milestoneDate?: string | null;
  completed?: boolean;

  // Role/Person-specific fields
  personName?: string | null;
  roleTitle?: string | null;

  // Swimlane / Container fields
  headerColor?: string;
  orientation?: 'horizontal' | 'vertical';

  [key: string]: unknown;
}

export interface FlowEdgeData {
  label?: string;
  lineType?: LineType;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  markerStart?: ArrowMarkerType;
  markerEnd?: ArrowMarkerType;
  animated?: boolean;
  animationMode?: EdgeAnimationMode;
  [key: string]: unknown;
}

export type AppNode = Node<FlowNodeData, string>;
export type AppEdge = Edge<FlowEdgeData, string>;

export interface FlowData {
  nodes: AppNode[];
  edges: AppEdge[];
  viewport: Viewport;
  gridSize?: number;
  snapToGrid?: boolean;
  showGrid?: boolean;
  backgroundColor?: string;
}

export interface FlowListItem {
  id: number;
  projectId: number;
  name: string;
  description: string | null;
  version: number;
  thumbnail: string | null;
  createdById: number;
  updatedById: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
  updatedBy: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
}

export interface FlowDetail extends FlowListItem {
  data: FlowData;
}

export interface FlowSnapshot {
  nodes: AppNode[];
  edges: AppEdge[];
}

export type CanvasMode = 'select' | 'pan' | 'connect';
