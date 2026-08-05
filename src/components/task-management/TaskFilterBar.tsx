'use client';

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { CustomDropdown, CustomDropdownOption } from '@/components/ui/CustomDropdown';

interface TaskFilterBarProps {
  onFilterChange: (filters: Record<string, string>) => void;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
  initialFilters?: Record<string, string>;
  hideAssigneeFilter?: boolean;
}

const STATUS_FILTER_OPTIONS: CustomDropdownOption[] = [
  { value: '', label: 'Semua Status', dotColor: 'hsla(0, 0%, 100%, 0.4)' },
  { value: 'BACKLOG', label: 'Backlog', dotColor: '#94a3b8', color: 'hsl(215, 20%, 85%)', bgColor: 'hsla(215, 20%, 65%, 0.15)', borderColor: 'hsla(215, 20%, 65%, 0.3)' },
  { value: 'OPEN', label: 'Open', dotColor: '#38bdf8', color: 'hsl(210, 90%, 82%)', bgColor: 'hsla(210, 90%, 65%, 0.15)', borderColor: 'hsla(210, 90%, 65%, 0.3)' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#f59e0b', color: 'hsl(38, 95%, 80%)', bgColor: 'hsla(38, 95%, 55%, 0.18)', borderColor: 'hsla(38, 95%, 55%, 0.35)' },
  { value: 'DONE', label: 'Done', dotColor: '#10b981', color: 'hsl(145, 80%, 78%)', bgColor: 'hsla(145, 80%, 45%, 0.15)', borderColor: 'hsla(145, 80%, 45%, 0.3)' },
];

const PRIORITY_FILTER_OPTIONS: CustomDropdownOption[] = [
  { value: '', label: 'Semua Priority', dotColor: 'hsla(0, 0%, 100%, 0.4)' },
  { value: 'LOW', label: 'Low', dotColor: '#38bdf8', color: 'hsl(210, 90%, 80%)', bgColor: 'hsla(210, 80%, 55%, 0.12)', borderColor: 'hsla(210, 80%, 55%, 0.25)' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#f59e0b', color: 'hsl(38, 95%, 80%)', bgColor: 'hsla(38, 90%, 55%, 0.15)', borderColor: 'hsla(38, 90%, 55%, 0.25)' },
  { value: 'HIGH', label: 'High', dotColor: '#f97316', color: 'hsl(15, 95%, 80%)', bgColor: 'hsla(15, 90%, 60%, 0.18)', borderColor: 'hsla(15, 90%, 60%, 0.3)' },
  { value: 'CRITICAL', label: 'Critical', dotColor: '#f43f5e', color: 'hsl(350, 95%, 82%)', bgColor: 'hsla(350, 90%, 60%, 0.2)', borderColor: 'hsla(350, 90%, 60%, 0.35)' },
];

const SORT_FILTER_OPTIONS: CustomDropdownOption[] = [
  { value: 'createdAt-desc', label: 'Terbaru (Default)', dotColor: '#38bdf8' },
  { value: 'createdAt-asc', label: 'Terlama', dotColor: '#64748b' },
  { value: 'dueDate-asc', label: 'Deadline Terdekat', dotColor: '#f59e0b' },
  { value: 'dueDate-desc', label: 'Deadline Terjauh', dotColor: '#a855f7' },
  { value: 'priority-desc', label: 'Prioritas Tertinggi', dotColor: '#f43f5e' },
];

export function TaskFilterBar({
  onFilterChange,
  categories,
  users,
  initialFilters = {},
  hideAssigneeFilter = false,
}: TaskFilterBarProps) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [status, setStatus] = useState(initialFilters.status || '');
  const [priority, setPriority] = useState(initialFilters.priority || '');
  const [categoryId, setCategoryId] = useState(initialFilters.categoryId || '');
  const [assigneeId, setAssigneeId] = useState(initialFilters.assigneeId || '');
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'createdAt');
  const [sortOrder, setSortOrder] = useState(initialFilters.sortOrder || 'desc');

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterChange({
        search,
        status,
        priority,
        categoryId,
        assigneeId,
        sortBy,
        sortOrder,
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [search, status, priority, categoryId, assigneeId, sortBy, sortOrder]);

  const handleReset = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategoryId('');
    setAssigneeId('');
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    search || status || priority || categoryId || assigneeId || sortBy !== 'createdAt' || sortOrder !== 'desc';

  const categoryOptions: CustomDropdownOption[] = [
    { value: '', label: 'Semua Category', dotColor: 'hsla(0, 0%, 100%, 0.4)' },
    ...categories.map((c) => ({
      value: String(c.id),
      label: c.name,
      dotColor: '#a855f7',
    })),
  ];

  const assigneeOptions: CustomDropdownOption[] = [
    { value: '', label: 'Semua Assignee', dotColor: 'hsla(0, 0%, 100%, 0.4)' },
    ...users.map((u) => ({
      value: String(u.id),
      label: u.name,
      dotColor: '#06b6d4',
    })),
  ];

  return (
    <div className={styles.filterBar}>
      <div className={`${styles.filterItem} ${styles.filterItemSearch}`}>
        <label className={styles.filterLabel}>Pencarian</label>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Cari nomor task, judul, deskripsi, atau tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <Search size={15} className={styles.searchIcon} />
        </div>
      </div>

      <div className={styles.filterItem}>
        <label className={styles.filterLabel}>Status</label>
        <CustomDropdown
          value={status}
          options={STATUS_FILTER_OPTIONS}
          onChange={(val) => setStatus(val)}
        />
      </div>

      <div className={styles.filterItem}>
        <label className={styles.filterLabel}>Priority</label>
        <CustomDropdown
          value={priority}
          options={PRIORITY_FILTER_OPTIONS}
          onChange={(val) => setPriority(val)}
        />
      </div>

      <div className={styles.filterItem}>
        <label className={styles.filterLabel}>Category</label>
        <CustomDropdown
          value={categoryId}
          options={categoryOptions}
          onChange={(val) => setCategoryId(val)}
        />
      </div>

      {!hideAssigneeFilter && (
        <div className={styles.filterItem}>
          <label className={styles.filterLabel}>Assignee</label>
          <CustomDropdown
            value={assigneeId}
            options={assigneeOptions}
            onChange={(val) => setAssigneeId(val)}
          />
        </div>
      )}

      <div className={styles.filterItem}>
        <label className={styles.filterLabel}>Urutan</label>
        <CustomDropdown
          value={`${sortBy}-${sortOrder}`}
          options={SORT_FILTER_OPTIONS}
          onChange={(val) => {
            const [by, order] = val.split('-');
            setSortBy(by);
            setSortOrder(order);
          }}
        />
      </div>

      {hasActiveFilters && (
        <div className={styles.filterActionItem}>
          <button onClick={handleReset} className={styles.clearFilterBtn}>
            <X size={14} />
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}
