'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  GanttChart, 
  ListTodo, 
  Workflow, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreHorizontal,
  Folder,
  FolderPlus,
  Layers,
  Crosshair,
  CalendarDays,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import styles from './landing.module.css';

// 20 workdays for timeline mockup (4 weeks, Mon-Fri)
const TIMELINE_DAYS = [
  { dayName: 'Sen', dayNum: 17, isToday: false },
  { dayName: 'Sel', dayNum: 18, isToday: false },
  { dayName: 'Rab', dayNum: 19, isToday: false },
  { dayName: 'Kam', dayNum: 20, isToday: false },
  { dayName: 'Jum', dayNum: 21, isToday: false },
  { dayName: 'Sen', dayNum: 24, isToday: false },
  { dayName: 'Sel', dayNum: 25, isToday: false },
  { dayName: 'Rab', dayNum: 26, isToday: false },
  { dayName: 'Kam', dayNum: 27, isToday: false },
  { dayName: 'Jum', dayNum: 28, isToday: false },
  { dayName: 'Sen', dayNum: 31, isToday: false },
  { dayName: 'Sel', dayNum: 1, isToday: true }, // Today indicator
  { dayName: 'Rab', dayNum: 2, isToday: false },
  { dayName: 'Kam', dayNum: 3, isToday: false },
  { dayName: 'Jum', dayNum: 4, isToday: false },
  { dayName: 'Sen', dayNum: 7, isToday: false },
  { dayName: 'Sel', dayNum: 8, isToday: false },
  { dayName: 'Rab', dayNum: 9, isToday: false },
  { dayName: 'Kam', dayNum: 10, isToday: false },
  { dayName: 'Jum', dayNum: 11, isToday: false },
];

const LandingPreviewContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'timeline' | 'list' | 'flow'>('timeline');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const flowIdParam = searchParams.get('flowId');
    if (flowIdParam || tabParam === 'flow') {
      setActiveTab('flow');
    } else if (tabParam === 'timeline' || tabParam === 'list') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabClick = (tab: 'timeline' | 'list' | 'flow') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'flow') {
      params.set('tab', 'flow');
      const newQuery = params.toString();
      router.replace(newQuery ? `/?${newQuery}` : '/?tab=flow', { scroll: false });
    } else {
      params.delete('tab');
      params.delete('flowId');
      params.delete('mode');
      const newQuery = params.toString();
      router.replace(newQuery ? `/?${newQuery}` : '/', { scroll: false });
    }
  };

  return (
    <section id="preview" className={styles.previewSection}>
      <div className="section-container">
        <div className={styles.sectionHeader}>
          <div className={styles.pillBadge}>PRODUCT PREVIEW</div>
          <h2 className={styles.sectionTitle}>
            See your projects <span className="text-gradient">clearly</span>
          </h2>
          <p className={styles.sectionSubtitle}>
            Switch effortlessly between interactive Timeline Gantt charts, detailed task lists, and visual workflow diagrams.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabControls}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'timeline' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('timeline')}
          >
            <GanttChart size={16} /> Timeline
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'list' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('list')}
          >
            <ListTodo size={16} /> Task List View
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'flow' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('flow')}
          >
            <Workflow size={16} /> Flow
          </button>
        </div>

        {/* Interactive View Mockup Container */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${styles.previewFrame} ${activeTab === 'flow' ? styles.flowPreviewFrame : ''}`}
        >
          {activeTab === 'timeline' && (
            <div className={styles.timelinePreviewWrapper}>
              {/* Timeline Toolbar & Filter Controls */}
              <div className={styles.timelinePreviewToolbar}>
                <div className={styles.timelineToolbarLeft}>
                  <span className={styles.timelineFilterLabel}>Project / Fitur:</span>
                  <div className={styles.timelineSelectBadge}>
                    <Folder size={14} style={{ color: '#8b5cf6' }} />
                    <span>Web Platform 2.0 (Phase & Task)</span>
                    <ChevronDown size={14} style={{ color: 'var(--secondary-text)' }} />
                  </div>
                  <div className={styles.timelineActionBtn} title="Buat Proyek / Fitur Baru">
                    <FolderPlus size={14} style={{ color: 'var(--primary)' }} />
                    <span>+ Proyek/Fitur</span>
                  </div>
                  <div className={styles.timelineActionBtn} title="Tambah Phase">
                    <Layers size={14} style={{ color: '#38bdf8' }} />
                    <span>+ Phase</span>
                  </div>
                  <div className={styles.timelineActionBtn} title="Geser ke Hari Ini">
                    <Crosshair size={14} />
                    <span>Hari Ini</span>
                  </div>
                </div>

                <div className={styles.timelineToolbarRight}>
                  <div className={styles.timelineDaysBadge}>
                    <CalendarDays size={14} />
                    <span>Rentang: <strong style={{ color: 'var(--foreground)' }}>20 hari kerja</strong> (Senin – Jumat)</span>
                  </div>

                  <div className={styles.timelineLegend}>
                    <div className={styles.timelineLegendItem}>
                      <span className={styles.timelineLegendDot} style={{ background: '#64748b' }} />
                      <span>To Do</span>
                    </div>
                    <div className={styles.timelineLegendItem}>
                      <span className={styles.timelineLegendDot} style={{ background: '#3b82f6' }} />
                      <span>In Progress</span>
                    </div>
                    <div className={styles.timelineLegendItem}>
                      <span className={styles.timelineLegendDot} style={{ background: '#10b981' }} />
                      <span>Done</span>
                    </div>
                    <div className={styles.timelineLegendItem}>
                      <span className={styles.timelineLegendDot} style={{ background: '#ef4444' }} />
                      <span>Terlambat</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gantt Viewport Container */}
              <div className={styles.timelineGanttFrame}>
                {/* Left Sidebar: Project, Phase, and Task Hierarchy */}
                <div className={styles.timelineSidebar}>
                  <div className={styles.timelineSidebarHeader}>
                    <span>Daftar Proyek & Phase</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--secondary-text)', fontWeight: 500 }}>Status</span>
                  </div>

                  {/* Project Row */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelineProjectRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <Folder size={15} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>Web Platform 2.0</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '100px', background: 'rgba(139, 92, 246, 0.15)', color: '#7c3aed', fontWeight: 600 }}>
                      3/5 Selesai (60%)
                    </span>
                  </div>

                  {/* Phase 1 Row */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelinePhaseRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <ChevronDown size={13} style={{ color: '#6366f1' }} />
                      <Layers size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>Phase 1: Architecture & Security</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem', borderRadius: '100px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', fontWeight: 600 }}>
                      2/2 Selesai
                    </span>
                  </div>

                  {/* Task 101 */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelineTaskRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>TASK-101 • NextAuth & Email OTP</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                      Done
                    </span>
                  </div>

                  {/* Task 102 */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelineTaskRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>TASK-102 • Prisma Migration & RBAC</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#dcfce7', color: '#15803d', fontWeight: 600 }}>
                      Done
                    </span>
                  </div>

                  {/* Phase 2 Row */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelinePhaseRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <ChevronDown size={13} style={{ color: '#6366f1' }} />
                      <Layers size={14} style={{ color: '#6366f1', flexShrink: 0 }} />
                      <span style={{ fontWeight: 600 }}>Phase 2: Core Task Management</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem', borderRadius: '100px', background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', fontWeight: 600 }}>
                      1/3 Selesai
                    </span>
                  </div>

                  {/* Task 103 */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelineTaskRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <Clock size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                      <span>TASK-103 • Timeline Gantt Chart</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                      In Progress
                    </span>
                  </div>

                  {/* Task 104 */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelineTaskRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <Clock size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
                      <span>TASK-104 • Request-to-Done Flow</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                      In Progress
                    </span>
                  </div>

                  {/* Task 105 */}
                  <div className={`${styles.timelineSidebarRow} ${styles.timelineTaskRow}`}>
                    <div className={styles.timelineSidebarRowLeft}>
                      <AlertCircle size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      <span>TASK-105 • Capacitor Safe Areas</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: '#f1f5f9', color: '#64748b', fontWeight: 600 }}>
                      To Do
                    </span>
                  </div>
                </div>

                {/* Right Scrollable Chart Area */}
                <div className={styles.timelineChartArea}>
                  {/* Today Guide Line */}
                  <div className={styles.timelineTodayLine} style={{ left: `${11 * 44 + 22}px` }} />

                  {/* Header Row: Workday Dates */}
                  <div className={styles.timelineDateHeader}>
                    {TIMELINE_DAYS.map((d, idx) => (
                      <div 
                        key={idx} 
                        className={d.isToday ? styles.timelineDateColToday : styles.timelineDateCol}
                      >
                        <span className={styles.timelineDateColDay}>{d.dayName}</span>
                        <span className={styles.timelineDateColNum}>{d.dayNum}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid Rows with Gantt Bars */}
                  {/* Row 1: Project Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: '4px',
                        width: `${18 * 44 - 8}px`,
                        background: 'rgba(139, 92, 246, 0.22)',
                        border: '1px solid rgba(139, 92, 246, 0.45)',
                        color: 'var(--foreground)',
                      }}
                    >
                      <Folder size={12} style={{ color: '#8b5cf6', marginRight: '6px' }} />
                      <span>Web Platform 2.0 • 60% Selesai (18 hari kerja)</span>
                    </div>
                  </div>

                  {/* Row 2: Phase 1 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: '4px',
                        width: `${8 * 44 - 8}px`,
                        background: 'rgba(99, 102, 241, 0.22)',
                        border: '1px solid rgba(99, 102, 241, 0.45)',
                        color: 'var(--foreground)',
                      }}
                    >
                      <Layers size={12} style={{ color: '#6366f1', marginRight: '6px' }} />
                      <span>Phase 1: Architecture • 100% Selesai</span>
                    </div>
                  </div>

                  {/* Row 3: Task 101 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: '4px',
                        width: `${5 * 44 - 8}px`,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: '1px solid #047857',
                        color: '#FFFFFF',
                      }}
                    >
                      <CheckCircle2 size={12} style={{ marginRight: '5px' }} />
                      <span>TASK-101 • NextAuth & Email OTP</span>
                    </div>
                  </div>

                  {/* Row 4: Task 102 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: `${3 * 44 + 4}px`,
                        width: `${6 * 44 - 8}px`,
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        border: '1px solid #047857',
                        color: '#FFFFFF',
                      }}
                    >
                      <CheckCircle2 size={12} style={{ marginRight: '5px' }} />
                      <span>TASK-102 • Prisma Migration & RBAC</span>
                    </div>
                  </div>

                  {/* Row 5: Phase 2 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: `${7 * 44 + 4}px`,
                        width: `${12 * 44 - 8}px`,
                        background: 'rgba(99, 102, 241, 0.22)',
                        border: '1px solid rgba(99, 102, 241, 0.45)',
                        color: 'var(--foreground)',
                      }}
                    >
                      <Layers size={12} style={{ color: '#6366f1', marginRight: '6px' }} />
                      <span>Phase 2: Core Task Management • 33% Selesai</span>
                    </div>
                  </div>

                  {/* Row 6: Task 103 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: `${7 * 44 + 4}px`,
                        width: `${8 * 44 - 8}px`,
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: '1px solid #1d4ed8',
                        color: '#FFFFFF',
                      }}
                    >
                      <Clock size={12} style={{ marginRight: '5px' }} />
                      <span>TASK-103 • Interactive Timeline Gantt Chart</span>
                    </div>
                  </div>

                  {/* Row 7: Task 104 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: `${10 * 44 + 4}px`,
                        width: `${7 * 44 - 8}px`,
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: '1px solid #1d4ed8',
                        color: '#FFFFFF',
                      }}
                    >
                      <Clock size={12} style={{ marginRight: '5px' }} />
                      <span>TASK-104 • Request-to-Done Flow</span>
                    </div>
                  </div>

                  {/* Row 8: Task 105 Bar */}
                  <div className={styles.timelineGridRow}>
                    {TIMELINE_DAYS.map((_, idx) => (
                      <div key={idx} className={styles.timelineGridCell} />
                    ))}
                    <div 
                      className={styles.timelineBar}
                      style={{
                        left: `${15 * 44 + 4}px`,
                        width: `${5 * 44 - 8}px`,
                        background: 'linear-gradient(135deg, #64748b, #475569)',
                        border: '1px solid #334155',
                        color: '#FFFFFF',
                      }}
                    >
                      <AlertCircle size={12} style={{ marginRight: '5px' }} />
                      <span>TASK-105 • Capacitor Mobile Safe Area</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <div style={{ width: '100%', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Task Title</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Priority</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Assignee</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Design landing page UI layout</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#EFF6FF', color: '#1D4ED8', fontSize: '0.75rem', fontWeight: 600 }}>
                        In Progress
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#DC2626', fontWeight: 600 }}>High</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Lead Developer</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary-text)' }}>Aug 29, 2026</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Request-to-Close validation logic</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#FEF3C7', color: '#B45309', fontSize: '0.75rem', fontWeight: 600 }}>
                        Review Pending
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#D97706', fontWeight: 600 }}>Medium</td>
                    <td style={{ padding: '0.85rem 1rem' }}>System Admin</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary-text)' }}>Aug 30, 2026</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Prisma transaction safety audit</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#DCFCE7', color: '#15803D', fontSize: '0.75rem', fontWeight: 600 }}>
                        Done
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#2563EB', fontWeight: 600 }}>Medium</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Backend Lead</td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--secondary-text)' }}>Aug 27, 2026</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'flow' && (
            <div className={styles.flowImageContainer}>
              <div className={styles.flowImageWrapper}>
                <Image
                  src="/flow_preview_light.png"
                  alt="TaskTuntas Flow & Workflow Editor Preview"
                  width={1920}
                  height={1080}
                  className={styles.flowPreviewImage}
                  priority
                />
              </div>

              <div className={styles.flowImageFooter}>
                <div className={styles.flowImageCaption}>
                  <span className={styles.flowLiveDot} />
                  <span>Interactive Flow Editor — Visual workflow diagrams, smart snapping, and approval workflow gates.</span>
                </div>
                <Link href="/dashboard/task-management/flow?flowId=1&mode=edit" className={styles.flowOpenBtn}>
                  <span>Buka di Task Management</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

const LandingPreview = () => {
  return (
    <Suspense fallback={<section id="preview" className={styles.previewSection} />}>
      <LandingPreviewContent />
    </Suspense>
  );
};

export default LandingPreview;
