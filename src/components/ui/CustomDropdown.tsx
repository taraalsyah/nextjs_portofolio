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

  const activeColor = selectedOption?.color || (selectedOption?.value ? 'hsl(265, 90%, 90%)' : 'hsla(0, 0%, 100%, 0.7)');
  const activeBg = selectedOption?.bgColor || (selectedOption?.value ? 'var(--primary-glow)' : 'var(--bg-color)');
  const activeBorder = selectedOption?.borderColor || (selectedOption?.value ? 'hsla(265, 80%, 60%, 0.5)' : 'var(--glass-border)');
  const dotColor = selectedOption?.dotColor || (selectedOption?.value ? '#38bdf8' : 'hsla(0, 0%, 100%, 0.3)');

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
          height: '40px',
          padding: '0.45rem 0.75rem',
          borderRadius: '8px',
          background: activeBg,
          border: `1px solid ${activeBorder}`,
          color: activeColor,
          fontSize: '0.82rem',
          fontWeight: selectedOption?.value ? 600 : 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.7 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen
            ? `0 0 0 2px ${activeBorder}, 0 4px 14px rgba(0, 0, 0, 0.35)`
            : '0 2px 6px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: dotColor,
              boxShadow: selectedOption?.value ? `0 0 6px ${dotColor}` : 'none',
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
            transition: 'transform 0.2s ease',
            opacity: 0.8,
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            width: '100%',
            minWidth: '170px',
            maxHeight: '240px',
            overflowY: 'auto',
            background: '#0f172a',
            border: '1px solid var(--glass-border)',
            borderRadius: '10px',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px hsla(0, 0%, 100%, 0.08)',
            padding: '0.35rem',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isOptionDisabled = !!opt.disabled;
            const itemDot = opt.dotColor || (opt.value ? '#38bdf8' : 'hsla(0, 0%, 100%, 0.3)');

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
                  borderRadius: '6px',
                  border: isSelected ? `1px solid ${opt.borderColor || 'hsla(265, 80%, 60%, 0.4)'}` : '1px solid transparent',
                  background: isSelected ? (opt.bgColor || 'var(--primary-glow)') : 'transparent',
                  color: isOptionDisabled ? 'hsla(0, 0%, 100%, 0.35)' : (opt.color || (isSelected ? 'hsl(265, 90%, 90%)' : 'var(--fg-color)')),
                  fontSize: '0.8rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: isOptionDisabled ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isOptionDisabled) {
                    e.currentTarget.style.background = 'hsla(0, 0%, 100%, 0.06)';
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
