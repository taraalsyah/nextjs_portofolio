'use client';

import React, { useState } from 'react';
import { useDemo, DemoTask } from '@/context/DemoContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import styles from './demo.module.css';

interface DemoCalendarViewProps {
  onSelectTask: (task: DemoTask) => void;
  onOpenCreateTask?: () => void;
}

export const DemoCalendarView: React.FC<DemoCalendarViewProps> = ({
  onSelectTask,
  onOpenCreateTask,
}) => {
  const { tasks, activeProjectId } = useDemo();

  // Selected Month & Year (Default to September 2026 matching screenshot)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 1)); // Month is 0-indexed: 8 = September

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 8 = September

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

  const daysHeader = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

  // Calculate calendar grid days for the month
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon, 2 = Tue
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter tasks belonging to active project
  const filteredTasks = tasks.filter((t) => {
    if (activeProjectId !== 'ALL' && t.projectId !== activeProjectId) return false;
    return true;
  });

  // Get tasks due on a specific day number
  const getTasksForDay = (dayNum: number) => {
    const formattedDay = String(dayNum).padStart(2, '0');
    const formattedMonth = String(month + 1).padStart(2, '0');
    const targetDateStr = `${year}-${formattedMonth}-${formattedDay}`;

    return filteredTasks.filter((t) => t.dueDate === targetDateStr);
  };

  // Render padding cells for days before the 1st of the month
  const paddingCells = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  // Render actual month day cells
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div>
      {/* Calendar Header Card matching Screenshot */}
      <div className={styles.kanbanHeaderCard}>
        <div className={styles.kanbanTitleRow}>
          <div>
            <h2 className={styles.kanbanTitleText}>
              <CalendarIcon size={22} color="#2563eb" /> Calendar Deadline View
            </h2>
            <p className={styles.kanbanSubtext}>
              Visualisasi jadwal tenggat waktu (due date) seluruh task pada tampilan kalender bulanan.
            </p>
          </div>

          {onOpenCreateTask && (
            <button className={styles.primaryBlueBtn} onClick={onOpenCreateTask}>
              <Plus size={16} /> Buat Task Baru
            </button>
          )}
        </div>
      </div>

      {/* Month Navigation Row matching Screenshot */}
      <div className={styles.calendarMonthNavRow}>
        <h3 className={styles.calendarMonthTitle}>
          {monthNames[month]} {year}
        </h3>

        <div className={styles.calendarMonthBtnPair}>
          <button className={styles.arrowBtn} onClick={handlePrevMonth} title="Bulan Sebelumnya">
            <ChevronLeft size={16} />
          </button>
          <button className={styles.arrowBtn} onClick={handleNextMonth} title="Bulan Berikutnya">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Main Calendar Grid Box matching Screenshot */}
      <div className={styles.calendarOuterBox}>
        {/* Days Header Row: MIN | SEN | SEL | RAB | KAM | JUM | SAB */}
        <div className={styles.calendarDaysHeaderGrid}>
          {daysHeader.map((d) => (
            <div key={d} className={styles.calendarDayHeaderCell}>
              {d}
            </div>
          ))}
        </div>

        {/* 7-Column Grid Cells */}
        <div className={styles.calendarGridCells}>
          {/* Previous Month Padding Cells */}
          {paddingCells.map((_, idx) => (
            <div key={`pad-${idx}`} className={`${styles.calendarCell} ${styles.calendarCellPadding}`} />
          ))}

          {/* Actual Month Days */}
          {monthDays.map((dayNum) => {
            const dayTasks = getTasksForDay(dayNum);
            const isSeptemberFirst = year === 2026 && month === 8 && dayNum === 1;

            return (
              <div
                key={`day-${dayNum}`}
                className={`${styles.calendarCell} ${isSeptemberFirst ? styles.calendarCellToday : ''}`}
              >
                <div
                  className={`${styles.calendarDayNum} ${
                    isSeptemberFirst ? styles.calendarDayNumToday : ''
                  }`}
                >
                  {dayNum}
                </div>

                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={styles.calendarTaskPillCard}
                    onClick={() => onSelectTask(t)}
                    title={`${t.taskNumber}: ${t.title}`}
                  >
                    <span className={styles.pillDot} />
                    <div>
                      <span className={styles.pillTaskText}>{t.taskNumber}:</span> {t.title}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DemoCalendarView;
