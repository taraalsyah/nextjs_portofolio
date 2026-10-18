'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Calendar,
  AlertCircle,
  Flame,
  CheckCircle2,
  Clock,
  User,
  Folder,
  FolderPlus,
  Layers,
  Plus,
  Crosshair,
  Info,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
} from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

export interface TaskPhaseItem {
  id: number;
  name: string;
  order: number;
  taskProjectId: number;
  _count?: { tasks: number };
}

export interface TaskProjectItem {
  id: number;
  name: string;
  description?: string | null;
  phases?: TaskPhaseItem[];
  _count?: { tasks: number; phases?: number };
}

export interface TaskItem {
  id: number;
  taskNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId?: number | null;
  assignee?: { id: number; name: string; email?: string } | null;
  startDate?: string | null;
  dueDate?: string | null;
  taskProjectId?: number | null;
  taskProject?: { id: number; name: string } | null;
  phaseId?: number | null;
  phase?: string | null;
  phaseRel?: { id: number; name: string; order: number } | null;
  category?: { id: number; name: string } | null;
}

interface TaskTimelineViewProps {
  tasks: TaskItem[];
  taskProjects: TaskProjectItem[];
  selectedProjectId: string; // 'all' or string(id)
  onSelectProject: (projectId: string) => void;
  onTaskClick: (task: TaskItem) => void;
  onCreateTask: () => void;
  onCreateTaskInPhase?: (taskProjectId: number, phaseName: string, phaseId?: number | null) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: TaskProjectItem) => void;
  onDeleteProject?: (project: TaskProjectItem) => void;
  onCreatePhase?: (taskProjectId: number) => void;
  onEditPhase?: (phase: TaskPhaseItem) => void;
  onDeletePhase?: (phase: TaskPhaseItem) => void;
  onMovePhase?: (phaseId: number, direction: 'up' | 'down') => Promise<void>;
}

interface WorkdayColumn {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNum: number;
  dayName: string; // Sen, Sel, Rab, Kam, Jum
  monthName: string; // Jan, Feb, ...
  isToday: boolean;
}

const INDONESIAN_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const INDONESIAN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
];

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d);
  res.setDate(res.getDate() + days);
  return res;
}

