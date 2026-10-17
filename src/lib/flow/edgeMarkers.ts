import { MarkerType, type EdgeMarker } from '@xyflow/react';
import { ArrowMarkerType, AppEdge, FlowEdgeData } from '@/types/flow';

/**
 * Sanitizes a color string (e.g. #64748b) to be safely used in an SVG ID.
 */
export function sanitizeColorToId(color: string): string {
  return color.toLowerCase().replace(/[^a-z0-9]/g, '') || 'default';
}

/**
 * Maps an ArrowMarkerType option to a valid React Flow v12 marker.
 * - 'none' | undefined -> undefined (no marker)
 * - 'arrow' -> EdgeMarker with MarkerType.Arrow (open arrow)
 * - 'arrowclosed' -> EdgeMarker with MarkerType.ArrowClosed (filled arrow)
 * - 'circle' -> Custom SVG marker ID string
 */
export function buildEdgeMarker(
  markerType: ArrowMarkerType | undefined,
  color: string = '#64748b',
  strokeWidth: number = 2
): EdgeMarker | string | undefined {
  if (!markerType || markerType === 'none') {
    return undefined;
  }

  // Dimensions scale proportionally with strokeWidth
  const size = Math.max(12, Math.min(24, Number(strokeWidth) * 5));

  if (markerType === 'arrow') {
    return {
      type: MarkerType.Arrow,
      color,
      width: size,
      height: size,
    };
  }

  if (markerType === 'arrowclosed') {
    return {
      type: MarkerType.ArrowClosed,
      color,
      width: size,
      height: size,
    };
  }

  if (markerType === 'circle') {
    return `flow-circle-${sanitizeColorToId(color)}`;
  }

  return undefined;
}

/**
 * Helper to extract ArrowMarkerType ('none' | 'arrow' | 'arrowclosed' | 'circle')
 * from either a string or a React Flow EdgeMarker object.
 */
export function getArrowMarkerType(
  markerValue: unknown,
  fallback: ArrowMarkerType = 'none'
): ArrowMarkerType {
  if (!markerValue) return 'none';

  if (typeof markerValue === 'string') {
    if (
      markerValue === 'arrow' ||
      markerValue === 'arrowclosed' ||
      markerValue === 'circle' ||
      markerValue === 'none'
    ) {
      return markerValue;
    }
    if (markerValue.includes('circle')) {
      return 'circle';
    }
    return fallback;
  }

  if (typeof markerValue === 'object' && markerValue !== null) {
    const type = (markerValue as any).type;
    if (type === 'arrow' || type === MarkerType.Arrow) return 'arrow';
    if (type === 'arrowclosed' || type === MarkerType.ArrowClosed) return 'arrowclosed';
  }

  return fallback;
}

/**
 * Normalizes an edge so both its `data` and top-level React Flow properties
 * (`markerEnd`, `markerStart`, `style`, `animated`) are synchronized and valid.
 */
export function normalizeEdge(edge: AppEdge): AppEdge {
  const data = (edge.data || {}) as FlowEdgeData;
  const stroke = data.stroke || (edge.style?.stroke as string) || '#64748b';
  const strokeWidth = Number(data.strokeWidth) || Number(edge.style?.strokeWidth) || 2;

  // Derive markerEnd and markerStart type from data or top-level properties
  const markerEndType: ArrowMarkerType =
    data.markerEnd !== undefined && data.markerEnd !== null
      ? (data.markerEnd as ArrowMarkerType)
      : edge.markerEnd !== undefined
      ? getArrowMarkerType(edge.markerEnd, 'none')
      : 'none';

  const markerStartType: ArrowMarkerType =
    data.markerStart !== undefined && data.markerStart !== null
      ? (data.markerStart as ArrowMarkerType)
      : edge.markerStart !== undefined
      ? getArrowMarkerType(edge.markerStart, 'none')
      : 'none';

  return {
    ...edge,
    data: {
      ...data,
      stroke,
      strokeWidth,
      markerEnd: markerEndType,
      markerStart: markerStartType,
    },
    markerEnd: buildEdgeMarker(markerEndType, stroke, strokeWidth),
    markerStart: buildEdgeMarker(markerStartType, stroke, strokeWidth),
    animated: edge.animated ?? Boolean(data.animated),
    style: {
      ...edge.style,
      stroke,
      strokeWidth,
    },
  };
}

/**
 * Normalizes a list of edges.
 */
export function normalizeEdges(edges: AppEdge[]): AppEdge[] {
  return edges.map(normalizeEdge);
}
