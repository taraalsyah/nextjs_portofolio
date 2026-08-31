'use client';

import React from 'react';
import { useDemo } from '@/context/DemoContext';
import { FolderKanban, CheckCircle2, AlertTriangle, ListTodo, TrendingUp } from 'lucide-react';
import styles from './demo.module.css';

export const DemoDashboardView: React.FC = () => {
  const { projects, tasks, activeProjectId } = useDemo();

  const filteredTasks = activeProjectId === 'ALL'
    ? tasks
    : tasks.filter((t) => t.projectId === activeProjectId);

  const totalProjects = projects.length;
  const totalTasks = filteredTasks.length;
  const doneTasks = filteredTasks.filter((t) => t.status === 'DONE').length;
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const openTasks = filteredTasks.filter((t) => t.status === 'OPEN').length;
  const backlogTasks = filteredTasks.filter((t) => t.status === 'BACKLOG').length;

  const now = new Date();
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === 'DONE' || !t.dueDate) return false;
    const due = new Date(`${t.dueDate}T${t.dueTime || '23:59'}`);
    return due < now;
  }).length;

  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Live Statistics Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{totalProjects}</div>
            <div className={styles.statLbl}>Total Projects</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>
            <ListTodo size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{totalTasks}</div>
            <div className={styles.statLbl}>Total Tasks</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{doneTasks}</div>
            <div className={styles.statLbl}>Selesai (Done)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(248, 113, 113, 0.15)', color: '#f87171' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{overdueTasks}</div>
            <div className={styles.statLbl}>Overdue Task</div>
          </div>
        </div>
      </div>

      {/* Progress Bar Section */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <div className={styles.progressTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="#38bdf8" /> Overall Task Progress
          </div>
          <div className={styles.progressPercentage}>{completionPercentage}% Completed</div>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${completionPercentage}%` }}></div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statVal} style={{ fontSize: '1.4rem', color: '#94a3b8' }}>{backlogTasks}</div>
            <div className={styles.statLbl}>Backlog</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statVal} style={{ fontSize: '1.4rem', color: '#38bdf8' }}>{openTasks}</div>
            <div className={styles.statLbl}>Open</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statVal} style={{ fontSize: '1.4rem', color: '#fbbf24' }}>{inProgressTasks}</div>
            <div className={styles.statLbl}>In Progress</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div>
            <div className={styles.statVal} style={{ fontSize: '1.4rem', color: '#34d399' }}>{doneTasks}</div>
            <div className={styles.statLbl}>Done</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoDashboardView;
