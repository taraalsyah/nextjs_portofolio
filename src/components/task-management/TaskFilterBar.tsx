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
  { value: '', label: 'Semua Status', dotColor: '#94a3b8' },
  { value: 'BACKLOG', label: 'Backlog', dotColor: '#64748b', color: '#475569', bgColor: '#f1f5f9', borderColor: '#cbd5e1' },
  { value: 'OPEN', label: 'Open', dotColor: '#2563eb', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#d97706', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
  { value: 'DONE', label: 'Done', dotColor: '#16a34a', color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0' },
];

const PRIORITY_FILTER_OPTIONS: CustomDropdownOption[] = [
  { value: '', label: 'Semua Priority', dotColor: '#94a3b8' },
  { value: 'LOW', label: 'Low', dotColor: '#64748b', color: '#475569', bgColor: '#f1f5f9', borderColor: '#cbd5e1' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#2563eb', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
  { value: 'HIGH', label: 'High', dotColor: '#d97706', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
  { value: 'CRITICAL', label: 'Critical', dotColor: '#dc2626', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fca5a5' },
];

const SORT_FILTER_OPTIONS: CustomDropdownOption[] = [
  { value: 'createdAt-desc', label: 'Terbaru (Default)', dotColor: '#2563eb' },
  { value: 'createdAt-asc', label: 'Terlama', dotColor: '#64748b' },
  { value: 'dueDate-asc', label: 'Deadline Terdekat', dotColor: '#d97706' },
  { value: 'dueDate-desc', label: 'Deadline Terjauh', dotColor: '#2563eb' },
  { value: 'priority-desc', label: 'Prioritas Tertinggi', dotColor: '#dc2626' },
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
      dotColor: '#3b82f6',
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
