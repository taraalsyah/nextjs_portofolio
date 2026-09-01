'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';

export interface TimePickerProps {
  value?: string | null; // e.g. "09:00"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Generate 24-hour time slots: 00:00, 01:00, 02:00, ..., 23:00
const STANDARD_HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return `${h}:00`;
});

export function TimePicker({
  value,
  onChange,
  placeholder = '09:00',
  disabled = false,
  className = '',
  id,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayTime = value || '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectTime = (time: string) => {
    onChange(time);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={className} style={{ position: 'relative', width: '100%' }}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.4rem',
          width: '100%',
          height: '38px',
          padding: '0.45rem 0.75rem',
          borderRadius: '8px',
          background: 'var(--surface-elevated, #1e293b)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
          color: displayTime ? 'var(--foreground, #f8fafc)' : 'var(--muted-foreground, #94a3b8)',
          fontSize: '0.85rem',
          fontWeight: displayTime ? 600 : 400,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Clock size={15} style={{ color: 'var(--primary, #3b82f6)', flexShrink: 0 }} />
          <span>{displayTime || placeholder}</span>
        </div>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            opacity: 0.7,
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            width: '100%',
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'var(--surface-elevated, #1e293b)',
            border: '1px solid var(--border, rgba(255, 255, 255, 0.15))',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            padding: '0.3rem',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
          }}
        >
          {STANDARD_HOURS.map((t) => {
            const isSelected = value === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleSelectTime(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid var(--primary, #3b82f6)' : '1px solid transparent',
                  background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isSelected ? 'var(--primary, #60a5fa)' : 'var(--foreground, #f8fafc)',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{t}</span>
                {isSelected && <Check size={14} style={{ color: 'var(--primary, #3b82f6)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
