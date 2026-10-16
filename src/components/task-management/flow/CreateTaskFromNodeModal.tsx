'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus } from 'lucide-react';
import { AppNode } from '@/types/flow';
import styles from './flowComponents.module.css';

interface CreateTaskFromNodeModalProps {
  isOpen: boolean;
  node: AppNode | null;
  onClose: () => void;
  onSuccess: (nodeId: string, createdTask: any) => void;
  categories: { id: number; name: string }[];
  users: { id: number; name: string }[];
  activeProjectId?: number;
}

export function CreateTaskFromNodeModal({
  isOpen,
  node,
  onClose,
  onSuccess,
  categories,
  users,
  activeProjectId,
}: CreateTaskFromNodeModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [categoryId, setCategoryId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (node) {
      setTitle(node.data?.label || '');
      setDescription(`Task dibuat secara otomatis dari diagram alur: "${node.data?.label || ''}"`);
      setErrorMsg(null);
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Judul task wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: Record<string, any> = {
        title: title.trim(),
        priority,
        status: 'OPEN',
        description: description.trim() || title.trim(),
        projectId: activeProjectId,
      };

      if (categoryId) payload.categoryId = parseInt(categoryId, 10);
      if (assigneeId) payload.assigneeId = parseInt(assigneeId, 10);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Gagal membuat task proyek.');
      }

      const data = await res.json();
      onSuccess(node.id, data.task || data);
      onClose();
    } catch (err: any) {
      console.error('Failed to create task from node:', err);
      setErrorMsg(err?.message || 'Terjadi kesalahan saat membuat task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckSquare size={18} color="var(--primary)" />
              <div className={styles.modalTitle}>Buat Task Proyek dari Node</div>
            </div>
            <button type="button" className={styles.toolbarBtn} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.modalBody}>
            {errorMsg && (
              <div style={{ color: 'var(--error)', fontSize: 13, background: 'var(--error-subtle)', padding: '8px 12px', borderRadius: 6 }}>
                {errorMsg}
              </div>
            )}

            <div className={styles.propSection}>
              <label className={styles.propLabel}>Judul Task *</label>
              <input
                type="text"
                className={styles.propInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Judul task..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className={styles.propSection}>
                <label className={styles.propLabel}>Prioritas</label>
                <select
                  className={styles.propInput}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className={styles.propSection}>
                <label className={styles.propLabel}>Kategori</label>
                <select
                  className={styles.propInput}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">-- Tanpa Kategori --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.propSection}>
              <label className={styles.propLabel}>Penerima Tugas (Assignee)</label>
              <select
                className={styles.propInput}
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">-- Belum Ditugaskan --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.propSection}>
              <label className={styles.propLabel}>Deskripsi</label>
              <textarea
                className={styles.propInput}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.backBtn} onClick={onClose} disabled={isSubmitting}>
              Batal
            </button>
            <button
              type="submit"
              className={styles.backBtn}
              style={{
                background: 'var(--primary)',
                color: '#ffffff',
                borderColor: 'var(--primary-hover)',
                fontWeight: 600,
              }}
              disabled={isSubmitting}
            >
              <Plus size={14} />
              <span>{isSubmitting ? 'Membuat...' : 'Buat & Tautkan Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
