'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ShieldCheck, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { TERMS_VERSION } from '@/content/terms';
import styles from './termsModal.module.css';

export default function TermsUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/user/terms-status');
      if (res.ok) {
        const data = await res.json();
        if (data.isAccepted === false) {
          setIsOpen(true);
        }
      }
    } catch (err) {
      // Do not block dashboard navigation on fetch error
      console.warn('Failed to check terms agreement status:', err);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleAccept = async () => {
    if (!isAgreed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/user/accept-terms', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menyimpan persetujuan.');
      }

      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="termsModalTitle">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div className={styles.badge}>
            <ShieldCheck size={14} />
            <span>Pembaruan Kebijakan & Ketentuan</span>
          </div>
          <h2 id="termsModalTitle" className={styles.modalTitle}>
            Pembaruan Syarat & Ketentuan Layanan
          </h2>
        </div>

        <div className={styles.modalBody}>
          <p>
            Kami telah memperbarui dokumen <strong>Syarat & Ketentuan Layanan</strong> platform TaskTuntas
            ke versi <strong>{TERMS_VERSION}</strong>. Pembaruan ini mencakup kejelasan mengenai
            penggunaan fitur proyek, gateway transaksi pembayaran digital, dan perlindungan privasi.
          </p>

          <div className={styles.termsBox}>
            <strong>Poin-Poin Utama Pembaruan:</strong>
            <ul>
              <li>Ketentuan verifikasi pembayaran proyek via Payment Gateway resmi.</li>
              <li>Hak kekayaan intelektual atas proyek dan privasi data akun.</li>
              <li>Transparansi kebijakan pengembalian dana (refund) untuk layanan software digital.</li>
            </ul>
          </div>

          <div className={styles.readLinkWrapper}>
            <span>Pelajari dokumen resmi selengkapnya:</span>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.readLink}
            >
              Buka Syarat & Ketentuan <ExternalLink size={14} />
            </Link>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--error)',
              fontSize: '0.825rem',
              background: 'var(--error-subtle)',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid #fca5a5'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.checkboxWrapper}>
            <input
              type="checkbox"
              id="acceptNewTermsCheckbox"
              className={styles.checkbox}
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              disabled={isSubmitting}
            />
            <label htmlFor="acceptNewTermsCheckbox" className={styles.checkboxLabel}>
              Saya telah membaca, memahami, dan menyetujui dokumen Syarat & Ketentuan serta Kebijakan
              Privasi TaskTuntas versi {TERMS_VERSION}.
            </label>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleAccept}
            disabled={!isAgreed || isSubmitting}
          >
            {isSubmitting ? (
              'Menyimpan...'
            ) : (
              <>
                <Check size={16} /> Setuju & Lanjutkan ke Dashboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
