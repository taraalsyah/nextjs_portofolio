'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import styles from './project.module.css';

interface JoinProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectJoined?: () => void;
}

export function JoinProjectModal({
  isOpen,
  onClose,
  onProjectJoined,
}: JoinProjectModalProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isOpen || !isMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();

    if (!cleanCode) {
      setError('Invite Code wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/projects/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: cleanCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal bergabung ke proyek.');
      }

      setSuccessMsg(data.message || 'Berhasil bergabung ke proyek!');
      setInviteCode('');
      
      setTimeout(() => {
        onProjectJoined?.();
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Gagal bergabung ke proyek.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(265, 90%, 80%)',
              }}
            >
              <UserPlus size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle} style={{ margin: 0 }}>Join Project</h3>
              <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'hsla(0,0%,100%,0.5)' }}>
                Bergabung ke proyek menggunakan Invite Code
              </p>
            </div>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'hsla(145, 80%, 45%, 0.15)',
                  border: '1px solid hsla(145, 80%, 45%, 0.3)',
                  color: 'hsl(145, 80%, 85%)',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Key size={13} style={{ color: 'var(--secondary)' }} />
                Invite Code
              </label>
              <input
                type="text"
                placeholder="Contoh: PM-7KQ9-XR8P"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className={styles.input}
                style={{
                  marginTop: '0.2rem',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  padding: '0.65rem',
                }}
                required
                disabled={isSubmitting}
              />
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: 'hsla(0,0%,100%,0.45)', lineHeight: 1.4 }}>
                Minta kode akses ini kepada Owner atau Admin proyek yang ingin Anda ikuti.
              </p>
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
              disabled={isSubmitting || !inviteCode.trim()}
              style={{ opacity: isSubmitting || !inviteCode.trim() ? 0.6 : 1 }}
            >
              <UserPlus size={16} />
              {isSubmitting ? 'Memproses...' : 'Join Project'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
