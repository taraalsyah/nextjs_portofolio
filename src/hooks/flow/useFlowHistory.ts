import { useState, useCallback, useRef } from 'react';
import { AppNode, AppEdge, FlowSnapshot } from '@/types/flow';

const MAX_HISTORY_STEPS = 100;

export function useFlowHistory(initialNodes: AppNode[] = [], initialEdges: AppEdge[] = []) {
  const [past, setPast] = useState<FlowSnapshot[]>([]);
  const [present, setPresent] = useState<FlowSnapshot>({
    nodes: initialNodes,
    edges: initialEdges,
  });
  const [future, setFuture] = useState<FlowSnapshot[]>([]);

  // Ref to track last snapshot timestamp to prevent high-frequency drag events from spamming history
  const lastSnapshotTimeRef = useRef<number>(0);

  const takeSnapshot = useCallback(
    (nodes: AppNode[], edges: AppEdge[], force: boolean = false) => {
      const now = Date.now();
      // Debounce non-forced snapshots (e.g. during drags) within 300ms
      if (!force && now - lastSnapshotTimeRef.current < 300) {
        setPresent({ nodes, edges });
        return;
      }

      lastSnapshotTimeRef.current = now;

      setPast((prevPast) => {
        const nextPast = [...prevPast, present];
        if (nextPast.length > MAX_HISTORY_STEPS) {
          return nextPast.slice(nextPast.length - MAX_HISTORY_STEPS);
        }
        return nextPast;
      });

      setPresent({ nodes, edges });
      setFuture([]); // Clear future redo branch on new action
    },
    [present]
  );

  const undo = useCallback((): FlowSnapshot | null => {
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prevFuture) => [present, ...prevFuture]);
    setPresent(previous);
    setPast(newPast);

    return previous;
  }, [past, present]);

  const redo = useCallback((): FlowSnapshot | null => {
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, present]);
    setPresent(next);
    setFuture(newFuture);

    return next;
  }, [future, present]);

  const clearHistory = useCallback((nodes: AppNode[], edges: AppEdge[]) => {
    setPast([]);
    setPresent({ nodes, edges });
    setFuture([]);
  }, []);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    takeSnapshot,
    clearHistory,
    currentSnapshot: present,
  };
}
