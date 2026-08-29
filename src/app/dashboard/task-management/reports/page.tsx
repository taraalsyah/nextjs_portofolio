'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskReportDashboard } from '@/components/task-management/TaskReportDashboard';
import { DownloadReportButton } from '@/components/task-management/DownloadReportButton';
import { useProjectContext, ACTIVE_PROJECT_CHANGED_EVENT } from '@/context/ProjectContext';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeProject } = useProjectContext();
  const activeProjectId = activeProject?.projectId;

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';

  // Ref to track latest active project ID for race condition prevention
  const activeProjectRef = useRef<number | undefined>(activeProjectId);

  useEffect(() => {
    activeProjectRef.current = activeProjectId;
  }, [activeProjectId]);

  // Clear state when active project changes
  useEffect(() => {
    setReportData(null);
    setIsLoading(true);
  }, [activeProjectId]);

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard/task-management/my-tasks');
    }
  }, [status, isAdmin, router]);

  const fetchReports = useCallback(async () => {
    if (status !== 'authenticated') return;
    const targetProjectId = activeProjectId;

    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks/reports');
      if (activeProjectRef.current !== targetProjectId) return;

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        setReportData(null);
      }
    } catch {
      if (activeProjectRef.current === targetProjectId) {
        setReportData(null);
      }
    } finally {
      if (activeProjectRef.current === targetProjectId) {
        setIsLoading(false);
      }
    }
  }, [status, activeProjectId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const handleProjectChanged = () => {
      setReportData(null);
      fetchReports();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      return () => {
        window.removeEventListener(ACTIVE_PROJECT_CHANGED_EVENT, handleProjectChanged);
      };
    }
  }, [fetchReports]);

  return (
    <div className={styles.container}>
      <TaskNavTab />

      <div className={styles.tableCard}>
        <div className={styles.headerSection}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIcon}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.headerTitle}>
              Laporan & Statistik Task
              <p>Analisis metrik produktivitas, beban kerja pengguna, dan status penyelesaian task.</p>
            </div>
          </div>
          <DownloadReportButton />
        </div>

        <TaskReportDashboard data={reportData} isLoading={isLoading} />
      </div>
    </div>
  );
}
