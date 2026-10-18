'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { CustomDropdown, CustomDropdownOption } from '@/components/ui/CustomDropdown';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialData?: any;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
}

const STATUS_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'BACKLOG', label: 'Backlog', dotColor: '#64748b', color: '#475569', bgColor: '#f1f5f9', borderColor: '#cbd5e1' },
  { value: 'OPEN', label: 'Open', dotColor: '#2563eb', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#d97706', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
  { value: 'DONE', label: 'Done', dotColor: '#16a34a', color: '#16a34a', bgColor: '#f0fdf4', borderColor: '#bbf7d0' },
];

const PRIORITY_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'LOW', label: 'Low', dotColor: '#64748b', color: '#475569', bgColor: '#f1f5f9', borderColor: '#cbd5e1' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#2563eb', color: '#2563eb', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
  { value: 'HIGH', label: 'High', dotColor: '#d97706', color: '#d97706', bgColor: '#fffbeb', borderColor: '#fde68a' },
  { value: 'CRITICAL', label: 'Critical', dotColor: '#dc2626', color: '#dc2626', bgColor: '#fef2f2', borderColor: '#fca5a5' },
];

function parseToDateTimeValue(dateInput?: string | null, fallbackTime?: string): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  const timeStr = hh === '00' && min === '00' && fallbackTime ? fallbackTime : `${hh}:${min}`;
  return `${yyyy}-${mm}-${dd}T${timeStr}`;
}

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
    const uncategorizedCat = categories.find((c) => c.name === 'Uncategorized');
    const defaultCatId = uncategorizedCat ? String(uncategorizedCat.id) : '';

    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setStatus(initialData.status || 'BACKLOG');
      setPriority(initialData.priority || 'MEDIUM');
      setAssigneeId(initialData.assigneeId ? String(initialData.assigneeId) : '');
      setCategoryId(initialData.categoryId ? String(initialData.categoryId) : defaultCatId);
      setTags(initialData.tags || '');

      setStartDate(initialData.startDate ? parseToDateTimeValue(initialData.startDate, '09:00') : '');
      setDueDate(initialData.dueDate ? parseToDateTimeValue(initialData.dueDate, '17:00') : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('BACKLOG');
      setPriority('MEDIUM');
      setAssigneeId('');
      setCategoryId(defaultCatId);
      setTags('');
      setStartDate('');
      setDueDate('');
    }
    setError(null);
  }, [initialData, isOpen, categories]);

  if (!isOpen) return null;

  const isTaskDone = Boolean(initialData?.status === 'DONE' || initialData?.status === 'CLOSED' || initialData?.isLocked);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isTaskDone) {
      setError('Task yang telah selesai tidak dapat diubah atau dihapus.');
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

    let fullStartDate: string | null = null;
    if (startDate) {
      fullStartDate = new Date(startDate).toISOString();
    }

    let fullDueDate: string | null = null;
    if (dueDate) {
      fullDueDate = new Date(dueDate).toISOString();
    }

    if (fullStartDate && fullDueDate && new Date(fullDueDate) < new Date(fullStartDate)) {
      setError('Tanggal & jam deadline (End Date) tidak boleh lebih awal dari Start Date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const uncategorizedCat = categories.find((c) => c.name === 'Uncategorized');

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        categoryId: categoryId || (uncategorizedCat ? String(uncategorizedCat.id) : null),
        tags: tags.trim() || null,
        startDate: fullStartDate,
        dueDate: fullDueDate,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uncategorizedCat = categories.find((c) => c.name === 'Uncategorized');
  const uncategorizedId = uncategorizedCat ? String(uncategorizedCat.id) : '';

  const categoryOptions: CustomDropdownOption[] = [
    { value: uncategorizedId, label: 'Uncategorized', dotColor: '#94a3b8' },
    ...categories
      .filter((c) => c.name !== 'Uncategorized')
      .map((c) => ({
        value: String(c.id),
        label: c.name,
        dotColor: '#3b82f6',
      })),
  ];

  const assigneeOptions: CustomDropdownOption[] = [
    { value: '', label: 'Pilih Assignee', dotColor: '#94a3b8' },
    ...users.map((u) => ({
      value: String(u.id),
      label: u.name,
      dotColor: '#06b6d4',
    })),
  ];

  return (
    <div className={`${styles.modalOverlay} ${styles.taskModalOverlay}`} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.taskModalContent}`} onClick={(e) => e.stopPropagation()}>
        <div className={`${styles.modalHeader} ${styles.taskModalHeader}`}>
          <h3 className={styles.modalTitle}>
            {initialData ? `Edit Task ${initialData.taskNumber || ''}` : 'Buat Task Baru'}
          </h3>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formScrollContainer}>
          <div className={styles.formBody}>
            {isTaskDone && (
              <div className={styles.lockedBanner}>
                <span className={`${styles.badge} ${styles.statusDone}`}>Done</span>
                <span>Task yang telah selesai tidak dapat diedit atau dihapus.</span>
              </div>
            )}

            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'hsla(350, 90%, 55%, 0.15)',
                  border: '1px solid hsla(350, 90%, 55%, 0.3)',
                  color: 'hsl(350, 95%, 85%)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                {error}
              </div>
            )}

            <div className={styles.formGroupFull}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Judul Task *</label>
                <span className={`${styles.charCounter} ${title.length >= 70 ? styles.charCounterMax : ''}`}>
                  {title.length}/70
                </span>
              </div>
              <input
                type="text"
                placeholder="Contoh: Implementasi fitur otentikasi dua faktor"
                maxLength={70}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 70))}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Deskripsi *</label>
              <RichTextEditor
                value={description}
                onChange={(val) => setDescription(val)}
                placeholder="Jelaskan kebutuhan, ruang lingkup, atau langkah pengerjaan task..."
                disabled={isSubmitting || isTaskDone}
                required
              />
            </div>

            {/* Row 1: Status Workflow (left) & Prioritas (right) */}
            <div className={styles.formRowTwoCols}>
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
            </div>

            {/* Row 2: Kategori (left) & Penugasan (Assignee) (right) */}
            <div className={styles.formRowTwoCols}>
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
            </div>

            {/* Row 3: Start Date & Time and End Date & Time */}
            <div className={styles.formRowTwoCols}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Start Date & Time</label>
                <DateTimePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  defaultTime="09:00"
                  placeholder="Pilih Tanggal & Jam Mulai"
                  disabled={isSubmitting || isTaskDone}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>End Date & Time</label>
                <DateTimePicker
                  value={dueDate}
                  onChange={(val) => setDueDate(val)}
                  defaultTime="17:00"
                  minDate={startDate ? startDate.substring(0, 10) : undefined}
                  placeholder="Pilih Tanggal & Jam Selesai"
                  disabled={isSubmitting || isTaskDone}
                />
              </div>
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
          </div>

          <div className={`${styles.modalFooter} ${styles.modalFooterCompact}`}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCancelBtn}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.modalSubmitBtn}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              <Check size={15} />
              {isSubmitting ? 'Menyimpan...' : initialData ? 'Perbarui Task' : 'Simpan Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
