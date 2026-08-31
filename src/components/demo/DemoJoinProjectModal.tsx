'use client';

import React, { useState } from 'react';
import { X, UserPlus, Key } from 'lucide-react';
import styles from './demo.module.css';

interface DemoJoinProjectModalProps {
  onClose: () => void;
  onJoined: (code: string) => void;
}

export const DemoJoinProjectModal: React.FC<DemoJoinProjectModalProps> = ({
  onClose,
  onJoined,
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Masukkan kode undangan proyek terlebih dahulu.');
      return;
    }
    onJoined(code.trim());
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
            <UserPlus size={20} color="#0284c7" /> Join Proyek via Code
          </h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Kode Undangan Proyek</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Contoh: PRJ-99201"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
              />
              <Key size={16} color="#94a3b8" style={{ position: 'absolute', right: 12, top: 12 }} />
            </div>
            {error && <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.35rem' }}>{error}</div>}
          </div>

          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '0.75rem', fontSize: '0.8rem', color: '#0369a1', marginBottom: '1.25rem' }}>
            💡 Masukkan kode proyek demo (e.g. <code>PRJ-DEMO</code>) untuk melakukan simulasi bergabung ke dalam workspace team.
          </div>

          <div className={styles.formFooter}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className={styles.primaryBlueBtn} style={{ background: '#0284c7' }}>
              Join Proyek
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DemoJoinProjectModal;
