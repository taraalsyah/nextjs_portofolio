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
            return <div key={`empty-${idx}`} className={styles.calendarDayCell} style={{ opacity: 0.2 }} />;
          }

          const dayTasks = getTasksForDay(day);

          return (
            <div key={`day-${day}`} className={styles.calendarDayCell}>
              <span className={styles.calendarDayNum}>{day}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
                {dayTasks.map((t) => {
                  const overdue = isOverdue(t.dueDate, t.status);
                  return (
                    <div
                      key={t.id}
                      onClick={() => onTaskClick(t)}
                      className={`${styles.calendarEventItem} ${overdue ? styles.overdueEvent : ''}`}
                      style={{
                        background: overdue
                          ? undefined
                          : t.status === 'DONE'
                          ? 'hsla(145, 80%, 45%, 0.2)'
                          : 'hsla(210, 90%, 65%, 0.2)',
                        color: overdue
                          ? undefined
                          : t.status === 'DONE'
                          ? 'hsl(145, 80%, 80%)'
                          : 'hsl(210, 90%, 85%)',
                      }}
                      title={`${t.taskNumber} - ${t.title}`}
                    >
                      {overdue && <AlertCircle size={10} style={{ marginRight: '2px' }} />}
                      {t.taskNumber}: {t.title}
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
