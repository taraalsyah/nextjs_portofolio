'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, X, Calendar as CalendarIcon } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

export interface CalendarTask {
  id: number;
  taskNumber: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
}

export interface TaskCalendarViewProps {
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
}

type TaskWithOverdue = CalendarTask & { isOverdue: boolean };

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const EMPTY_TASKS: TaskWithOverdue[] = [];

function getCalendarEventClass(status: string, overdue: boolean): string {
  if (overdue) return styles.calEventOverdue;

  switch (status) {
    case 'BACKLOG':
      return styles.calEventBacklog;
    case 'OPEN':
      return styles.calEventOpen;
    case 'IN_PROGRESS':
      return styles.calEventInProgress;
    case 'DONE':
      return styles.calEventDone;
    case 'CLOSED':
      return styles.calEventClosed;
    default:
      return styles.calEventBacklog;
  }
}

interface CalendarDayCellProps {
  day: number | null;
  idx: number;
  isCurrentDay: boolean;
  dayTasks: TaskWithOverdue[];
  maxVisibleTasks: number;
  onTaskClick: (task: CalendarTask) => void;
  onOpenMore: (day: number, tasks: TaskWithOverdue[]) => void;
}

const CalendarDayCell = React.memo(function CalendarDayCell({
  day,
  idx,
  isCurrentDay,
  dayTasks,
  maxVisibleTasks,
  onTaskClick,
  onOpenMore,
}: CalendarDayCellProps) {
  if (day === null) {
    return (
      <div
        key={`empty-${idx}`}
        className={styles.calendarDayCell}
        style={{ opacity: 0.35, background: 'var(--surface-muted)' }}
      />
    );
  }

  const hasOverflow = dayTasks.length > maxVisibleTasks;
  const visibleLimit = hasOverflow ? Math.max(1, maxVisibleTasks - 1) : maxVisibleTasks;
  const visibleTasks = hasOverflow ? dayTasks.slice(0, visibleLimit) : dayTasks;
  const remainingCount = hasOverflow ? dayTasks.length - visibleLimit : 0;

  return (
    <div
      className={`${styles.calendarDayCell} ${isCurrentDay ? styles.todayCell : ''}`}
    >
      <span className={`${styles.calendarDayNum} ${isCurrentDay ? styles.todayNum : ''}`}>
        {day}
      </span>
      <div className={styles.calendarTaskList}>
        {visibleTasks.map((t) => {
          const eventClass = getCalendarEventClass(t.status, t.isOverdue);

          return (
            <div
              key={t.id}
              onClick={() => onTaskClick(t)}
              className={`${styles.calendarEventItem} ${eventClass}`}
              title={`${t.taskNumber} - ${t.title} (${t.status}${t.isOverdue ? ' - TERLAMBAT' : ''})`}
            >
              {t.isOverdue ? (
                <AlertCircle size={11} style={{ flexShrink: 0, color: '#DC2626' }} />
              ) : (
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'currentColor',
                    flexShrink: 0,
                    opacity: 0.8,
                  }}
                />
              )}
              <span className={styles.calEventTitle}>
                {t.taskNumber}: {t.title}
              </span>
            </div>
          );
        })}

        {remainingCount > 0 && (
          <button
            type="button"
            className={styles.calendarMoreBtn}
            onClick={(e) => {
              e.stopPropagation();
              onOpenMore(day, dayTasks);
            }}
            title={`Lihat seluruh ${dayTasks.length} task untuk tanggal ini`}
          >
            +{remainingCount} lagi
          </button>
        )}
      </div>
    </div>
  );
});

