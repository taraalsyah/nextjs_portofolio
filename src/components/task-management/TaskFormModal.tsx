'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => Promise<void>;
  initialData?: any;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

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
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={styles.select}>
              <option value="BACKLOG">Backlog</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Prioritas</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={styles.select}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Kategori</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={styles.select}>
              <option value="">Pilih Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Penugasan (Assignee)</label>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={styles.select}>
              <option value="">Pilih Assignee</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
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
