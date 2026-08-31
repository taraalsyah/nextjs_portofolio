'use client';

import React from 'react';
import { DemoProvider, useDemo } from '@/context/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { DemoDashboardView } from '@/components/demo/DemoDashboardView';
import { FolderKanban, Plus, ListTodo, Layers } from 'lucide-react';
import styles from '@/components/demo/demo.module.css';
import Link from 'next/link';

function OverviewContent() {
  const { projects, tasks } = useDemo();

  return (
    <div>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            Selamat Datang di Demo TaskTuntas 👋
          </h2>
          <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.78rem', fontWeight: 500 }}>
            Lihat ringkasan aktivitas project dan task demo secara real-time.
          </p>
        </div>
        <Link href="/explore-demo/tasks" className={styles.primaryBlueBtn}>
          <ListTodo size={15} /> Ke Task Management
        </Link>
      </div>

      {/* Main Stats Widgets */}
      <DemoDashboardView />

      {/* Recent Projects Overview */}
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FolderKanban size={16} color="#2563eb" /> Overview Project
          </h3>
          <Link href="/explore-demo/tasks" style={{ color: '#2563eb', fontSize: '0.825rem', fontWeight: 600, textDecoration: 'none' }}>
            Kelola Task &amp; Project &rarr;
          </Link>
        </div>

        <div className={styles.statsGrid}>
          {projects.map((proj) => {
            const projTasks = tasks.filter((t) => t.projectId === proj.id);
            const doneTasks = projTasks.filter((t) => t.status === 'DONE').length;
            const progress = projTasks.length > 0 ? Math.round((doneTasks / projTasks.length) * 100) : 0;

            return (
              <div key={proj.id} className={styles.statCard} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                      {proj.projectName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {proj.description || 'Tidak ada deskripsi'}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Progress:</span>
                    <span style={{ color: '#2563eb', fontWeight: 800 }}>{progress}%</span>
                  </div>
                  <div className={styles.progressTrack} style={{ height: 6 }}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#64748b' }}>
                  <span>Total Task: {projTasks.length}</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>Selesai: {doneTasks}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ExploreDemoOverviewPage() {
  return (
    <DemoProvider>
      <DemoLayout pageTitle="Overview">
        <OverviewContent />
      </DemoLayout>
    </DemoProvider>
  );
}
