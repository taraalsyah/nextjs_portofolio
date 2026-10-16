import dagre from 'dagre';
import { AppNode, AppEdge } from '@/types/flow';

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

export function getAutoLayout(
  nodes: AppNode[],
  edges: AppEdge[],
  direction: LayoutDirection = 'TB'
): { nodes: AppNode[]; edges: AppEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 60 : 70,
    ranksep: isHorizontal ? 80 : 70,
    marginx: 40,
    marginy: 40,
  });

  nodes.forEach((node) => {
    // If it's a swimlane/group, we keep dimensions
    const width = node.width || 160;
    const height = node.height || 70;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) return node;

    const width = node.width || 160;
    const height = node.height || 70;

    return {
      ...node,
      position: {
        x: Math.round(nodeWithPosition.x - width / 2),
        y: Math.round(nodeWithPosition.y - height / 2),
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function alignNodes(nodes: AppNode[], type: AlignmentType): AppNode[] {
  if (nodes.length < 2) return nodes;

  let targetVal = 0;
  if (type === 'left') {
    targetVal = Math.min(...nodes.map((n) => n.position.x));
    return nodes.map((n) => ({ ...n, position: { ...n.position, x: targetVal } }));
  }
  if (type === 'right') {
    targetVal = Math.max(...nodes.map((n) => n.position.x + (n.width || 160)));
    return nodes.map((n) => ({
      ...n,
      position: { ...n.position, x: targetVal - (n.width || 160) },
    }));
  }
  if (type === 'center') {
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const maxX = Math.max(...nodes.map((n) => n.position.x + (n.width || 160)));
    const centerX = (minX + maxX) / 2;
    return nodes.map((n) => ({
      ...n,
      position: { ...n.position, x: Math.round(centerX - (n.width || 160) / 2) },
    }));
  }
  if (type === 'top') {
    targetVal = Math.min(...nodes.map((n) => n.position.y));
    return nodes.map((n) => ({ ...n, position: { ...n.position, y: targetVal } }));
  }
  if (type === 'bottom') {
    targetVal = Math.max(...nodes.map((n) => n.position.y + (n.height || 70)));
    return nodes.map((n) => ({
      ...n,
      position: { ...n.position, y: targetVal - (n.height || 70) },
    }));
  }
  if (type === 'middle') {
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxY = Math.max(...nodes.map((n) => n.position.y + (n.height || 70)));
    const centerY = (minY + maxY) / 2;
    return nodes.map((n) => ({
      ...n,
      position: { ...n.position, y: Math.round(centerY - (n.height || 70) / 2) },
    }));
  }

  return nodes;
}

export type DistributionType = 'horizontal' | 'vertical';

export function distributeNodes(nodes: AppNode[], type: DistributionType): AppNode[] {
  if (nodes.length < 3) return nodes;

  const sorted = [...nodes].sort((a, b) =>
    type === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y
  );

  if (type === 'horizontal') {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = last.position.x - first.position.x;
    const step = totalSpan / (sorted.length - 1);

    return sorted.map((n, idx) => ({
      ...n,
      position: {
        ...n.position,
        x: Math.round(first.position.x + idx * step),
      },
    }));
  } else {
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan = last.position.y - first.position.y;
    const step = totalSpan / (sorted.length - 1);

    return sorted.map((n, idx) => ({
      ...n,
      position: {
        ...n.position,
        y: Math.round(first.position.y + idx * step),
      },
    }));
  }
}
