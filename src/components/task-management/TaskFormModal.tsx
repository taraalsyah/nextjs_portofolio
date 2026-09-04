'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';
import { CustomDropdown, CustomDropdownOption } from '@/components/ui/CustomDropdown';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
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
  { value: 'BACKLOG', label: 'Backlog', dotColor: '#94a3b8', color: 'hsl(215, 20%, 85%)', bgColor: 'hsla(215, 20%, 65%, 0.15)', borderColor: 'hsla(215, 20%, 65%, 0.3)' },
  { value: 'OPEN', label: 'Open', dotColor: '#38bdf8', color: 'hsl(210, 90%, 82%)', bgColor: 'hsla(210, 90%, 65%, 0.15)', borderColor: 'hsla(210, 90%, 65%, 0.3)' },
  { value: 'IN_PROGRESS', label: 'In Progress', dotColor: '#f59e0b', color: 'hsl(38, 95%, 80%)', bgColor: 'hsla(38, 95%, 55%, 0.18)', borderColor: 'hsla(38, 95%, 55%, 0.35)' },
  { value: 'DONE', label: 'Done', dotColor: '#10b981', color: 'hsl(145, 80%, 78%)', bgColor: 'hsla(145, 80%, 45%, 0.15)', borderColor: 'hsla(145, 80%, 45%, 0.3)' },
];

const PRIORITY_FORM_OPTIONS: CustomDropdownOption[] = [
  { value: 'LOW', label: 'Low', dotColor: '#38bdf8', color: 'hsl(210, 90%, 80%)', bgColor: 'hsla(210, 80%, 55%, 0.12)', borderColor: 'hsla(210, 80%, 55%, 0.25)' },
  { value: 'MEDIUM', label: 'Medium', dotColor: '#f59e0b', color: 'hsl(38, 95%, 80%)', bgColor: 'hsla(38, 90%, 55%, 0.15)', borderColor: 'hsla(38, 90%, 55%, 0.25)' },
  { value: 'HIGH', label: 'High', dotColor: '#f97316', color: 'hsl(15, 95%, 80%)', bgColor: 'hsla(15, 90%, 60%, 0.18)', borderColor: 'hsla(15, 90%, 60%, 0.3)' },
  { value: 'CRITICAL', label: 'Critical', dotColor: '#f43f5e', color: 'hsl(350, 95%, 82%)', bgColor: 'hsla(350, 90%, 60%, 0.2)', borderColor: 'hsla(350, 90%, 60%, 0.35)' },
];

function parseDateParts(dateInput?: string | null): { dateStr: string; timeStr: string } {
  if (!dateInput) return { dateStr: '', timeStr: '' };
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return { dateStr: '', timeStr: '' };

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');

  return {
    dateStr: `${yyyy}-${mm}-${dd}`,
    timeStr: `${hh}:${min}`,
  };
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
  const [startTime, setStartTime] = useState('09:00');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
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

      const startParts = parseDateParts(initialData.startDate);
      setStartDate(startParts.dateStr);
      setStartTime(startParts.timeStr || '09:00');

      const dueParts = parseDateParts(initialData.dueDate);
      setDueDate(dueParts.dateStr);
      setDueTime(dueParts.timeStr || '17:00');
    } else {
      setTitle('');
      setDescription('');
      setStatus('BACKLOG');
      setPriority('MEDIUM');
      setAssigneeId('');
      setCategoryId('');
      setTags('');
      setStartDate('');
      setStartTime('09:00');
      setDueDate('');
      setDueTime('17:00');
    }
    setError(null);
  }, [initialData, isOpen]);

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
      const timeComp = startTime || '09:00';
      fullStartDate = new Date(`${startDate}T${timeComp}:00`).toISOString();
    }

    let fullDueDate: string | null = null;
    if (dueDate) {
      const timeComp = dueTime || '17:00';
      fullDueDate = new Date(`${dueDate}T${timeComp}:00`).toISOString();
    }

    if (fullStartDate && fullDueDate && new Date(fullDueDate) < new Date(fullStartDate)) {
      setError('Tanggal & jam deadline (Due Date) tidak boleh lebih awal dari Start Date.');
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

  const categoryOptions: CustomDropdownOption[] = [
    { value: '', label: 'Pilih Kategori', dotColor: '#94a3b8' },
    ...categories.map((c) => ({
      value: String(c.id),
      label: c.name,
      dotColor: '#3b82f6',
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

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Status Workflow</label>
              <CustomDropdown
                value={status}
                options={STATUS_FORM_OPTIONS}
                onChange={(val) => setStatus(val)}
                disabled={isSubmitting}
                minWidth="100%"
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Prioritas</label>
              <CustomDropdown
                value={priority}
                options={PRIORITY_FORM_OPTIONS}
                onChange={(val) => setPriority(val)}
                disabled={isSubmitting}
                minWidth="100%"
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Kategori</label>
              <CustomDropdown
                value={categoryId}
                options={categoryOptions}
                onChange={(val) => setCategoryId(val)}
                disabled={isSubmitting}
                minWidth="100%"
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Penugasan (Assignee)</label>
              <CustomDropdown
                value={assigneeId}
                options={assigneeOptions}
                onChange={(val) => setAssigneeId(val)}
                disabled={isSubmitting}
                minWidth="100%"
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Start Date & Jam Mulai</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 115px', gap: '0.5rem' }}>
                <DatePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="Pilih Tanggal Mulai"
                  disabled={isSubmitting || isTaskDone}
                />
                <TimePicker
                  value={startTime}
                  onChange={(val) => setStartTime(val)}
                  placeholder="09:00"
                  disabled={isSubmitting || isTaskDone}
                />
              </div>
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Due Date & Jam Tenggat (Deadline)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 115px', gap: '0.5rem' }}>
                <DatePicker
                  value={dueDate}
                  onChange={(val) => setDueDate(val)}
                  minDate={startDate || undefined}
                  placeholder="Pilih Tanggal Tenggat"
                  disabled={isSubmitting || isTaskDone}
                />
                <TimePicker
                  value={dueTime}
                  onChange={(val) => setDueTime(val)}
                  placeholder="17:00"
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

          <div className={styles.modalFooter}>
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
              <Check size={16} />
              {isSubmitting ? 'Menyimpan...' : initialData ? 'Perbarui Task' : 'Simpan Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
