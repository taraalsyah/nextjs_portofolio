'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

interface TaskFilterBarProps {
  onFilterChange: (filters: Record<string, string>) => void;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
  initialFilters?: Record<string, string>;
  hideAssigneeFilter?: boolean;
}

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

  return (
    <div className={styles.filterBar}>
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

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="">Semua Status</option>
        <option value="BACKLOG">Backlog</option>
        <option value="OPEN">Open</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="DONE">Done</option>
      </select>

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="">Semua Prioritas</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="CRITICAL">Critical</option>
      </select>

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="">Semua Kategori</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {!hideAssigneeFilter && (
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Semua Assignee</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={`${sortBy}-${sortOrder}`}
        onChange={(e) => {
          const [by, order] = e.target.value.split('-');
          setSortBy(by);
          setSortOrder(order);
        }}
        className={styles.filterSelect}
      >
        <option value="createdAt-desc">Terbaru</option>
        <option value="createdAt-asc">Terlama</option>
        <option value="dueDate-asc">Deadline Terdekat</option>
        <option value="dueDate-desc">Deadline Terjauh</option>
        <option value="priority-desc">Prioritas Tertinggi</option>
      </select>

      {hasActiveFilters && (
        <button onClick={handleReset} className={styles.clearFilterBtn}>
          <X size={14} />
          Reset Filter
        </button>
      )}
    </div>
  );
}
