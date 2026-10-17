'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { FlowList } from '@/components/task-management/flow/FlowList';
import { FlowDetail } from '@/types/flow';
import { useProjectContext } from '@/context/ProjectContext';
import { useProjectMembers } from '@/hooks/useProjectMembers';
import { useSafeToast } from '@/components/ui/Toast';
import { InlineSpinner } from '@/components/ui/loading';
import taskStyles from '@/app/dashboard/task-management/task.module.css';
import flowStyles from '@/components/task-management/flow/flowComponents.module.css';

// Dynamically import heavy FlowEditor with ssr: false for optimal bundle and hydration safety
const DynamicFlowEditor = dynamic(
  () =>
    import('@/components/task-management/flow/FlowEditor').then(
      (mod) => mod.FlowEditor
    ),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '600px',
          gap: 10,
          color: 'var(--muted-foreground)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
        }}
      >
        <InlineSpinner />
        <span>Memuat editor diagram alur...</span>
      </div>
    ),
  }
);

export default function FlowPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastCtx = useSafeToast();
  const toastCtxRef = useRef(toastCtx);

  useEffect(() => {
    toastCtxRef.current = toastCtx;
  }, [toastCtx]);

  const { activeProject } = useProjectContext();
  const activeProjectId = activeProject?.projectId;
  const currentUserId = parseInt((session?.user as any)?.id || '0', 10);
  const isViewer = activeProject?.memberRole === 'VIEWER';

  const { users } = useProjectMembers();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const [activeFlowId, setActiveFlowId] = useState<number | null>(() => {
    const paramId = searchParams.get('flowId');
    return paramId ? parseInt(paramId, 10) : null;
  });
  const [activeFlowDetail, setActiveFlowDetail] = useState<FlowDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  // Keep track of loaded flow ID to prevent redundant network fetches
  const loadedFlowIdRef = useRef<number | null>(null);

  // Explicit user-driven navigation handlers with smooth URL replace
  const handleOpenFlow = useCallback(
    (id: number) => {
      setActiveFlowId(id);
      router.replace(`/dashboard/task-management/flow?flowId=${id}`, { scroll: false });
    },
    [router]
  );

  const handleBack = useCallback(() => {
    setActiveFlowId(null);
    setActiveFlowDetail(null);
    loadedFlowIdRef.current = null;
    router.replace('/dashboard/task-management/flow', { scroll: false });
  }, [router]);

  // Sync state if URL query param is modified externally (e.g. browser back/forward)
  useEffect(() => {
    const currentParam = searchParams.get('flowId');
    const paramNum = currentParam ? parseInt(currentParam, 10) : null;
    if (paramNum !== activeFlowId) {
      setActiveFlowId(paramNum);
    }
  }, [searchParams, activeFlowId]);

  // Fetch Categories for Task form modal
  useEffect(() => {
    if (!activeProjectId) {
      setCategories([]);
      return;
    }

    fetch(`/api/task-categories?projectId=${activeProjectId}`)
      .then((res) => (res.ok ? res.json() : { categories: [] }))
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories([]));
  }, [activeProjectId]);

  // Fetch flow detail only once per flowId
  const fetchFlowDetail = useCallback(async (id: number) => {
    if (loadedFlowIdRef.current === id) return;

    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/flows/${id}`);
      if (res.ok) {
        const data = await res.json();
        loadedFlowIdRef.current = id;
        setActiveFlowDetail(data.flow);
      } else {
        loadedFlowIdRef.current = null;
        toastCtxRef.current?.showToast('Diagram tidak ditemukan atau telah dihapus.', 'error');
        setActiveFlowId(null);
        setActiveFlowDetail(null);
      }
    } catch (err) {
      console.error('Failed to load flow detail:', err);
      loadedFlowIdRef.current = null;
      toastCtxRef.current?.showToast('Gagal memuat diagram alur.', 'error');
      setActiveFlowId(null);
      setActiveFlowDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    if (activeFlowId) {
      if (loadedFlowIdRef.current !== activeFlowId) {
        fetchFlowDetail(activeFlowId);
      }
    } else {
      setActiveFlowDetail(null);
      loadedFlowIdRef.current = null;
    }
  }, [activeFlowId, fetchFlowDetail]);

  const isEditorActive = Boolean(activeFlowId && activeFlowDetail);

  return (
    <div
      className={isEditorActive ? flowStyles.editorPageWrapper : taskStyles.container}
      style={isEditorActive ? undefined : { maxWidth: '100%' }}
    >
      {/* Tab Navigation Menu */}
      <div style={{ flexShrink: 0 }}>
        <TaskNavTab />
      </div>

      {isEditorActive ? (
        <DynamicFlowEditor
          key={activeFlowDetail!.id}
          initialFlow={activeFlowDetail!}
          onBack={handleBack}
          readOnly={isViewer}
          categories={categories}
          users={users}
          activeProjectId={activeProjectId}
          currentUserId={currentUserId}
        />
      ) : isLoadingDetail ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '400px',
            gap: 10,
            color: 'var(--muted-foreground)',
          }}
        >
          <InlineSpinner />
          <span>Membuka diagram...</span>
        </div>
      ) : (
        <FlowList
          activeProjectId={activeProjectId}
          onOpenFlow={handleOpenFlow}
          readOnly={isViewer}
        />
      )}
    </div>
  );
}
