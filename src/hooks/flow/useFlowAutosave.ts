import { useState, useEffect, useRef, useCallback } from 'react';
import { FlowData } from '@/types/flow';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseFlowAutosaveOptions {
  flowId: number | null;
  flowData: FlowData;
  flowName: string;
  version: number;
  onSave: (data: FlowData, name: string) => Promise<boolean>;
  enabled?: boolean;
}

export function useFlowAutosave({
  flowId,
  flowData,
  flowName,
  version,
  onSave,
  enabled = true,
}: UseFlowAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Keep latest refs to prevent stale closure inside debounce
  const latestDataRef = useRef(flowData);
  const latestNameRef = useRef(flowName);
  const onSaveRef = useRef(onSave);
  const isInitialMount = useRef(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    latestDataRef.current = flowData;
    latestNameRef.current = flowName;
    onSaveRef.current = onSave;
  }, [flowData, flowName, onSave]);

  const triggerSave = useCallback(async () => {
    if (!enabled || !flowId) return;

    setStatus('saving');
    try {
      const success = await onSaveRef.current(latestDataRef.current, latestNameRef.current);
      if (success) {
        setStatus('saved');
        setIsDirty(false);
        setLastSavedAt(new Date());
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Autosave error:', err);
      setStatus('error');
    }
  }, [enabled, flowId]);

  // Track data / name changes and schedule autosave
  useEffect(() => {
    if (!enabled || !flowId) return;

    // Skip trigger on first render load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

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

  return {
    status,
    lastSavedAt,
    isDirty,
    triggerManualSave: triggerSave,
  };
}
