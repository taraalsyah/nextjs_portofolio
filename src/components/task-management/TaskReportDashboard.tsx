'use client';

import React from 'react';
import { ListTodo, CheckCircle2, Clock, AlertTriangle, Layers, Users, BarChart } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { InlineSpinner } from '@/components/ui/loading';

interface TaskReportData {
  summary: {
    totalTasks: number;
    backlogCount: number;
    openCount: number;
    inProgressCount: number;
    doneCount: number;
    completedThisMonth: number;
    overdueTasks: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byCategory: { id: number; name: string; taskCount: number }[];
  byAssignee: {
    id: number;
    name: string;
    username?: string;
    taskCount: number;
    statusCounts?: {
      backlog: number;
      open: number;
      inProgress: number;
      done: number;
    };
  }[];
}

interface TaskReportDashboardProps {
  data: TaskReportData | null;
  isLoading: boolean;
}

export function TaskReportDashboard({ data, isLoading }: TaskReportDashboardProps) {
  if (isLoading || !data) {
    return (
      <div className={styles.loadingBox}>
        <InlineSpinner size={18} color="var(--primary)" />
        <span>Memuat data laporan statistik...</span>
      </div>
    );
  }

  const { summary, byPriority, byCategory, byAssignee } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Metric Cards Summary Grid */}
      <div className={styles.reportsGrid}>
        <div className={styles.reportCard}>
          <div className={styles.reportIcon}>
            <ListTodo size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue}>{summary.totalTasks}</h3>
            <p className={styles.reportLabel}>Total Seluruh Task</p>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportIcon} style={{ background: 'var(--success-subtle)', color: 'var(--success)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue}>{summary.doneCount}</h3>
            <p className={styles.reportLabel}>Task Selesai (Done)</p>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportIcon} style={{ background: 'var(--warning-subtle)', color: 'var(--warning)' }}>
            <Clock size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue}>{summary.inProgressCount}</h3>
            <p className={styles.reportLabel}>In Progress</p>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportIcon} style={{ background: 'var(--error-subtle)', color: 'var(--error)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue} style={{ color: 'var(--error)' }}>
              {summary.overdueTasks}
            </h3>
            <p className={styles.reportLabel}>Task Melewati Deadline (Overdue)</p>
          </div>
        </div>
      </div>

      {/* Breakdown Section: Priority & Category */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Priority Breakdown */}
        <div className={styles.tableCard}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart size={16} style={{ color: 'var(--primary)' }} />
            Distribusi berdasarkan Prioritas
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: 'Low', count: byPriority.low, color: '#475569' },
              { label: 'Medium', count: byPriority.medium, color: '#2563EB' },
              { label: 'High', count: byPriority.high, color: '#D97706' },
              { label: 'Critical', count: byPriority.critical, color: '#DC2626' },
            ].map((p) => {
              const pct = summary.totalTasks > 0 ? Math.round((p.count / summary.totalTasks) * 100) : 0;
              return (
                <div key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{p.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{p.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: p.color, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className={styles.tableCard}>
          <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} style={{ color: 'var(--primary)' }} />
            Distribusi berdasarkan Kategori
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {byCategory.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: 0 }}>Belum ada kategori.</p>
            ) : (
              byCategory.map((cat) => {
                const pct = summary.totalTasks > 0 ? Math.round((cat.taskCount / summary.totalTasks) * 100) : 0;
                return (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{cat.name}</span>
                      <span style={{ fontWeight: 700, color: 'var(--foreground)' }}>{cat.taskCount} task</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--secondary-text) 0%, var(--primary) 100%)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Assignee Breakdown (Beban Kerja per Pengguna) */}
      <div className={styles.tableCard}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={16} style={{ color: 'var(--primary)' }} />
          Beban Kerja per Pengguna (Assignee)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.85rem' }}>
          {byAssignee.length === 0 ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', margin: 0 }}>Belum ada data beban kerja pengguna.</p>
          ) : (
            byAssignee.map((a) => {
              const sc = a.statusCounts;
              return (
                <div
                  key={a.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>{a.name}</div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', background: 'var(--primary-soft)', padding: '0.15rem 0.5rem', borderRadius: '100px', border: '1px solid var(--primary-border)' }}>
                      {a.taskCount} Task
                    </span>
                  </div>

                  {/* Status Breakdown Badges per User */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.1rem' }}>
                    <span className={`${styles.badge} ${styles.statusBacklog}`}>
                      Backlog: {sc?.backlog ?? 0}
                    </span>
                    <span className={`${styles.badge} ${styles.statusOpen}`}>
                      Open: {sc?.open ?? 0}
                    </span>
                    <span className={`${styles.badge} ${styles.statusInProgress}`}>
                      In Progress: {sc?.inProgress ?? 0}
                    </span>
                    <span className={`${styles.badge} ${styles.statusDone}`}>
                      Done: {sc?.done ?? 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
