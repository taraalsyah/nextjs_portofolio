'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Sparkles,
  User,
  ArrowRight,
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
import { FlowAnimation } from '@/components/task-management/flow/FlowAnimation';
import { ListFlowAnimation } from '@/components/task-management/flow/ListFlowAnimation';

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

type TabType = 'ai' | 'timeline' | 'list' | 'flow';

/**
 * Mock AI Conversation View (Pure static HTML/CSS demo - no external API)
 */
const AIMockChat = () => {
  const [step, setStep] = useState<'question' | 'loading' | 'answered'>('question');

  useEffect(() => {
    // Respect prefers-reduced-motion: if active, show final answered state immediately
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep('answered');
      return;
    }

    // Reset step to initial question state whenever component mounts / tab is activated
    setStep('question');

    // Step b: After brief delay (~0.5s), AI loading bubble appears
    const timer1 = setTimeout(() => {
      setStep('loading');
    }, 500);

    // Step c: After ~1.8s (approx 2.3s total), loading transitions to AI answer
    const timer2 = setTimeout(() => {
      setStep('answered');
    }, 2300);

    // Clean up all timers on unmount or tab switch to prevent leaks and double animations
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className={styles.aiChatContainer}>
      {/* Chat Window Header */}
      <div className={styles.aiChatHeader}>
        <div className={styles.aiChatHeaderLeft}>
          <div className={styles.aiBotAvatar}>
            <Sparkles size={16} />
          </div>
          <div>
            <div className={styles.aiBotName}>TaskTuntas AI Assistant</div>
            <div className={styles.aiBotStatus}>
              <span className={styles.aiStatusDot} />
              <span>Siap Membantu • Smart Project Intelligence</span>
            </div>
          </div>
        </div>
        <div className={styles.aiBadge}>AI PREVIEW</div>
      </div>

      {/* Chat Body */}
      <div className={styles.aiChatBody}>
        {/* Step a: User Question Bubble */}
        <div className={styles.aiUserRow}>
          <div className={styles.aiUserBubble}>
            <p className={styles.aiUserText}>
              Ada tugas dengan status urgent tenggat waktu hari ini?
            </p>
            <span className={styles.aiMessageTime}>09:41</span>
          </div>
          <div className={styles.aiUserAvatar} title="User">
            <User size={16} />
          </div>
        </div>

        {/* Step b & c: AI Response Area with accessibility aria-live */}
        <div className={styles.aiBotRow}>
          <div className={styles.aiBotAvatarLarge}>
            <Sparkles size={18} />
          </div>

          <div className={styles.aiBotContent} aria-live="polite">
            {step === 'loading' && (
              <div className={styles.aiLoadingBubble}>
                <span className={styles.srOnly}>AI sedang berpikir...</span>
                <div className={styles.aiLoadingDots} aria-hidden="true">
                  <span className={styles.aiDot} />
                  <span className={styles.aiDot} />
                  <span className={styles.aiDot} />
                </div>
                <span className={styles.aiLoadingText}>AI sedang berpikir...</span>
              </div>
            )}

            {step === 'answered' && (
              <motion.div 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={styles.aiAnswerBubble}
              >
                <p className={styles.aiAnswerIntro}>
                  Ya, ada <strong>2 tugas urgent</strong> dengan tenggat hari ini:
                </p>

                <div className={styles.aiTaskList}>
                  {/* Task 1 */}
                  <div className={styles.aiTaskCard}>
                    <div className={styles.aiTaskTop}>
                      <div className={styles.aiTaskTitleWrapper}>
                        <AlertCircle size={15} className={styles.aiUrgentIcon} />
                        <span className={styles.aiTaskTitle}>Perbaikan bug pembayaran</span>
                      </div>
                      <div className={styles.aiBadgeGroup}>
                        <span className={styles.badgeUrgent}>Urgent</span>
                        <span className={styles.badgeInProgress}>In Progress</span>
                      </div>
                    </div>
                    <div className={styles.aiTaskMeta}>
                      <span className={styles.aiMetaItem}>
                        <User size={13} className={styles.aiMetaIcon} />
                        <span>Penanggung jawab: <strong>Rina</strong></span>
                      </span>
                      <span className={styles.aiMetaDivider}>•</span>
                      <span className={styles.aiMetaItem}>
                        <Clock size={13} className={styles.aiMetaIcon} />
                        <span>Tenggat: <strong className={styles.aiUrgentTime}>17:00</strong> (Hari ini)</span>
                      </span>
                    </div>
                  </div>

                  {/* Task 2 */}
                  <div className={styles.aiTaskCard}>
                    <div className={styles.aiTaskTop}>
                      <div className={styles.aiTaskTitleWrapper}>
                        <AlertCircle size={15} className={styles.aiUrgentIcon} />
                        <span className={styles.aiTaskTitle}>Review desain halaman login</span>
                      </div>
                      <div className={styles.aiBadgeGroup}>
                        <span className={styles.badgeUrgent}>Urgent</span>
                        <span className={styles.badgeToDo}>To Do</span>
                      </div>
                    </div>
                    <div className={styles.aiTaskMeta}>
                      <span className={styles.aiMetaItem}>
                        <User size={13} className={styles.aiMetaIcon} />
                        <span>Penanggung jawab: <strong>Dimas</strong></span>
                      </span>
                      <span className={styles.aiMetaDivider}>•</span>
                      <span className={styles.aiMetaItem}>
                        <Clock size={13} className={styles.aiMetaIcon} />
                        <span>Tenggat: <strong className={styles.aiUrgentTime}>15:00</strong> (Hari ini)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPreviewContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>('ai');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const flowIdParam = searchParams.get('flowId');
    if (flowIdParam || tabParam === 'flow') {
      setActiveTab('flow');
    } else if (tabParam === 'timeline' || tabParam === 'list' || tabParam === 'ai') {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'flow') {
      params.set('tab', 'flow');
      params.delete('flowId');
      params.delete('mode');
      const newQuery = params.toString();
      router.replace(newQuery ? `/?${newQuery}` : '/?tab=flow', { scroll: false });
    } else if (tab === 'timeline') {
      params.set('tab', 'timeline');
      params.delete('flowId');
      params.delete('mode');
      const newQuery = params.toString();
      router.replace(newQuery ? `/?${newQuery}` : '/?tab=timeline', { scroll: false });
    } else if (tab === 'list') {
      params.set('tab', 'list');
      params.delete('flowId');
      params.delete('mode');
      const newQuery = params.toString();
      router.replace(newQuery ? `/?${newQuery}` : '/?tab=list', { scroll: false });
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
            Switch effortlessly between interactive AI intelligence, Timeline Gantt charts, detailed task lists, and visual workflow diagrams.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabControls} role="tablist" aria-label="Product Features Preview">
          <button 
            id="tab-ai"
            role="tab"
            aria-selected={activeTab === 'ai'}
            aria-controls="panel-ai"
            className={`${styles.tabBtn} ${activeTab === 'ai' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('ai')}
          >
            <Sparkles size={16} /> AI
          </button>
          <button 
            id="tab-timeline"
            role="tab"
            aria-selected={activeTab === 'timeline'}
            aria-controls="panel-timeline"
            className={`${styles.tabBtn} ${activeTab === 'timeline' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('timeline')}
          >
            <GanttChart size={16} /> Timeline
          </button>
          <button 
            id="tab-list"
            role="tab"
            aria-selected={activeTab === 'list'}
            aria-controls="panel-list"
            className={`${styles.tabBtn} ${activeTab === 'list' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('list')}
          >
            <ListTodo size={16} /> Design
          </button>
          <button 
            id="tab-flow"
            role="tab"
            aria-selected={activeTab === 'flow'}
            aria-controls="panel-list"
            className={`${styles.tabBtn} ${activeTab === 'flow' ? styles.tabBtnActive : ''}`}
            onClick={() => handleTabClick('flow')}
          >
            <Workflow size={16} /> Flow
          </button>
        </div>

        {/* Interactive View Mockup Container */}
        <motion.div 
          id={activeTab === 'flow' ? 'panel-list' : `panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`${styles.previewFrame} ${activeTab === 'flow' ? styles.flowPreviewFrame : ''}`}
        >
          {activeTab === 'ai' && <AIMockChat />}
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

          {activeTab === 'list' && <ListFlowAnimation />}

          {activeTab === 'flow' && <FlowAnimation />}
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
