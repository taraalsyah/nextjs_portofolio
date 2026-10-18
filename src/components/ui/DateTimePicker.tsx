'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import styles from './DateTimePicker.module.css';

export interface DateTimePickerProps {
  value?: string | null; // e.g. "2026-10-20T09:00" or ISO string
  onChange: (value: string) => void;
  defaultTime?: string; // e.g. "09:00" or "17:00"
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

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const WEEK_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const QUICK_TIME_PRESETS = [
  { label: '09:00 (Pagi)', value: '09:00' },
  { label: '12:00 (Siang)', value: '12:00' },
  { label: '17:00 (Sore)', value: '17:00' },
  { label: '23:59 (Malam)', value: '23:59' },
];

const STANDARD_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

function parseDateTimeParts(val?: string | null): { dateStr: string; hourStr: string; minuteStr: string } {
  if (!val) return { dateStr: '', hourStr: '', minuteStr: '' };

  if (val.includes('T') || val.includes(' ')) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return {
        dateStr: `${yyyy}-${mm}-${dd}`,
        hourStr: hh,
        minuteStr: min,
      };
    }
  }

  const parts = val.split('-');
  if (parts.length === 3) {
    return {
      dateStr: val.substring(0, 10),
      hourStr: '',
      minuteStr: '',
    };
  }

  return { dateStr: '', hourStr: '', minuteStr: '' };
}

