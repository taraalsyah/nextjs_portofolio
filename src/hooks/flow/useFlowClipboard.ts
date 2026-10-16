import { useState, useCallback, useRef } from 'react';
import { AppNode, AppEdge } from '@/types/flow';

interface ClipboardData {
  nodes: AppNode[];
  edges: AppEdge[];
}

export function useFlowClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
  const pasteOffsetCountRef = useRef<number>(1);

  const copy = useCallback((selectedNodes: AppNode[], edges: AppEdge[]) => {
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const relatedEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    setClipboard({
      nodes: selectedNodes,
      edges: relatedEdges,
    });
    pasteOffsetCountRef.current = 1;
  }, []);

  const paste = useCallback((): { newNodes: AppNode[]; newEdges: AppEdge[] } | null => {
    if (!clipboard || clipboard.nodes.length === 0) return null;

    const offset = pasteOffsetCountRef.current * 30;
    pasteOffsetCountRef.current += 1;

    const idMap = new Map<string, string>();
    const timestamp = Date.now();

    const newNodes: AppNode[] = clipboard.nodes.map((node, idx) => {
      const newId = `node_${timestamp}_${idx}`;
      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset,
          y: node.position.y + offset,
        },
        selected: true,
      };
    });

    const newEdges: AppEdge[] = clipboard.edges.map((edge, idx) => {
      const newSource = idMap.get(edge.source) || edge.source;
      const newTarget = idMap.get(edge.target) || edge.target;

      return {
        ...edge,
        id: `edge_${timestamp}_${idx}`,
        source: newSource,
        target: newTarget,
        selected: true,
      };
    });

    return { newNodes, newEdges };
  }, [clipboard]);

  const duplicate = useCallback(
    (selectedNodes: AppNode[], edges: AppEdge[]): { newNodes: AppNode[]; newEdges: AppEdge[] } | null => {
      if (selectedNodes.length === 0) return null;

      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
      const relatedEdges = edges.filter(
        (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
      );

      const idMap = new Map<string, string>();
      const timestamp = Date.now();

      const newNodes: AppNode[] = selectedNodes.map((node, idx) => {
        const newId = `node_${timestamp}_dup_${idx}`;
        idMap.set(node.id, newId);

        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + 30,
            y: node.position.y + 30,
          },
          selected: true,
        };
      });

      const newEdges: AppEdge[] = relatedEdges.map((edge, idx) => {
        const newSource = idMap.get(edge.source) || edge.source;
        const newTarget = idMap.get(edge.target) || edge.target;

        return {
          ...edge,
          id: `edge_${timestamp}_dup_${idx}`,
          source: newSource,
          target: newTarget,
          selected: true,
        };
      });

      return { newNodes, newEdges };
    },
    []
  );

  return {
    hasClipboardData: Boolean(clipboard && clipboard.nodes.length > 0),
    copy,
    paste,
    duplicate,
  };
}
