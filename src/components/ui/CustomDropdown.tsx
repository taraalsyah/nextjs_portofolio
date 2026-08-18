'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomDropdownOption {
  value: string;
  label: string;
  dotColor?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  value: string;
  options: CustomDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minWidth?: string;
  width?: string;
}

export function CustomDropdown({
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  disabled = false,
  minWidth = '140px',
  width = '100%',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

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

  const activeColor = selectedOption?.color || (selectedOption?.value ? 'var(--foreground)' : 'var(--muted-foreground)');
  const activeBg = selectedOption?.bgColor || (selectedOption?.value ? 'var(--surface-elevated)' : 'var(--surface)');
  const activeBorder = selectedOption?.borderColor || (selectedOption?.value ? 'var(--border)' : 'var(--border)');
  const dotColor = selectedOption?.dotColor || (selectedOption?.value ? '#3B82F6' : 'var(--muted-foreground)');

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width, minWidth }}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          width: '100%',
          height: '36px',
          padding: '0.45rem 0.75rem',
          borderRadius: 'var(--radius-md)',
          background: activeBg,
          border: `1px solid ${activeBorder}`,
          color: activeColor,
          fontSize: '0.82rem',
          fontWeight: selectedOption?.value ? 600 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          transition: 'var(--transition)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              flexShrink: 0,
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            opacity: 0.8,
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
            minWidth: '170px',
            maxHeight: '240px',
            overflowY: 'auto',
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            padding: '0.3rem',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isOptionDisabled = !!opt.disabled;
            const itemDot = opt.dotColor || (opt.value ? '#3B82F6' : 'var(--muted-foreground)');

            return (
              <button
                key={opt.value}
                type="button"
                disabled={isOptionDisabled}
                onClick={() => {
                  if (isOptionDisabled) return;
                  setIsOpen(false);
                  onChange(opt.value);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? `1px solid ${opt.borderColor || 'var(--primary)'}` : '1px solid transparent',
                  background: isSelected ? (opt.bgColor || 'var(--info-subtle)') : 'transparent',
                  color: isOptionDisabled ? 'var(--muted-foreground)' : (opt.color || (isSelected ? 'var(--primary)' : 'var(--foreground)')),
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 600 : 500,
                  cursor: isOptionDisabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isOptionDisabled) {
                    e.currentTarget.style.background = 'var(--secondary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isOptionDisabled) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: isOptionDisabled ? '#64748b' : itemDot,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
                </div>
                {isSelected && <Check size={14} style={{ color: itemDot, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
