import { useState, useEffect, useRef, useCallback } from 'react';
import { FlowData } from '@/types/flow';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseFlowAutosaveOptions {
  flowId: number | null;
  flowData: FlowData;
  flowName: string;
  version?: number;
  onSave: (data: FlowData, name: string) => Promise<boolean>;
  enabled?: boolean;
}

export interface UseFlowAutosaveReturn {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  isDirty: boolean;
  triggerManualSave: () => Promise<boolean>;
}

/**
 * Computes a deterministic JSON fingerprint of meaningful diagram content.
 * Ephemeral properties like selection state are omitted to avoid false dirty states.
 */
function computeDataFingerprint(name: string, data: FlowData): string {
  if (!data) return '';
  return JSON.stringify({
    name: name?.trim() || '',
    nodes: (data.nodes || []).map((n) => ({
      id: n.id,
      type: n.type,
      x: Math.round(n.position?.x ?? 0),
      y: Math.round(n.position?.y ?? 0),
      w: n.width,
      h: n.height,
      data: n.data,
    })),
    edges: (data.edges || []).map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      data: e.data,
    })),
    gridSize: data.gridSize,
    snapToGrid: data.snapToGrid,
    showGrid: data.showGrid,
    backgroundColor: data.backgroundColor,
  });
}

export function useFlowAutosave({
  flowId,
  flowData,
  flowName,
  onSave,
  enabled = true,
}: UseFlowAutosaveOptions): UseFlowAutosaveReturn {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Keep latest refs to prevent stale closure inside debounce
  const latestDataRef = useRef(flowData);
  const latestNameRef = useRef(flowName);
  const onSaveRef = useRef(onSave);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Baseline fingerprint tracking
  const lastSavedFingerprintRef = useRef<string>('');
  const isInitializedRef = useRef<boolean>(false);

  useEffect(() => {
    latestDataRef.current = flowData;
    latestNameRef.current = flowName;
    onSaveRef.current = onSave;
  }, [flowData, flowName, onSave]);

  const triggerSave = useCallback(async (): Promise<boolean> => {
    if (!enabled || !flowId) return true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setStatus('saving');
    try {
      const dataToSave = latestDataRef.current;
      const nameToSave = latestNameRef.current;
      const success = await onSaveRef.current(dataToSave, nameToSave);
      if (success) {
        lastSavedFingerprintRef.current = computeDataFingerprint(nameToSave, dataToSave);
        setStatus('saved');
        setIsDirty(false);
        setLastSavedAt(new Date());
        return true;
      } else {
        setStatus('error');
        return false;
      }
    } catch (err) {
      console.error('Autosave error:', err);
      setStatus('error');
      return false;
    }
  }, [enabled, flowId]);

  // Track real data/name changes via deterministic fingerprint
  useEffect(() => {
    if (!enabled || !flowId) return;

    const currentFingerprint = computeDataFingerprint(flowName, flowData);

    // Initial load: store baseline fingerprint without triggering save
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      lastSavedFingerprintRef.current = currentFingerprint;
      return;
    }

    // If data matches last saved state, diagram is clean: DO NOT trigger save
    if (currentFingerprint === lastSavedFingerprintRef.current) {
      return;
    }

    // Real modification detected
    setIsDirty(true);
    setStatus('idle');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      triggerSave();
    }, 2000); // 2 seconds debounce

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [flowData, flowName, enabled, flowId, triggerSave]);

  // Window beforeunload warning when dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'Terdapat perubahan yang belum tersimpan. Yakin ingin meninggalkan halaman?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    lastSavedAt,
    isDirty,
    triggerManualSave: triggerSave,
  };
}
