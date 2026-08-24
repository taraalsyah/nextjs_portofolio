'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

interface CalendarTask {
  id: number;
  taskNumber: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
}

interface TaskCalendarViewProps {
  tasks: CalendarTask[];
  onTaskClick: (task: CalendarTask) => void;
}

export function TaskCalendarView({ tasks, onTaskClick }: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayOfWeek = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const monthNames = [
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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysGrid: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysGrid.push(null);
  }
  for (let day = 1; day <= totalDays; day++) {
    daysGrid.push(day);
  }

  const getTasksForDay = (day: number) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const isOverdue = (dueDateStr?: string | null, status?: string) => {
    if (!dueDateStr || status === 'DONE') return false;
    return new Date(dueDateStr) < new Date();
  };

  const todayDate = new Date();
  const isToday = (day: number) => {
    return (
      todayDate.getFullYear() === year &&
      todayDate.getMonth() === month &&
      todayDate.getDate() === day
    );
  };

  const getCalendarEventClass = (status: string, overdue: boolean) => {
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
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarHeader}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
          {monthNames[month]} {year}
        </h3>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button onClick={handlePrevMonth} className={styles.actionBtn} title="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <button onClick={handleNextMonth} className={styles.actionBtn} title="Bulan Selanjutnya">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((dayName) => (
          <div key={dayName} className={styles.calendarDayHeader}>
            {dayName}
          </div>
        ))}

        {daysGrid.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                className={styles.calendarDayCell}
                style={{ opacity: 0.35, background: 'var(--surface-muted)' }}
              />
            );
          }

          const dayTasks = getTasksForDay(day);
          const currentDay = isToday(day);

          return (
            <div
              key={`day-${day}`}
              className={`${styles.calendarDayCell} ${currentDay ? styles.todayCell : ''}`}
            >
              <span className={`${styles.calendarDayNum} ${currentDay ? styles.todayNum : ''}`}>
                {day}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', overflowY: 'auto' }}>
                {dayTasks.map((t) => {
                  const overdue = isOverdue(t.dueDate, t.status);
                  const eventClass = getCalendarEventClass(t.status, overdue);

                  return (
                    <div
                      key={t.id}
                      onClick={() => onTaskClick(t)}
                      className={`${styles.calendarEventItem} ${eventClass}`}
                      title={`${t.taskNumber} - ${t.title} (${t.status}${overdue ? ' - TERLAMBAT' : ''})`}
                    >
                      {overdue ? (
                        <AlertCircle size={12} style={{ flexShrink: 0, color: '#DC2626', marginTop: '2px' }} />
                      ) : (
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'currentColor',
                            flexShrink: 0,
                            opacity: 0.8,
                            marginTop: '5px',
                          }}
                        />
                      )}
                      <span className={styles.calEventTitle}>
                        {t.taskNumber}: {t.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
