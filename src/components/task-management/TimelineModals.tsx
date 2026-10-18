'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, FolderPlus, Layers, Trash2, Edit3 } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description?: string }) => Promise<void>;
  initialData?: { id?: number; name?: string; description?: string | null } | null;
}

export function ProjectModal({ isOpen, onClose, onSubmit, initialData }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
    } else {
      setName('');
      setDescription('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setError('Nama Proyek / Fitur wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({ name: name.trim(), description: description.trim() || undefined });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan proyek/fitur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.modalOverlay} ${styles.taskModalOverlay}`} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.taskModalContent}`}
        style={{ maxWidth: '480px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.modalHeader} ${styles.taskModalHeader}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FolderPlus size={18} style={{ color: 'var(--primary)' }} />
            <h3 className={styles.modalTitle}>
              {initialData?.id ? 'Edit Proyek / Fitur' : 'Buat Proyek / Fitur Baru'}
            </h3>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formScrollContainer}>
          <div className={styles.formBody}>
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'hsla(350, 90%, 55%, 0.15)',
                  border: '1px solid hsla(350, 90%, 55%, 0.3)',
                  color: 'hsl(350, 95%, 85%)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Nama Proyek / Fitur *</label>
              <input
                type="text"
                placeholder="Contoh: CR ADAi ReachME to Support Upgrade OS 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                maxLength={200}
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Deskripsi (Opsional)</label>
              <textarea
                placeholder="Penjelasan ringkas tujuan proyek/fitur ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.input}
                style={{ minHeight: '80px', resize: 'vertical' }}
              />
            </div>
          </div>

          <div className={`${styles.modalFooter} ${styles.modalFooterCompact}`}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.cancelBtn} ${styles.btnCompact}`}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.btnCompact}`}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Menyimpan...' : initialData?.id ? 'Perbarui Proyek' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface PhaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  initialData?: { id?: number; name?: string } | null;
  projectName?: string;
}

export function PhaseModal({ isOpen, onClose, onSubmit, initialData, projectName }: PhaseModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
    } else {
      setName('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!name.trim()) {
      setError('Nama Phase wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan phase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.modalOverlay} ${styles.taskModalOverlay}`} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.taskModalContent}`}
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.modalHeader} ${styles.taskModalHeader}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 className={styles.modalTitle}>
                {initialData?.id ? 'Edit Phase' : 'Buat Phase Baru'}
              </h3>
              {projectName && (
                <p style={{ fontSize: '0.72rem', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                  Proyek: {projectName}
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.formScrollContainer}>
          <div className={styles.formBody}>
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'hsla(350, 90%, 55%, 0.15)',
                  border: '1px solid hsla(350, 90%, 55%, 0.3)',
                  color: 'hsl(350, 95%, 85%)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <div className={styles.formGroupFull}>
              <label className={styles.label}>Nama Phase *</label>
              <input
                type="text"
                placeholder="Contoh: Sprint 1, Tahap UAT, Discovery"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.input}
                maxLength={100}
                required
                autoFocus
              />
            </div>
          </div>

          <div className={`${styles.modalFooter} ${styles.modalFooterCompact}`}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.cancelBtn} ${styles.btnCompact}`}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={`${styles.submitBtn} ${styles.btnCompact}`}
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'Menyimpan...' : initialData?.id ? 'Perbarui Phase' : 'Simpan Phase'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  warningNote?: string;
  confirmText?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningNote,
  confirmText = 'Hapus',
}: ConfirmDeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${styles.modalOverlay} ${styles.taskModalOverlay}`} onClick={onClose}>
      <div
        className={`${styles.modalContent} ${styles.taskModalContent}`}
        style={{ maxWidth: '440px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`${styles.modalHeader} ${styles.taskModalHeader}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>
              {title}
            </h3>
          </div>
          <button type="button" onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.formScrollContainer}>
          <div className={styles.formBody}>
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: 'hsla(350, 90%, 55%, 0.15)',
                  border: '1px solid hsla(350, 90%, 55%, 0.3)',
                  color: 'hsl(350, 95%, 85%)',
                  fontSize: '0.85rem',
                }}
              >
                {error}
              </div>
            )}

            <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', lineHeight: 1.5 }}>
              {message}
            </p>

            {warningNote && (
              <div className={styles.deleteWarningBox}>
                {warningNote}
              </div>
            )}
          </div>

          <div className={`${styles.modalFooter} ${styles.modalFooterCompact}`}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.cancelBtn} ${styles.btnCompact}`}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className={`${styles.cancelBtn} ${styles.btnCompact}`}
              style={{
                background: '#ef4444',
                color: 'white',
                border: '1px solid #dc2626',
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
