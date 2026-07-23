'use client';

import React, { useState } from 'react';
import { X, FolderPlus, Check } from 'lucide-react';
import styles from './project.module.css';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM'>('PRIVATE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!projectName.trim()) {
      setError('Nama proyek wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectName.trim(),
          description: description.trim() || null,
          visibility,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal membuat proyek baru.');
      }

      setProjectName('');
      setDescription('');
      setVisibility('PRIVATE');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat proyek.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FolderPlus size={20} style={{ color: '#38bdf8' }} />
            Buat Proyek Baru
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Nama Proyek *</label>
              <input
                type="text"
                placeholder="Contoh: Redesign Aplikasi Mobile"
                maxLength={100}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Deskripsi Proyek</label>
              <textarea
                placeholder="Jelaskan tujuan atau ruang lingkup proyek ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tingkat Visibilitas</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                className={styles.select}
              >
                <option value="PRIVATE">PRIVATE (Hanya Saya & Anggota yang Diundang)</option>
                <option value="TEAM">TEAM (Dapat Diakses Seluruh Tim)</option>
              </select>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              <Check size={16} />
              {isSubmitting ? 'Membuat...' : 'Simpan Proyek'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