function countWorkdays(start: Date, end: Date): number {
  let count = 0;
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const finish = new Date(end);
  finish.setHours(0, 0, 0, 0);

  if (cur > finish) return 0;

  while (cur <= finish) {
    if (!isWeekend(cur)) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return Math.max(1, count);
}

export function TaskTimelineView({
  tasks,
  taskProjects,
  selectedProjectId,
  onSelectProject,
  onTaskClick,
  onCreateTask,
  onCreateTaskInPhase,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCreatePhase,
  onEditPhase,
  onDeletePhase,
  onMovePhase,
}: TaskTimelineViewProps) {
  const chartScrollRef = useRef<HTMLDivElement | null>(null);
  const todayRef = useRef<HTMLDivElement | null>(null);

  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    x: number;
    y: number;
    title: string;
    taskNumber: string;
    status: string;
    statusLabel: string;
    statusColor: string;
    priority: string;
    assigneeName: string;
    startDateFormatted: string;
    dueDateFormatted: string;
    durationDays: number;
    phase: string;
    projectName: string;
  } | null>(null);

  const [showUnscheduled, setShowUnscheduled] = useState(false);
  const [movingPhaseId, setMovingPhaseId] = useState<number | null>(null);

  // Selected project object if in per-project mode
  const currentProject = useMemo(() => {
    if (selectedProjectId === 'all') return null;
    const targetId = parseInt(selectedProjectId, 10);
    return taskProjects.find((tp) => tp.id === targetId) || null;
  }, [taskProjects, selectedProjectId]);

  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (selectedProjectId === 'all') {
      return tasks;
    }
    const targetId = parseInt(selectedProjectId, 10);
    return tasks.filter((t) => t.taskProjectId === targetId);
  }, [tasks, selectedProjectId]);

  // Tasks with valid dates vs tasks without dates
  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    const scheduled: TaskItem[] = [];
    const unscheduled: TaskItem[] = [];

    filteredTasks.forEach((t) => {
      if (t.startDate && t.dueDate) {
        scheduled.push(t);
      } else {
        unscheduled.push(t);
      }
    });

    return { scheduledTasks: scheduled, unscheduledTasks: unscheduled };
  }, [filteredTasks]);

  // Compute overall workday range (Senin - Jumat)
  const { workdays, minDate, maxDate } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let earliest = addDays(now, -7);
    let latest = addDays(now, 21);

    scheduledTasks.forEach((t) => {
      if (t.startDate) {
        const s = new Date(t.startDate);
        s.setHours(0, 0, 0, 0);
        if (s < earliest) earliest = addDays(s, -5);
      }
      if (t.dueDate) {
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        if (d > latest) latest = addDays(d, 7);
      }
    });

    // Ensure we start on Monday and end on Friday
    while (earliest.getDay() !== 1) {
      earliest = addDays(earliest, -1);
    }
    while (latest.getDay() !== 5) {
      latest = addDays(latest, 1);
    }

    const list: WorkdayColumn[] = [];
    const todayYMD = formatDateToYMD(now);
    let cur = new Date(earliest);

    while (cur <= latest) {
      if (!isWeekend(cur)) {
        const dateStr = formatDateToYMD(cur);
        list.push({
          date: new Date(cur),
          dateStr,
          dayNum: cur.getDate(),
          dayName: INDONESIAN_DAYS[cur.getDay()],
          monthName: INDONESIAN_MONTHS[cur.getMonth()],
          isToday: dateStr === todayYMD,
        });
      }
      cur = addDays(cur, 1);
    }

    return {
      workdays: list,
      minDate: earliest,
      maxDate: latest,
    };
  }, [scheduledTasks]);

  // Map of date string to workday index (0-indexed)
  const workdayIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    workdays.forEach((col, idx) => {
      map.set(col.dateStr, idx);
    });
    return map;
  }, [workdays]);

  // Helper to find column index for a given Date
  const getColIndexForDate = (date: Date): number => {
    const targetYMD = formatDateToYMD(date);
    if (workdayIndexMap.has(targetYMD)) {
      return workdayIndexMap.get(targetYMD)!;
    }

    if (date < minDate) return 0;
    if (date > maxDate) return Math.max(0, workdays.length - 1);

    const d = new Date(date);
    if (d.getDay() === 6) {
      d.setDate(d.getDate() - 1);
    } else if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    }
    const adjustedYMD = formatDateToYMD(d);
    return workdayIndexMap.get(adjustedYMD) ?? 0;
  };

  // Helper to compute task bar placement on grid
  const getTaskGridPlacement = (startDateStr: string, dueDateStr: string) => {
    const sDate = new Date(startDateStr);
    const dDate = new Date(dueDateStr);
    const startIdx = getColIndexForDate(sDate);
    const endIdx = getColIndexForDate(dDate);

    const safeStart = Math.min(startIdx, endIdx);
    const safeEnd = Math.max(startIdx, endIdx);
    const span = Math.max(1, safeEnd - safeStart + 1);

    return {
      startCol: safeStart + 1,
      spanCol: span,
      durationDays: countWorkdays(sDate, dDate),
    };
  };

  // Status and Overdue resolution
  const getTaskStatusInfo = (task: TaskItem) => {
    const isDone = task.status === 'DONE' || task.status === 'CLOSED';
    const isOverdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date();

    if (isOverdue) {
      return {
        label: 'Terlambat',
        color: '#ef4444',
        bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
        border: '#b91c1c',
      };
    }
    if (isDone) {
      return {
        label: 'Done',
        color: '#10b981',
        bg: 'linear-gradient(135deg, #10b981, #059669)',
        border: '#047857',
      };
    }
    if (task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW') {
      return {
        label: task.status === 'IN_REVIEW' ? 'In Review' : 'In Progress',
        color: '#3b82f6',
        bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        border: '#1d4ed8',
      };
    }
    return {
      label: 'To Do',
      color: '#94a3b8',
      bg: 'linear-gradient(135deg, #64748b, #475569)',
      border: '#334155',
    };
  };

  // Priority border accent
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { borderLeft: '4px solid #ef4444', icon: AlertCircle };
      case 'HIGH':
        return { borderLeft: '4px solid #f97316', icon: Flame };
      case 'MEDIUM':
        return { borderLeft: '4px solid #f59e0b', icon: Clock };
      default:
        return { borderLeft: '4px solid #94a3b8', icon: null };
    }
  };

  // Scroll to today on mount or project switch
  const scrollToToday = () => {
    if (todayRef.current && chartScrollRef.current) {
      const container = chartScrollRef.current;
      const todayElem = todayRef.current;
      const offset = todayElem.offsetLeft - container.clientWidth / 2 + 100;
      container.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToToday();
    }, 200);
    return () => clearTimeout(timer);
  }, [selectedProjectId, workdays]);

  // Grouping for Mode per-proyek: Includes registered Phase entities AND unassigned "Tanpa Phase"
  const phaseGroups = useMemo(() => {
    if (selectedProjectId === 'all' || !currentProject) return [];

    const projectPhaseEntities = (currentProject.phases || []).slice().sort((a, b) => a.order - b.order);

    // Map tasks by phaseId or phase name
    const phaseMap = new Map<string, TaskItem[]>();
    // Pre-populate registered phase entities
    projectPhaseEntities.forEach((pe) => {
      phaseMap.set(`id_${pe.id}`, []);
    });
    // Add default Tanpa Phase
    phaseMap.set('unassigned', []);

    filteredTasks.forEach((t) => {
      if (t.phaseId && phaseMap.has(`id_${t.phaseId}`)) {
        phaseMap.get(`id_${t.phaseId}`)!.push(t);
      } else if (t.phase && t.phase.trim() && t.phase !== 'Tanpa Phase') {
        const found = projectPhaseEntities.find((pe) => pe.name.toLowerCase() === t.phase!.trim().toLowerCase());
        if (found && phaseMap.has(`id_${found.id}`)) {
          phaseMap.get(`id_${found.id}`)!.push(t);
        } else {
          // If task has string phase not in entities yet
          const key = `name_${t.phase.trim()}`;
          if (!phaseMap.has(key)) phaseMap.set(key, []);
          phaseMap.get(key)!.push(t);
        }
      } else {
        phaseMap.get('unassigned')!.push(t);
      }
    });

    const groups: {
      key: string;
      phaseId: number | null;
      phaseName: string;
      order: number;
      isEntity: boolean;
      entity?: TaskPhaseItem;
      tasks: TaskItem[];
      scheduledTasks: TaskItem[];
      doneCount: number;
      totalCount: number;
      earliestStart: string | null;
      latestDue: string | null;
    }[] = [];

    // Add registered phase entities
    projectPhaseEntities.forEach((pe) => {
      const pTasks = phaseMap.get(`id_${pe.id}`) || [];
      const pScheduled = pTasks.filter((t) => t.startDate && t.dueDate);
      const doneCount = pTasks.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;

      let earliest: Date | null = null;
      let latest: Date | null = null;
      pScheduled.forEach((t) => {
        const s = new Date(t.startDate!);
        const d = new Date(t.dueDate!);
        if (!earliest || s < earliest) earliest = s;
        if (!latest || d > latest) latest = d;
      });

      groups.push({
        key: `id_${pe.id}`,
        phaseId: pe.id,
        phaseName: pe.name,
        order: pe.order,
        isEntity: true,
        entity: pe,
        tasks: pTasks,
        scheduledTasks: pScheduled,
        doneCount,
        totalCount: pTasks.length,
        earliestStart: earliest ? (earliest as Date).toISOString() : null,
        latestDue: latest ? (latest as Date).toISOString() : null,
      });
    });

    // Add other string-based phases if any
    Array.from(phaseMap.keys()).forEach((k) => {
      if (k.startsWith('name_')) {
        const pTasks = phaseMap.get(k) || [];
        const pScheduled = pTasks.filter((t) => t.startDate && t.dueDate);
        const doneCount = pTasks.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;
        const pName = k.replace('name_', '');

        let earliest: Date | null = null;
        let latest: Date | null = null;
        pScheduled.forEach((t) => {
          const s = new Date(t.startDate!);
          const d = new Date(t.dueDate!);
          if (!earliest || s < earliest) earliest = s;
          if (!latest || d > latest) latest = d;
        });

        groups.push({
          key: k,
          phaseId: null,
          phaseName: pName,
          order: 999,
          isEntity: false,
          tasks: pTasks,
          scheduledTasks: pScheduled,
          doneCount,
          totalCount: pTasks.length,
          earliestStart: earliest ? (earliest as Date).toISOString() : null,
          latestDue: latest ? (latest as Date).toISOString() : null,
        });
      }
    });

    // Always append "Tanpa Phase" at the bottom
    const unassignedTasks = phaseMap.get('unassigned') || [];
    const uScheduled = unassignedTasks.filter((t) => t.startDate && t.dueDate);
    const uDoneCount = unassignedTasks.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;

    let uEarliest: Date | null = null;
    let uLatest: Date | null = null;
    uScheduled.forEach((t) => {
      const s = new Date(t.startDate!);
      const d = new Date(t.dueDate!);
      if (!uEarliest || s < uEarliest) uEarliest = s;
      if (!uLatest || d > uLatest) uLatest = d;
    });

    groups.push({
      key: 'unassigned',
      phaseId: null,
      phaseName: 'Tanpa Phase',
      order: 9999,
      isEntity: false,
      tasks: unassignedTasks,
      scheduledTasks: uScheduled,
      doneCount: uDoneCount,
      totalCount: unassignedTasks.length,
      earliestStart: uEarliest ? (uEarliest as Date).toISOString() : null,
      latestDue: uLatest ? (uLatest as Date).toISOString() : null,
    });

    return groups;
  }, [filteredTasks, selectedProjectId, currentProject]);

  // Grouping for Mode "Semua Proyek": 1 bar per project
  const projectSummaries = useMemo(() => {
    if (selectedProjectId !== 'all') return [];

    return taskProjects.map((tp) => {
      const projTasks = tasks.filter((t) => t.taskProjectId === tp.id);
      const projScheduled = projTasks.filter((t) => t.startDate && t.dueDate);
      const doneCount = projTasks.filter((t) => t.status === 'DONE' || t.status === 'CLOSED').length;

      let earliest: Date | null = null;
      let latest: Date | null = null;

      projScheduled.forEach((t) => {
        const s = new Date(t.startDate!);
        const d = new Date(t.dueDate!);
        if (!earliest || s < earliest) earliest = s;
        if (!latest || d > latest) latest = d;
      });

      return {
        id: tp.id,
        name: tp.name,
        description: tp.description,
        totalTasks: projTasks.length,
        doneTasks: doneCount,
        scheduledCount: projScheduled.length,
        earliestStart: earliest ? (earliest as Date).toISOString() : null,
        latestDue: latest ? (latest as Date).toISOString() : null,
        rawProject: tp,
      };
    });
  }, [tasks, taskProjects, selectedProjectId]);

  const colWidth = 42;
  const totalGridWidth = workdays.length * colWidth;

  const handleBarMouseEnter = (
    e: React.MouseEvent,
    task: TaskItem,
    statusInfo: ReturnType<typeof getTaskStatusInfo>,
    durationDays: number
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sDate = task.startDate ? new Date(task.startDate) : null;
    const dDate = task.dueDate ? new Date(task.dueDate) : null;

    setTooltipData({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      title: task.title,
      taskNumber: task.taskNumber,
      status: task.status,
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      priority: task.priority,
      assigneeName: task.assignee?.name || 'Belum ditugaskan',
      startDateFormatted: sDate
        ? sDate.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
      dueDateFormatted: dDate
        ? dDate.toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '-',
      durationDays,
      phase: task.phase?.trim() || 'Tanpa Phase',
      projectName: task.taskProject?.name || 'Tanpa Proyek',
    });
  };

  const handleBarMouseLeave = () => {
    setTooltipData(null);
  };

  const handlePhaseMove = async (phaseId: number, dir: 'up' | 'down') => {
    if (!onMovePhase || movingPhaseId !== null) return;
    setMovingPhaseId(phaseId);
    try {
      await onMovePhase(phaseId, dir);
    } finally {
      setMovingPhaseId(null);
    }
  };

  return (
    <div className={styles.timelineContainer}>
      {/* Toolbar & Controls */}
      <div className={styles.timelineToolbar}>
        {/* Project Selector */}
        <div className={styles.timelineFilterGroup}>
          <span className={styles.timelineFilterLabel}>Project / Fitur:</span>
          <select
            className={styles.filterSelect}
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            style={{ minWidth: '200px', height: '36px', fontSize: '0.85rem' }}
          >
            <option value="all">Semua Proyek (Ringkasan)</option>
            {taskProjects.map((tp) => (
              <option key={tp.id} value={String(tp.id)}>
                {tp.name}
              </option>
            ))}
          </select>
          {selectedProjectId !== 'all' && currentProject && currentProject.name !== 'Tanpa Proyek' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {onEditProject && (
                <button
                  type="button"
                  onClick={() => onEditProject(currentProject)}
                  className={styles.timelineActionBtn}
                  title="Edit nama/deskripsi proyek ini"
                >
                  <Pencil size={13} />
                </button>
              )}
              {onDeleteProject && (
                <button
                  type="button"
                  onClick={() => onDeleteProject(currentProject)}
                  className={`${styles.timelineActionBtn} ${styles.timelineActionBtnDanger}`}
                  title="Hapus proyek ini"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Management Buttons: + Proyek/Fitur & + Phase */}
        <div className={styles.timelineBtnGroup}>
          <button
            type="button"
            onClick={onCreateProject}
            className={styles.timelineToolbarBtn}
            title="Buat Proyek / Fitur Baru"
          >
            <FolderPlus size={15} style={{ color: 'var(--primary)' }} />
            <span>+ Proyek/Fitur</span>
          </button>

          {selectedProjectId !== 'all' && (
            <button
              type="button"
              onClick={() => onCreatePhase && onCreatePhase(parseInt(selectedProjectId, 10))}
              className={styles.timelineToolbarBtn}
              title={`Tambah Phase pada proyek ${currentProject?.name || ''}`}
            >
              <Layers size={15} style={{ color: '#38bdf8' }} />
              <span>+ Phase</span>
            </button>
          )}

          {/* Go to Today Button */}
          <button
            type="button"
            onClick={scrollToToday}
            className={styles.timelineToolbarBtn}
            title="Geser tampilan ke hari ini"
          >
            <Crosshair size={14} />
            <span>Hari Ini</span>
          </button>
        </div>

        {/* Working Days Total Stat */}
        <div
          style={{
            fontSize: '0.78rem',
            color: 'var(--muted-foreground)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-hover, rgba(255,255,255,0.03))',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
          }}
        >
          <CalendarDays size={14} />
          <span>
            Rentang:{' '}
            <strong style={{ color: 'var(--foreground)' }}>
              {workdays.length} hari kerja
            </strong>{' '}
            (Senin – Jumat)
          </span>
        </div>

        {/* Legend */}
        <div className={styles.timelineLegend}>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#64748b' }} />
            <span>To Do</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#3b82f6' }} />
            <span>In Progress</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#10b981' }} />
            <span>Done</span>
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: '#ef4444' }} />
            <span>Terlambat</span>
          </div>
        </div>
      </div>

      {/* Main Gantt Viewport */}
      {selectedProjectId === 'all' && taskProjects.length === 0 ? (
        <div className={styles.timelineEmpty}>
          <Folder size={44} className={styles.timelineEmptyIcon} />
          <div className={styles.timelineEmptyText}>Belum ada Proyek/Fitur</div>
          <div className={styles.timelineEmptySubtext}>
            Buat Proyek/Fitur pertama untuk mulai mengelompokkan timeline kerja.
          </div>
          <button onClick={onCreateProject} className={styles.createBtn} style={{ marginTop: '8px' }}>
            <FolderPlus size={16} />
            Buat Proyek/Fitur
          </button>
        </div>
      ) : (
        <div
          ref={chartScrollRef}
          style={{
            display: 'flex',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 240px)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--surface)',
            position: 'relative',
          }}
        >
          {/* Unified Container with sticky left sidebar and sticky top header */}
          <div style={{ display: 'flex', minWidth: 'max-content', position: 'relative' }}>
            {/* Sticky Left Sidebar (Task / Phase / Project list) */}
            <div
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 20,
                width: '320px',
                minWidth: '320px',
                background: 'var(--surface)',
                borderRight: '2px solid var(--border)',
                flexShrink: 0,
              }}
            >
              {/* Header Top-Left */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 30,
                  height: '48px',
                  background: 'var(--surface)',
                  borderBottom: '2px solid var(--border)',
                  padding: '0 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  color: 'var(--foreground)',
                }}
              >
                <span>
                  {selectedProjectId === 'all' ? 'Daftar Proyek / Fitur' : `${currentProject?.name || 'Proyek'} (Phase & Task)`}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--muted-foreground)',
                    fontWeight: 500,
                  }}
                >
                  {selectedProjectId === 'all' ? `${taskProjects.length} proyek` : `${phaseGroups.length} phase`}
                </span>
              </div>

              {/* Rows - Sidebar content */}
              {selectedProjectId === 'all' ? (
                /* Mode Semua Proyek: Project rows in sidebar */
                projectSummaries.map((p) => {
                  const isDefault = p.name === 'Tanpa Proyek';
                  return (
                    <div
                      key={p.id}
                      style={{
                        height: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        borderBottom: '1px solid var(--border)',
                        gap: '6px',
                        background: 'rgba(139, 92, 246, 0.04)',
                        transition: 'background 0.15s ease',
                      }}
                      className={styles.timelineSidebarProjectRow}
                    >
                      <div
                        onClick={() => onSelectProject(String(p.id))}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          flex: 1,
                          minWidth: 0,
                          cursor: 'pointer',
                        }}
                        title={`Masuk ke detail proyek ${p.name}`}
                      >
                        <Folder size={15} style={{ color: '#a855f7', flexShrink: 0 }} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            color: 'var(--foreground)',
                          }}
                        >
                          {p.name}
                        </span>
                      </div>

                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          color: 'var(--muted-foreground)',
                          background: 'rgba(255,255,255,0.06)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        {p.doneTasks}/{p.totalTasks}
                      </span>

                      {/* Project Edit / Delete actions */}
                      {!isDefault && (
                        <div className={styles.phaseActionGroup}>
                          {onEditProject && (
                            <button
                              type="button"
                              onClick={() => onEditProject(p.rawProject)}
                              className={styles.timelineActionBtn}
                              title="Edit nama/deskripsi proyek"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                          {onDeleteProject && (
                            <button
                              type="button"
                              onClick={() => onDeleteProject(p.rawProject)}
                              className={`${styles.timelineActionBtn} ${styles.timelineActionBtnDanger}`}
                              title="Hapus proyek ini"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      )}

                      <span
                        title="Buka proyek"
                        onClick={() => onSelectProject(String(p.id))}
                        style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.5, flexShrink: 0, cursor: 'pointer' }}
                      >
                        <ChevronRight size={14} />
                      </span>
                    </div>
                  );
                })
              ) : (
                /* Mode Per-Proyek: Phase + Tasks rows in sidebar */
                phaseGroups.map((group, groupIdx) => {
                  const isUnassignedPhase = group.phaseName === 'Tanpa Phase';
                  const entityPhasesCount = phaseGroups.filter((g) => g.isEntity).length;
                  const canMoveUp = group.isEntity && groupIdx > 0;
                  const canMoveDown = group.isEntity && groupIdx < entityPhasesCount - 1;

                  return (
                    <React.Fragment key={group.key}>
                      {/* Phase Row in sidebar */}
                      <div
                        style={{
                          height: '38px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px 0 12px',
                          borderBottom: '1px solid var(--border)',
                          background: 'rgba(51, 65, 85, 0.45)',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: '#cbd5e1',
                          gap: '6px',
                        }}
                      >
                        <Layers size={14} style={{ opacity: 0.85, color: '#38bdf8', flexShrink: 0 }} />
                        <span
                          style={{
                            maxWidth: '120px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={group.phaseName}
                        >
                          {group.phaseName}
                        </span>

                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            color: '#94a3b8',
                            flexShrink: 0,
                          }}
                        >
                          {group.totalCount > 0 ? `${group.doneCount}/${group.totalCount}` : '0 task'}
                        </span>

                        {/* Phase Actions */}
                        <div className={styles.phaseActionGroup}>
                          {group.isEntity && group.entity && (
                            <>
                              {onMovePhase && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePhaseMove(group.entity!.id, 'up')}
                                    disabled={!canMoveUp || movingPhaseId !== null}
                                    className={styles.timelineActionBtn}
                                    title="Pindahkan phase ke atas"
                                    style={{ opacity: canMoveUp ? 1 : 0.3 }}
                                  >
                                    <ChevronUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePhaseMove(group.entity!.id, 'down')}
                                    disabled={!canMoveDown || movingPhaseId !== null}
                                    className={styles.timelineActionBtn}
                                    title="Pindahkan phase ke bawah"
                                    style={{ opacity: canMoveDown ? 1 : 0.3 }}
                                  >
                                    <ChevronDown size={12} />
                                  </button>
                                </>
                              )}
                              {onEditPhase && (
                                <button
                                  type="button"
                                  onClick={() => onEditPhase(group.entity!)}
                                  className={styles.timelineActionBtn}
                                  title="Edit nama phase"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                              {onDeletePhase && (
                                <button
                                  type="button"
                                  onClick={() => onDeletePhase(group.entity!)}
                                  className={`${styles.timelineActionBtn} ${styles.timelineActionBtnDanger}`}
                                  title="Hapus phase ini"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </>
                          )}

                          {/* + Task button in this Phase */}
                          <button
                            type="button"
                            onClick={() =>
                              onCreateTaskInPhase &&
                              onCreateTaskInPhase(
                                parseInt(selectedProjectId, 10),
                                group.phaseName,
                                group.phaseId
                              )
                            }
                            className={styles.phaseAddTaskBtn}
                            title={`Buat task di ${group.phaseName}`}
                          >
                            <Plus size={11} />
                            <span>Task</span>
                          </button>
                        </div>
                      </div>

                      {/* Empty state within phase if 0 tasks */}
                      {group.tasks.length === 0 && (
                        <div
                          style={{
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 12px 0 32px',
                            borderBottom: '1px solid var(--border)',
                            fontSize: '0.72rem',
                            color: 'var(--muted-foreground)',
                            fontStyle: 'italic',
                          }}
                        >
                          Belum ada task di phase ini
                        </div>
                      )}

                      {/* Task Rows in sidebar */}
                      {group.tasks.map((task) => {
                        const hasDate = Boolean(task.startDate && task.dueDate);

                        return (
                          <div
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            style={{
                              height: '36px',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 12px',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                              gap: '6px',
                              transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            title={`Klik untuk melihat detail ${task.taskNumber}`}
                          >
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                fontFamily: 'monospace',
                                flexShrink: 0,
                              }}
                            >
                              {task.taskNumber}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '0.78rem',
                                color: 'var(--foreground)',
                                opacity: hasDate ? 1 : 0.6,
                              }}
                            >
                              {task.title}
                            </span>
                            {!hasDate && (
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  color: '#f59e0b',
                                  background: 'rgba(245, 158, 11, 0.12)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  flexShrink: 0,
                                }}
                              >
                                Tanpa Tanggal
                              </span>
                            )}
                            {task.assignee && (
                              <span
                                style={{
                                  fontSize: '0.66rem',
                                  color: 'var(--muted-foreground)',
                                  background: 'rgba(255,255,255,0.06)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  flexShrink: 0,
                                  maxWidth: '65px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {task.assignee.name.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </div>

            {/* Right Gantt Grid Columns (Header + Bars) */}
            <div
              style={{
                width: `${totalGridWidth}px`,
                position: 'relative',
              }}
            >
              {/* Sticky Date Header */}
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 15,
                  height: '48px',
                  background: 'var(--surface)',
                  borderBottom: '2px solid var(--border)',
                  display: 'flex',
                }}
              >
                {workdays.map((col) => (
                  <div
                    key={col.dateStr}
                    ref={col.isToday ? todayRef : null}
                    style={{
                      width: `${colWidth}px`,
                      minWidth: `${colWidth}px`,
                      borderRight: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 0',
                      userSelect: 'none',
                      background: col.isToday
                        ? 'rgba(239, 68, 68, 0.12)'
                        : 'transparent',
                      color: col.isToday ? '#ef4444' : 'var(--muted-foreground)',
                      fontWeight: col.isToday ? 700 : 500,
                    }}
                  >
                    <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>
                      {col.dayName}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      {col.dayNum}
                    </span>
                    <span style={{ fontSize: '0.58rem', opacity: 0.6 }}>
                      {col.monthName}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rows with Bars */}
              {selectedProjectId === 'all' ? (
                /* Mode Semua Proyek: Rows */
                projectSummaries.map((p) => {
                  const hasSchedule = Boolean(p.earliestStart && p.latestDue);
                  let placement = { startCol: 1, spanCol: 1, durationDays: 0 };
                  if (hasSchedule) {
                    placement = getTaskGridPlacement(p.earliestStart!, p.latestDue!);
                  }

                  const percentDone =
                    p.totalTasks > 0 ? Math.round((p.doneTasks / p.totalTasks) * 100) : 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => onSelectProject(String(p.id))}
                      style={{
                        height: '44px',
                        position: 'relative',
                        borderBottom: '1px solid var(--border)',
                        background: 'rgba(139, 92, 246, 0.02)',
                        cursor: 'pointer',
                      }}
                      title={`Klik untuk melihat detail proyek ${p.name}`}
                    >
                      {/* Grid background column lines */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          left: 0,
                          right: 0,
                          display: 'flex',
                          pointerEvents: 'none',
                        }}
                      >
                        {workdays.map((col) => (
                          <div
                            key={col.dateStr}
                            style={{
                              width: `${colWidth}px`,
                              minWidth: `${colWidth}px`,
                              borderRight: '1px solid var(--border)',
                              background: col.isToday
                                ? 'rgba(239, 68, 68, 0.04)'
                                : 'transparent',
                            }}
                          />
                        ))}
                      </div>

                      {/* Project Span Bar */}
                      {hasSchedule && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '8px',
                            left: `${(placement.startCol - 1) * colWidth + 2}px`,
                            width: `${placement.spanCol * colWidth - 4}px`,
                            height: '28px',
                            borderRadius: '6px',
                            background:
                              'linear-gradient(135deg, rgba(139, 92, 246, 0.8), rgba(99, 102, 241, 0.85))',
                            border: '1px solid rgba(168, 85, 247, 0.6)',
                            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 8px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'white',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            zIndex: 4,
                            gap: '6px',
                          }}
                        >
                          <Folder size={12} style={{ flexShrink: 0 }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name} ({percentDone}%)
                          </span>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              opacity: 0.85,
                              marginLeft: 'auto',
                              flexShrink: 0,
                            }}
                          >
                            {placement.durationDays} hari kerja
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* Mode Per-Proyek: Phase rows and Task rows */
                phaseGroups.map((group) => {
                  const hasPhaseSchedule = Boolean(group.earliestStart && group.latestDue);
                  let phasePlacement = { startCol: 1, spanCol: 1, durationDays: 0 };
                  if (hasPhaseSchedule) {
                    phasePlacement = getTaskGridPlacement(
                      group.earliestStart!,
                      group.latestDue!
                    );
                  }

                  return (
                    <React.Fragment key={group.key}>
                      {/* Phase Row in grid */}
                      <div
                        style={{
                          height: '38px',
                          position: 'relative',
                          borderBottom: '1px solid var(--border)',
                          background: 'rgba(51, 65, 85, 0.45)',
                        }}
                      >
                        {/* Grid lines */}
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            right: 0,
                            display: 'flex',
                            pointerEvents: 'none',
                          }}
                        >
                          {workdays.map((col) => (
                            <div
                              key={col.dateStr}
                              style={{
                                width: `${colWidth}px`,
                                minWidth: `${colWidth}px`,
                                borderRight: '1px solid var(--border)',
                                background: col.isToday
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : 'transparent',
                              }}
                            />
                          ))}
                        </div>

                        {/* Phase Span Bracket / Neutral Bar */}
                        {hasPhaseSchedule && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '7px',
                              left: `${(phasePlacement.startCol - 1) * colWidth + 2}px`,
                              width: `${phasePlacement.spanCol * colWidth - 4}px`,
                              height: '24px',
                              borderRadius: '4px',
                              background: 'rgba(100, 116, 139, 0.45)',
                              border: '1px dashed rgba(148, 163, 184, 0.7)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '0 8px',
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              color: '#e2e8f0',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              zIndex: 3,
                            }}
                          >
                            <span>
                              {group.phaseName} ({phasePlacement.durationDays} hari kerja)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Empty sub-row in grid if 0 tasks */}
                      {group.tasks.length === 0 && (
                        <div
                          style={{
                            height: '32px',
                            position: 'relative',
                            borderBottom: '1px solid var(--border)',
                          }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: 0,
                              right: 0,
                              display: 'flex',
                              pointerEvents: 'none',
                            }}
                          >
                            {workdays.map((col) => (
                              <div
                                key={col.dateStr}
                                style={{
                                  width: `${colWidth}px`,
                                  minWidth: `${colWidth}px`,
                                  borderRight: '1px solid var(--border)',
                                  background: col.isToday
                                    ? 'rgba(239, 68, 68, 0.03)'
                                    : 'transparent',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task Rows in grid */}
                      {group.tasks.map((task) => {
                        const hasDate = Boolean(task.startDate && task.dueDate);
                        let placement = { startCol: 1, spanCol: 1, durationDays: 0 };
                        if (hasDate) {
                          placement = getTaskGridPlacement(task.startDate!, task.dueDate!);
                        }

                        const statusInfo = getTaskStatusInfo(task);
                        const priority = getPriorityStyle(task.priority);
                        const PriorityIcon = priority.icon;

                        return (
                          <div
                            key={task.id}
                            style={{
                              height: '36px',
                              position: 'relative',
                              borderBottom: '1px solid var(--border)',
                            }}
                          >
                            {/* Grid lines */}
                            <div
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: 0,
                                right: 0,
                                display: 'flex',
                                pointerEvents: 'none',
                              }}
                            >
                              {workdays.map((col) => (
                                <div
                                  key={col.dateStr}
                                  style={{
                                    width: `${colWidth}px`,
                                    minWidth: `${colWidth}px`,
                                    borderRight: '1px solid var(--border)',
                                    background: col.isToday
                                      ? 'rgba(239, 68, 68, 0.05)'
                                      : 'transparent',
                                  }}
                                />
                              ))}
                            </div>

                            {/* Task Bar */}
                            {hasDate && (
                              <div
                                onClick={() => onTaskClick(task)}
                                onMouseEnter={(e) =>
                                  handleBarMouseEnter(e, task, statusInfo, placement.durationDays)
                                }
                                onMouseLeave={handleBarMouseLeave}
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  left: `${(placement.startCol - 1) * colWidth + 2}px`,
                                  width: `${placement.spanCol * colWidth - 4}px`,
                                  height: '24px',
                                  borderRadius: '5px',
                                  background: statusInfo.bg,
                                  border: `1px solid ${statusInfo.border}`,
                                  borderLeft: priority.borderLeft,
                                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '0 6px',
                                  fontSize: '0.68rem',
                                  fontWeight: 600,
                                  color: 'white',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  cursor: 'pointer',
                                  zIndex: 4,
                                  gap: '5px',
                                  transition: 'filter 0.12s ease, transform 0.1s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.filter = 'brightness(1.15)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.filter = 'none';
                                  e.currentTarget.style.transform = 'none';
                                }}
                              >
                                {PriorityIcon && <PriorityIcon size={11} style={{ flexShrink: 0 }} />}
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    background: 'rgba(0,0,0,0.25)',
                                    padding: '1px 4px',
                                    borderRadius: '3px',
                                    flexShrink: 0,
                                  }}
                                >
                                  {statusInfo.label}
                                </span>
                                <span
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {task.title}
                                </span>
                                {task.assignee && placement.spanCol >= 3 && (
                                  <span
                                    style={{
                                      fontSize: '0.62rem',
                                      opacity: 0.85,
                                      marginLeft: 'auto',
                                      flexShrink: 0,
                                      background: 'rgba(0,0,0,0.2)',
                                      padding: '1px 4px',
                                      borderRadius: '3px',
                                    }}
                                  >
                                    {task.assignee.name.split(' ')[0]}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Unscheduled Tasks Section */}
      {unscheduledTasks.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            background: 'var(--surface)',
            overflow: 'hidden',
          }}
        >
          <div
            onClick={() => setShowUnscheduled(!showUnscheduled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.02)',
              borderBottom: showUnscheduled ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={15} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Task Tanpa Tanggal ({unscheduledTasks.length} task)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                — Tanggal belum diisi sehingga tidak muncul di diagram Gantt
              </span>
            </div>
            {showUnscheduled ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>

          {showUnscheduled && (
            <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {unscheduledTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onTaskClick(t)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'var(--surface-hover, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--primary)',
                        fontFamily: 'monospace',
                      }}
                    >
                      {t.taskNumber}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--foreground)',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.title}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      Proyek: {t.taskProject?.name || 'Tanpa Proyek'}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--muted-foreground)',
                      }}
                    >
                      Phase: {t.phase || 'Tanpa Phase'}
                    </span>
                    <button
                      type="button"
                      className={styles.addInlineBtn}
                      style={{
                        height: '24px',
                        width: 'auto',
                        padding: '0 8px',
                        fontSize: '0.7rem',
                      }}
                    >
                      Atur Tanggal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Hover Tooltip */}
      {tooltipData && tooltipData.visible && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipData.x}px`,
            top: `${tooltipData.y}px`,
            transform: 'translate(-50%, -100%)',
            background: 'var(--surface, #1e1e2e)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            padding: '10px 14px',
            color: 'var(--foreground)',
            zIndex: 9999,
            pointerEvents: 'none',
            minWidth: '240px',
            maxWidth: '320px',
            fontSize: '0.78rem',
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.84rem',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>
              {tooltipData.taskNumber}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tooltipData.title}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.72rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Status:</span>
              <span style={{ color: tooltipData.statusColor, fontWeight: 700 }}>
                {tooltipData.statusLabel}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Prioritas:</span>
              <span style={{ fontWeight: 600 }}>{tooltipData.priority}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Assignee:</span>
              <span style={{ fontWeight: 600 }}>{tooltipData.assigneeName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Mulai:</span>
              <span>{tooltipData.startDateFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Deadline:</span>
              <span>{tooltipData.dueDateFormatted}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Durasi:</span>
              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                {tooltipData.durationDays} hari kerja
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Phase:</span>
              <span>{tooltipData.phase}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