export function TaskCalendarView({ tasks, onTaskClick }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const gridRef = useRef<HTMLDivElement | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Precompute days grid and number of weeks (4, 5, or 6) with useMemo
  const { daysGrid, numWeeks } = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const grid: (number | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      grid.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      grid.push(day);
    }

    const weeks = Math.ceil(grid.length / 7);
    return { daysGrid: grid, numWeeks: weeks };
  }, [year, month]);

  // Precompute today's day number for fast O(1) matching
  const todayDay = useMemo(() => {
    const today = new Date();
    if (today.getFullYear() === year && today.getMonth() === month) {
      return today.getDate();
    }
    return null;
  }, [year, month]);

  // Group tasks by day in a single O(N) pass, precalculating isOverdue
  const tasksByDay = useMemo(() => {
    const map = new Map<number, TaskWithOverdue[]>();
    const now = Date.now();

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (!t.dueDate) continue;

      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dayNum = d.getDate();
        const overdue = t.status !== 'DONE' && d.getTime() < now;
        const taskWithOverdue: TaskWithOverdue = {
          ...t,
          isOverdue: overdue,
        };

        const existing = map.get(dayNum);
        if (existing) {
          existing.push(taskWithOverdue);
        } else {
          map.set(dayNum, [taskWithOverdue]);
        }
      }
    }

    return map;
  }, [tasks, year, month]);

  // Measure available slot height per day using a SINGLE ResizeObserver on the grid
  const [maxVisibleTasks, setMaxVisibleTasks] = useState<number>(() => {
    return numWeeks === 4 ? 3 : numWeeks === 5 ? 2 : 1;
  });

  useEffect(() => {
    const gridElem = gridRef.current;
    if (!gridElem || typeof ResizeObserver === 'undefined') return;

    let rafId: number | null = null;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const gridHeight = entry.contentRect.height;
      if (gridHeight <= 0) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Day header takes ~26px
        const availableForRows = Math.max(0, gridHeight - 26);
        const rowHeight = availableForRows / numWeeks;
        // Cell padding (8px) + day number (16px) + gap -> overhead ~24px
        const availableForTasks = rowHeight - 24;
        // Each event item is ~21px tall
        const maxTasks = Math.max(1, Math.floor(availableForTasks / 21));
        setMaxVisibleTasks(maxTasks);
      });
    });

    observer.observe(gridElem);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [numWeeks]);

  // Modal / Dialog for "+N lagi" click
  const [activeDayModal, setActiveDayModal] = useState<{
    day: number;
    tasks: TaskWithOverdue[];
  } | null>(null);

  const handleOpenMore = useCallback((day: number, dayTasks: TaskWithOverdue[]) => {
    setActiveDayModal({ day, tasks: dayTasks });
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveDayModal(null);
  }, []);

  // Close modal on Escape key
  useEffect(() => {
    if (!activeDayModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveDayModal(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDayModal]);

  return (
    <div className={styles.calendarContainer}>
      {/* Month Navigation Bar */}
      <div className={styles.calendarHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            {MONTH_NAMES[month]} {year}
          </h3>
          <button
            type="button"
            onClick={handleToday}
            className={styles.todayBtn}
            title="Kembali ke hari ini"
          >
            Hari Ini
          </button>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            type="button"
            onClick={handlePrevMonth}
            className={styles.actionBtn}
            title="Bulan Sebelumnya"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className={styles.actionBtn}
            title="Bulan Selanjutnya"
            aria-label="Bulan Selanjutnya"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Dynamic 7-Column Grid with equal-height week rows */}
      <div
        ref={gridRef}
        className={styles.calendarGrid}
        style={{ '--calendar-weeks': numWeeks } as React.CSSProperties}
      >
        {DAY_NAMES.map((dayName) => (
          <div key={dayName} className={styles.calendarDayHeader}>
            {dayName}
          </div>
        ))}

        {daysGrid.map((day, idx) => {
          const isCurrentDay = day !== null && day === todayDay;
          const dayTasks = day !== null ? tasksByDay.get(day) || EMPTY_TASKS : EMPTY_TASKS;

          return (
            <CalendarDayCell
              key={day !== null ? `day-${day}` : `empty-${idx}`}
              day={day}
              idx={idx}
              isCurrentDay={isCurrentDay}
              dayTasks={dayTasks}
              maxVisibleTasks={maxVisibleTasks}
              onTaskClick={onTaskClick}
              onOpenMore={handleOpenMore}
            />
          );
        })}
      </div>

      {/* Modal Popup for "+N lagi" */}
      {activeDayModal && (
        <div
          className={styles.calendarDayModalBackdrop}
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-day-modal-title"
        >
          <div
            className={styles.calendarDayModalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.calendarDayModalHeader}>
              <div className={styles.calendarDayModalTitleGroup}>
                <h4 id="calendar-day-modal-title" className={styles.calendarDayModalTitle}>
                  {activeDayModal.day} {MONTH_NAMES[month]} {year}
                </h4>
                <p className={styles.calendarDayModalSubtitle}>
                  {activeDayModal.tasks.length} task dengan deadline hari ini
                </p>
              </div>
              <button
                type="button"
                className={styles.calendarDayModalCloseBtn}
                onClick={handleCloseModal}
                title="Tutup dialog"
                aria-label="Tutup dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.calendarDayModalList}>
              {activeDayModal.tasks.map((t) => {
                const eventClass = getCalendarEventClass(t.status, t.isOverdue);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      handleCloseModal();
                      onTaskClick(t);
                    }}
                    className={`${styles.calendarEventItem} ${eventClass}`}
                    title={`${t.taskNumber} - ${t.title} (${t.status}${t.isOverdue ? ' - TERLAMBAT' : ''})`}
                    style={{ padding: '0.4rem 0.55rem', cursor: 'pointer' }}
                  >
                    {t.isOverdue ? (
                      <AlertCircle size={12} style={{ flexShrink: 0, color: '#DC2626' }} />
                    ) : (
                      <span
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'currentColor',
                          flexShrink: 0,
                          opacity: 0.8,
                        }}
                      />
                    )}
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {t.taskNumber}: {t.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
