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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastCtx = useSafeToast();
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

  // Sync URL when activeFlowId changes
  useEffect(() => {
    const currentParam = searchParams.get('flowId');
    const paramNum = currentParam ? parseInt(currentParam, 10) : null;

    if (activeFlowId !== paramNum) {
      if (activeFlowId) {
        router.push(`/dashboard/task-management/flow?flowId=${activeFlowId}`, {
          scroll: false,
        });
      } else {
        router.push('/dashboard/task-management/flow', { scroll: false });
      }
    }
  }, [activeFlowId, router, searchParams]);

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

  // Fetch flow detail when activeFlowId is set
  const fetchFlowDetail = useCallback(async (id: number) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/flows/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveFlowDetail(data.flow);
      } else {
        toastCtx?.showToast('Diagram tidak ditemukan atau telah dihapus.', 'error');
        setActiveFlowId(null);
        setActiveFlowDetail(null);
      }
    } catch (err) {
      console.error('Failed to load flow detail:', err);
      toastCtx?.showToast('Gagal memuat diagram alur.', 'error');
      setActiveFlowId(null);
      setActiveFlowDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [toastCtx]);

  useEffect(() => {
    if (activeFlowId) {
      fetchFlowDetail(activeFlowId);
    } else {
      setActiveFlowDetail(null);
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
          onBack={() => {
            setActiveFlowId(null);
            setActiveFlowDetail(null);
          }}
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
          onOpenFlow={(id) => setActiveFlowId(id)}
          readOnly={isViewer}
        />
      )}
    </div>
  );
}
