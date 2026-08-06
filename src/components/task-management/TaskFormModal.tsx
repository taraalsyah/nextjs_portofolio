'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { CustomDropdown, CustomDropdownOption } from '@/components/ui/CustomDropdown';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialData?: any;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
}

const STATUS_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'BACKLOG', label: 'Backlog', dotColor: '#94a3b8', color: 'hsl(215, 20%, 85%)', bgColor: 'hsla(215, 20%, 65%, 0.15)', borderColor: 'hsla(215, 20%, 65%, 0.3)' },
  { value: 'OPEN', label: 'Open', dotColor: '#38bdf8', color: 'hsl(210, 90%, 82%)', bgColor: 'hsla(210, 90%, 65%, 0.15)', borderColor: 'hsla(210, 90%, 65%, 0.3)' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#f59e0b', color: 'hsl(38, 95%, 80%)', bgColor: 'hsla(38, 95%, 55%, 0.18)', borderColor: 'hsla(38, 95%, 55%, 0.35)' },
  { value: 'DONE', label: 'Done', dotColor: '#10b981', color: 'hsl(145, 80%, 78%)', bgColor: 'hsla(145, 80%, 45%, 0.15)', borderColor: 'hsla(145, 80%, 45%, 0.3)' },
  { value: 'LOCKED', label: '🔒 Locked', dotColor: '#ef4444', color: 'hsl(0, 85%, 85%)', bgColor: 'hsla(0, 75%, 55%, 0.18)', borderColor: 'hsla(0, 75%, 55%, 0.35)' },
];

const PRIORITY_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'LOW', label: 'Low', dotColor: '#38bdf8', color: 'hsl(210, 90%, 80%)', bgColor: 'hsla(210, 80%, 55%, 0.12)', borderColor: 'hsla(210, 80%, 55%, 0.25)' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#f59e0b', color: 'hsl(38, 95%, 80%)', bgColor: 'hsla(38, 90%, 55%, 0.15)', borderColor: 'hsla(38, 90%, 55%, 0.25)' },
  { value: 'HIGH', label: 'High', dotColor: '#f97316', color: 'hsl(15, 95%, 80%)', bgColor: 'hsla(15, 90%, 60%, 0.18)', borderColor: 'hsla(15, 90%, 60%, 0.3)' },
  { value: 'CRITICAL', label: 'Critical', dotColor: '#f43f5e', color: 'hsl(350, 95%, 82%)', bgColor: 'hsla(350, 90%, 60%, 0.2)', borderColor: 'hsla(350, 90%, 60%, 0.35)' },
];

export function TaskFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  categories,
  users,
}: TaskFormModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('BACKLOG');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'BACKLOG');
      setPriority(initialData.priority || 'MEDIUM');
      setAssigneeId(initialData.assigneeId ? String(initialData.assigneeId) : '');
      setCategoryId(initialData.categoryId ? String(initialData.categoryId) : '');
      setTags(initialData.tags || '');
      setStartDate(initialData.startDate ? initialData.startDate.split('T')[0] : '');
      setDueDate(initialData.dueDate ? initialData.dueDate.split('T')[0] : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('BACKLOG');
      setPriority('MEDIUM');
      setAssigneeId('');
      setCategoryId('');
      setTags('');
      setStartDate('');
      setDueDate('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isTaskLocked = Boolean(initialData?.isLocked || initialData?.status === 'LOCKED');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isTaskLocked) {
      setError('Task telah dikunci dan tidak dapat dimodifikasi.');
      return;
    }

    if (!title.trim()) {
      setError('Judul task wajib diisi.');
      return;
    }
    if (!description.trim()) {
      setError('Deskripsi task wajib diisi.');
      return;
    }
    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setError('Tanggal deadline (Due Date) tidak boleh lebih awal dari Start Date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        categoryId: categoryId || null,
        tags: tags.trim() || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions: CustomDropdownOption[] = [
    { value: '', label: 'Pilih Kategori', dotColor: 'hsla(0, 0%, 100%, 0.4)' },
    ...categories.map((c) => ({
      value: String(c.id),
      label: c.name,
      dotColor: '#a855f7',
    })),
  ];

  const assigneeOptions: CustomDropdownOption[] = [
    { value: '', label: 'Pilih Assignee', dotColor: 'hsla(0, 0%, 100%, 0.4)' },
    ...users.map((u) => ({
      value: String(u.id),
      label: u.name,
      dotColor: '#06b6d4',
    })),
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {initialData ? `Edit Task ${initialData.taskNumber || ''}` : 'Buat Task Baru'}
          </h3>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {isTaskLocked && (
          <div className={styles.lockedBanner}>
            <span className={`${styles.badge} ${styles.statusLocked}`}>🔒 Locked</span>
            <span>Task ini telah dikunci dan bersifat read-only.</span>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              background: 'hsla(350, 90%, 55%, 0.15)',
              border: '1px solid hsla(350, 90%, 55%, 0.3)',
              color: 'hsl(350, 95%, 85%)',
              fontSize: '0.8rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div className={styles.formGroupFull}>
            <label className={styles.label}>Judul Task *</label>
            <input
              type="text"
              placeholder="Contoh: Implementasi fitur otentikasi dua faktor"
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroupFull}>
            <label className={styles.label}>Deskripsi *</label>
            <textarea
              placeholder="Jelaskan kebutuhan, ruang lingkup, atau langkah pengerjaan task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Status Workflow</label>
            <CustomDropdown
              value={status}
              options={STATUS_FORM_OPTIONS}
              onChange={(val) => setStatus(val)}
              disabled={isSubmitting}
              minWidth="100%"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Prioritas</label>
            <CustomDropdown
              value={priority}
              options={PRIORITY_FORM_OPTIONS}
              onChange={(val) => setPriority(val)}
              disabled={isSubmitting}
              minWidth="100%"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Kategori</label>
            <CustomDropdown
              value={categoryId}
              options={categoryOptions}
              onChange={(val) => setCategoryId(val)}
              disabled={isSubmitting}
              minWidth="100%"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Penugasan (Assignee)</label>
            <CustomDropdown
              value={assigneeId}
              options={assigneeOptions}
              onChange={(val) => setAssigneeId(val)}
              disabled={isSubmitting}
              minWidth="100%"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Due Date (Deadline)</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroupFull}>
            <label className={styles.label}>Tags (Pisahkan dengan koma)</label>
            <input
              type="text"
              placeholder="Contoh: frontend, bugfix, api"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.modalFooter} style={{ gridColumn: 'span 2' }}>
            <button
              type="button"
              onClick={onClose}
              className={styles.clearFilterBtn}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.createBtn}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              <Check size={16} />
              {isSubmitting ? 'Menyimpan...' : initialData ? 'Perbarui Task' : 'Simpan Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