function parseISODateOnly(dateStr?: string | Date | null): Date | null {
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

function formatYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayString(val?: string | null): { dateFormatted: string; timeFormatted: string } {
  if (!val) return { dateFormatted: '', timeFormatted: '' };
  const { dateStr, hourStr, minuteStr } = parseDateTimeParts(val);
  if (!dateStr) return { dateFormatted: '', timeFormatted: '' };

  const [y, m, d] = dateStr.split('-');
  const monthIdx = parseInt(m, 10) - 1;
  const monthName = MONTH_NAMES_SHORT[monthIdx] || m;
  const dateFormatted = `${parseInt(d, 10)} ${monthName} ${y}`;
  const timeFormatted = hourStr && minuteStr ? `${hourStr}:${minuteStr}` : '';

  return { dateFormatted, timeFormatted };
}

export function DateTimePicker({
  value,
  onChange,
  defaultTime = '09:00',
  placeholder = 'Pilih tanggal & jam...',
  minDate,
  maxDate,
  disabled = false,
  className = '',
  id: customId,
}: DateTimePickerProps) {
  const generatedId = useId();
  const inputId = customId || generatedId;

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const parsed = parseDateTimeParts(value);
  const selectedDate = parsed.dateStr ? parseISODateOnly(parsed.dateStr) : null;
  const initialTime = parsed.hourStr && parsed.minuteStr ? `${parsed.hourStr}:${parsed.minuteStr}` : defaultTime;

  const initialViewDate = selectedDate || new Date();
  const [viewYear, setViewYear] = useState(initialViewDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialViewDate.getMonth());

  const [selectedHour, setSelectedHour] = useState(parsed.hourStr || defaultTime.split(':')[0] || '09');
  const [selectedMinute, setSelectedMinute] = useState(parsed.minuteStr || defaultTime.split(':')[1] || '00');

  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const minDateObj = parseISODateOnly(minDate);
  const maxDateObj = parseISODateOnly(maxDate);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Synchronize internal time state when external value changes
  useEffect(() => {
    if (value) {
      const p = parseDateTimeParts(value);
      if (p.hourStr) setSelectedHour(p.hourStr);
      if (p.minuteStr) setSelectedMinute(p.minuteStr);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverHeight = 390;
    const gap = 8;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let placeTop = true;
    if (spaceAbove < popoverHeight + gap && spaceBelow >= popoverHeight + gap) {
      placeTop = false;
    }

    let top = 0;
    if (placeTop) {
      top = rect.top - popoverHeight - gap;
      if (top < 8) top = 8;
    } else {
      top = rect.bottom + gap;
      if (top + popoverHeight > window.innerHeight - 8) {
        top = window.innerHeight - popoverHeight - 8;
      }
    }

    let left = rect.left;
    const popoverWidth = 300;
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8;
    }
    if (left < 8) left = 8;

    setPlacement(placeTop ? 'top' : 'bottom');
    setPopoverStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${popoverWidth}px`,
      zIndex: 99999,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      const p = parseDateTimeParts(value);
      const current = p.dateStr ? parseISODateOnly(p.dateStr) : new Date();
      if (current) {
        setViewYear(current.getFullYear());
        setViewMonth(current.getMonth());
      }
      if (p.hourStr) setSelectedHour(p.hourStr);
      if (p.minuteStr) setSelectedMinute(p.minuteStr);
      updatePosition();
    }
  }, [isOpen, value, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updatePosition]);

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

  const commitDateTime = (date: Date, hour: string, minute: string) => {
    const dateStr = formatYYYYMMDD(date);
    const result = `${dateStr}T${hour}:${minute}`;
    onChange(result);
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    commitDateTime(newDate, selectedHour, selectedMinute);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    commitDateTime(today, selectedHour, selectedMinute);
  };

  const handleHourChange = (newHour: string) => {
    setSelectedHour(newHour);
    const targetDate = selectedDate || new Date();
    commitDateTime(targetDate, newHour, selectedMinute);
  };

  const handleMinuteChange = (newMinute: string) => {
    setSelectedMinute(newMinute);
    const targetDate = selectedDate || new Date();
    commitDateTime(targetDate, selectedHour, newMinute);
  };

  const handleSelectQuickTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    setSelectedHour(h);
    setSelectedMinute(m);
    const targetDate = selectedDate || new Date();
    commitDateTime(targetDate, h, m);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const todayObj = new Date();
  const isTodayMonth = todayObj.getFullYear() === viewYear && todayObj.getMonth() === viewMonth;
  const todayDateNum = todayObj.getDate();

  const yearsOptions: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 10; y <= currentYear + 15; y++) {
    yearsOptions.push(y);
  }

  const daysGrid: React.ReactNode[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    daysGrid.push(
      <button
        key={`prev-${d}`}
        type="button"
        disabled
        className={`${styles.dayCell} ${styles.outsideMonth}`}
      >
        {d}
      </button>
    );
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDate = new Date(viewYear, viewMonth, d);
    let isDisabled = false;

    if (minDateObj) {
      const minDateMidnight = new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate());
      if (currentDate < minDateMidnight) isDisabled = true;
    }

    if (maxDateObj) {
      const maxDateMidnight = new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate());
      if (currentDate > maxDateMidnight) isDisabled = true;
    }

    const isSelected =
      selectedDate !== null &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === d;

    const isToday = isTodayMonth && todayDateNum === d;

    daysGrid.push(
      <button
        key={`current-${d}`}
        type="button"
        disabled={isDisabled}
        onClick={() => handleSelectDay(d)}
        className={`
          ${styles.dayCell}
          ${isSelected ? styles.selected : ''}
          ${isToday && !isSelected ? styles.today : ''}
          ${isDisabled ? styles.disabledDay : ''}
        `}
      >
        {d}
      </button>
    );
  }

  const remainingCells = 42 - daysGrid.length;
  for (let d = 1; d <= remainingCells; d++) {
    daysGrid.push(
      <button
        key={`next-${d}`}
        type="button"
        disabled
        className={`${styles.dayCell} ${styles.outsideMonth}`}
      >
        {d}
      </button>
    );
  }

  const minuteOptions = Array.from(new Set([...STANDARD_MINUTES, selectedMinute])).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );

  const { dateFormatted, timeFormatted } = formatDisplayString(value);

  const popoverContent = (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className={styles.popover}
      role="dialog"
      aria-modal="true"
    >
      {/* Month & Year Navigation Header */}
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
      <div className={styles.daysGrid}>{daysGrid}</div>

      {/* Time Selection Section */}
      <div className={styles.timeSection}>
        <div className={styles.timeHeader}>
          <div className={styles.timeHeaderLeft}>
            <Clock size={13} className={styles.timeHeaderIcon} />
            <span>Pilih Jam & Menit:</span>
          </div>
        </div>

        <div className={styles.timeControls}>
          <select
            value={selectedHour}
            onChange={(e) => handleHourChange(e.target.value)}
            className={styles.timeSelect}
            aria-label="Pilih Jam"
          >
            {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <span className={styles.timeColon}>:</span>

          <select
            value={selectedMinute}
            onChange={(e) => handleMinuteChange(e.target.value)}
            className={styles.timeSelect}
            aria-label="Pilih Menit"
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Time Pills */}
        <div className={styles.quickPillsRow}>
          {QUICK_TIME_PRESETS.map((p) => {
            const isActive = `${selectedHour}:${selectedMinute}` === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleSelectQuickTime(p.value)}
                className={`${styles.quickPillBtn} ${isActive ? styles.quickPillBtnActive : ''}`}
              >
                {p.value}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button
            type="button"
            onClick={handleSelectToday}
            className={styles.footerBtn}
          >
            Hari ini
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

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className={styles.doneBtn}
        >
          <Check size={14} />
          <span>Selesai</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${styles.wrapper} ${className}`} ref={containerRef}>
      <button
        id={inputId}
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`${styles.triggerInput} ${isOpen ? styles.triggerInputActive : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className={styles.triggerContent}>
          <CalendarIcon size={15} className={styles.triggerIcon} />
          {dateFormatted ? (
            <span className={styles.displayDate}>
              {dateFormatted}
              {timeFormatted && (
                <span className={styles.displayTimeBadge}>
                  <Clock size={11} />
                  {timeFormatted}
                </span>
              )}
            </span>
          ) : (
            <span className={styles.placeholder}>{placeholder}</span>
          )}
        </div>

        {value && !disabled && (
          <span
            onClick={handleClear}
            className={styles.clearBtn}
            title="Hapus Tanggal & Jam"
            role="button"
            tabIndex={0}
          >
            <X size={14} />
          </span>
        )}
      </button>

      {isMounted && isOpen && createPortal(popoverContent, document.body)}
    </div>
  );
}
