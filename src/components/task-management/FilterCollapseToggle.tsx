'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

interface FilterCollapseToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}

export function FilterCollapseToggle({
  isOpen,
  onToggle,
  controlsId,
}: FilterCollapseToggleProps) {
  const label = isOpen ? 'Sembunyikan filter' : 'Tampilkan filter';

  return (
    <div className={styles.filterDivider}>
      <button
        type="button"
        onClick={onToggle}
        className={styles.filterToggleBtn}
        aria-expanded={isOpen}
        aria-controls={controlsId}
        aria-label={label}
        title={label}
      >
        <ChevronDown
          size={16}
          className={`${styles.filterToggleIcon} ${isOpen ? styles.filterToggleIconOpen : ''}`}
        />
      </button>
    </div>
  );
}
