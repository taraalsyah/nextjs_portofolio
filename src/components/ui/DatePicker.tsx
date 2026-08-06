'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import styles from './DatePicker.module.css';

export interface DatePickerProps {
  value?: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  minDate?: string | Date | null;
  maxDate?: string | Date | null;
  disabled?: boolean;
  className?: string;
  id?: string;
}

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

const WEEK_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function parseISODate(dateStr?: string | Date | null): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  }
  const fallback = new Date(dateStr);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function formatDisplayDate(dateStr?: string | null): string {
  const parsed = parseISODate(dateStr);
  if (!parsed) return '';
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[parsed.getMonth()].substring(0, 3);
  const year = parsed.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pilih tanggal...',
  minDate,
  maxDate,
  disabled = false,
  className,
  id: customId,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = customId || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const selectedDate = parseISODate(value);

  const initialViewDate = selectedDate || new Date();
  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);

  const minDateObj = parseISODate(minDate);
  const maxDateObj = parseISODate(maxDate);

  // Synchronize view month/year with value when opened
  useEffect(() => {
    if (isOpen) {
      const current = parseISODate(value) || new Date();
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth());
    }
  }, [isOpen, value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onChange(formatYYYYMMDD(newDate));
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    onChange(formatYYYYMMDD(today));
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Generate days in month grid
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayObj = new Date();
  const isTodayMonth = todayObj.getFullYear() === viewYear && todayObj.getMonth() === viewMonth;
  const todayDateNum = todayObj.getDate();

  const yearsOptions = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 10; y <= currentYear + 15; y++) {
    yearsOptions.push(y);
  }

  const daysGrid = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    daysGrid.push({
      day: dayNum,
      isCurrentMonth: false,
      isPrevMonth: true,
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateObj = new Date(viewYear, viewMonth, dayNum);
    const isSelected =
      selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === dayNum;

    const isToday = isTodayMonth && todayDateNum === dayNum;

    let isDisabled = false;
    if (minDateObj) {
      const minComparison = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate());
      if (dateObj < minComparison) isDisabled = true;
    }
    if (maxDateObj) {
      const maxComparison = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate());
      if (dateObj > maxComparison) isDisabled = true;
    }

    daysGrid.push({
      day: dayNum,
      isCurrentMonth: true,
      isSelected,
      isToday,
      isDisabled,
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remainingCells = (7 - (daysGrid.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    daysGrid.push({
      day: i,
      isCurrentMonth: false,
      isNextMonth: true,
    });
  }

  return (
    <div className={`${styles.datePickerWrapper} ${className || ''}`} ref={containerRef}>
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`${styles.triggerInput} ${isOpen ? styles.triggerInputActive : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className={styles.triggerContent}>
          <CalendarIcon size={16} className={styles.triggerIcon} />
          {value ? (
            <span>{formatDisplayDate(value)}</span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>
        {value && !disabled && (
          <span
            onClick={handleClear}
            className={styles.clearBtn}
            title="Hapus Tanggal"
            role="button"
            tabIndex={0}
          >
            <X size={14} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.popover} role="dialog" aria-modal="true">
          {/* Header Controls */}
          <div className={styles.header}>
            <button
              type="button"
              onClick={handlePrevMonth}
              className={styles.navBtn}
              title="Bulan Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            <div className={styles.selectorsGroup}>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className={styles.selectInput}
              >
                {MONTH_NAMES.map((name, index) => (
                  <option key={name} value={index}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className={styles.selectInput}
              >
                {yearsOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className={styles.navBtn}
              title="Bulan Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Week Days Header */}
          <div className={styles.weekDaysGrid}>
            {WEEK_DAYS.map((d) => (
              <div key={d} className={styles.weekDayCell}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={styles.daysGrid}>
            {daysGrid.map((item, idx) => {
              if (!item.isCurrentMonth) {
                return (
                  <div key={idx} className={`${styles.dayCell} ${styles.outsideMonth}`}>
                    {item.day}
                  </div>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => !item.isDisabled && handleSelectDay(item.day)}
                  className={`
                    ${styles.dayCell}
                    ${item.isToday ? styles.today : ''}
                    ${item.isSelected ? styles.selected : ''}
                    ${item.isDisabled ? styles.disabledDay : ''}
                  `}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className={styles.footer}>
            <button type="button" onClick={handleSelectToday} className={styles.footerBtn}>
              Hari Ini
            </button>
            {value && (
              <button
                type="button"
                onClick={(e) => handleClear(e as any)}
                className={`${styles.footerBtn} ${styles.footerBtnDanger}`}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
