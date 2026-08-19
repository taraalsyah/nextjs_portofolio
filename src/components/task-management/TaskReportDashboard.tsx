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
  byAssignee: { id: number; name: string; username?: string; taskCount: number }[];
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
          <div className={styles.reportIcon} style={{ background: 'hsla(145, 80%, 45%, 0.2)', color: 'hsl(145, 80%, 75%)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue}>{summary.doneCount}</h3>
            <p className={styles.reportLabel}>Task Selesai (Done)</p>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportIcon} style={{ background: 'hsla(38, 95%, 55%, 0.2)', color: 'hsl(38, 95%, 75%)' }}>
            <Clock size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue}>{summary.inProgressCount}</h3>
            <p className={styles.reportLabel}>In Progress</p>
          </div>
        </div>

        <div className={styles.reportCard}>
          <div className={styles.reportIcon} style={{ background: 'hsla(350, 90%, 55%, 0.2)', color: 'hsl(350, 95%, 80%)' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className={styles.reportValue} style={{ color: 'hsl(350, 95%, 80%)' }}>
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
            <BarChart size={16} style={{ color: 'var(--secondary)' }} />
            Distribusi berdasarkan Prioritas
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: 'Low', count: byPriority.low, color: 'hsl(210, 80%, 70%)' },
              { label: 'Medium', count: byPriority.medium, color: 'hsl(38, 90%, 70%)' },
              { label: 'High', count: byPriority.high, color: 'hsl(15, 90%, 70%)' },
              { label: 'Critical', count: byPriority.critical, color: 'hsl(350, 90%, 75%)' },
            ].map((p) => {
              const pct = summary.totalTasks > 0 ? Math.round((p.count / summary.totalTasks) * 100) : 0;
              return (
                <div key={p.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span>{p.label}</span>
                    <span style={{ fontWeight: 700 }}>{p.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: '6px', background: 'hsla(0,0%,100%,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
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
            <Layers size={16} style={{ color: 'var(--secondary)' }} />
            Distribusi berdasarkan Kategori
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {byCategory.length === 0 ? (
              <p style={{ fontSize: '0.78rem', color: 'hsla(0,0%,100%,0.4)', margin: 0 }}>Belum ada kategori.</p>
            ) : (
              byCategory.map((cat) => {
                const pct = summary.totalTasks > 0 ? Math.round((cat.taskCount / summary.totalTasks) * 100) : 0;
                return (
                  <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span>{cat.name}</span>
                      <span style={{ fontWeight: 700 }}>{cat.taskCount} task</span>
                    </div>
                    <div style={{ height: '6px', background: 'hsla(0,0%,100%,0.08)', borderRadius: '100px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%)', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Assignee Breakdown */}
      <div className={styles.tableCard}>
        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={16} style={{ color: 'var(--secondary)' }} />
          Beban Kerja per Pengguna (Assignee)
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {byAssignee.map((a) => (
            <div key={a.id} style={{ padding: '0.75rem', borderRadius: '8px', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--fg-color)' }}>{a.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'hsla(0,0%,100%,0.5)', marginTop: '0.15rem' }}>{a.taskCount} Task ter-assign</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
