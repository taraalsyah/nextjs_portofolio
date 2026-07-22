'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import styles from '../task.module.css';
import { TaskNavTab } from '@/components/task-management/TaskNavTab';
import { TaskReportDashboard } from '@/components/task-management/TaskReportDashboard';

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const role = (session?.user as any)?.role || 'Staff';
  const isAdmin = role === 'Admin';

  useEffect(() => {
    if (status === 'authenticated' && !isAdmin) {
      router.replace('/dashboard/task-management/my-tasks');
    }
  }, [status, isAdmin, router]);

  const fetchReports = async () => {
    if (status !== 'authenticated') return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks/reports');
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [status]);

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
              Laporan & Statistik Task (Reports & Analytics)
              <p>Analisis metrik produktivitas, beban kerja pengguna, dan status penyelesaian task.</p>
            </div>
          </div>
        </div>

        <TaskReportDashboard data={reportData} isLoading={isLoading} />
      </div>
    </div>
  );
}
