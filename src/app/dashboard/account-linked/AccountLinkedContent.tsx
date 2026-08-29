'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, ShieldCheck, AlertTriangle, CheckCircle2, Info, Unlink, Link2, Loader2, AlertCircle } from 'lucide-react';
import styles from './account-linked.module.css';
import { useSafeToast } from '@/components/ui/Toast';

interface GoogleStatus {
  isLinked: boolean;
  registeredEmail: string;
  linkedEmail: string | null;
  linkedAt: string | null;
}

export default function AccountLinkedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toastCtx = useSafeToast();

  const [statusData, setStatusData] = useState<GoogleStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);
  const [showUnlinkModal, setShowUnlinkModal] = useState<boolean>(false);

  const errorParam = searchParams.get('error');
  const successParam = searchParams.get('success');
  const infoParam = searchParams.get('info');
  const googleEmailParam = searchParams.get('googleEmail');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/google/status');
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
      }
    } catch (e) {
      console.error('Failed to fetch Google link status:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleUnlink = async () => {
    try {
      setIsUnlinking(true);
      const res = await fetch('/api/auth/google/unlink', {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setShowUnlinkModal(false);
        if (toastCtx?.showToast) {
          toastCtx.showToast('Akun Gmail berhasil dilepas (unlinked).', 'success');
        }
        await fetchStatus();
      } else {
        if (toastCtx?.showToast) {
          toastCtx.showToast(data.error || 'Gagal melepas akun Gmail.', 'error');
        }
      }
    } catch (e) {
      console.error('Unlink error:', e);
      if (toastCtx?.showToast) {
        toastCtx.showToast('Terjadi kesalahan saat melepas akun.', 'error');
      }
    } finally {
      setIsUnlinking(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <Link2 size={24} style={{ color: '#60a5fa' }} /> Account Linked
        </h1>
        <p className={styles.pageSubtitle}>
          Kelola koneksi akun Google/Gmail untuk metode login via Google pada akun Anda.
        </p>
      </div>

      {/* Alert Banners based on OAuth Callbacks */}
      {errorParam === 'EmailMismatch' && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <AlertCircle className={styles.bannerIcon} size={20} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerTitle}>This Google account cannot be linked.</div>
            <div>
              The Google account email ({googleEmailParam || 'different email'}) must match the email registered on your account ({statusData?.registeredEmail || 'your registered email'}).
            </div>
          </div>
        </div>
      )}

      {errorParam === 'AlreadyLinkedToOther' && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <AlertCircle className={styles.bannerIcon} size={20} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerTitle}>Google Account Already Linked</div>
            <div>Google account ini sudah terhubung dengan pengguna aplikasi lain.</div>
          </div>
        </div>
      )}

      {(errorParam === 'OAuthCancelled' || errorParam === 'OAuthError' || errorParam === 'TokenExchangeFailed') && (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          <AlertCircle className={styles.bannerIcon} size={20} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerTitle}>Proses Linking Gagal</div>
            <div>Autentikasi Google dibatalkan atau mengalami kesalahan. Silakan coba kembali.</div>
          </div>
        </div>
      )}

      {successParam === 'LinkedSuccessfully' && (
        <div className={`${styles.banner} ${styles.bannerSuccess}`}>
          <CheckCircle2 className={styles.bannerIcon} size={20} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerTitle}>Berhasil Terhubung</div>
            <div>Akun Gmail Anda telah berhasil di-link. Anda sekarang dapat login menggunakan Google.</div>
          </div>
        </div>
      )}

      {infoParam === 'AlreadyLinked' && (
        <div className={`${styles.banner} ${styles.bannerInfo}`}>
          <Info className={styles.bannerIcon} size={20} />
          <div className={styles.bannerContent}>
            <div className={styles.bannerTitle}>Sudah Terhubung</div>
            <div>Akun Google ini sudah terhubung dengan akun Anda saat ini.</div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className={styles.card}>
        {/* Section 1: Registered Account Email */}
        <div className={styles.cardSection}>
          <div className={styles.sectionTitle}>
            <Mail size={18} style={{ color: '#94a3b8' }} /> Email Registrasi Akun
          </div>
          <div className={styles.infoGrid}>
            <div className={styles.infoBox}>
              <span className={styles.infoLabel}>Registered Email</span>
              <span className={styles.infoValue}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : statusData?.registeredEmail}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        {/* Section 2: Google Account Connection Status */}
        <div className={styles.cardSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Gmail Account Status
            </div>

            {!loading && (
              statusData?.isLinked ? (
                <span className={`${styles.badge} ${styles.badgeConnected}`}>
                  <span className={styles.dotGreen} /> Connected
                </span>
              ) : (
                <span className={`${styles.badge} ${styles.badgeNotConnected}`}>
                  <span className={styles.dotGrey} /> Not linked
                </span>
              )
            )}
          </div>

          <p style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0' }}>
            Hubungkan akun Google/Gmail Anda untuk memungkinkan login secara instan melalui <strong>Continue with Google</strong>.
          </p>

          <div className={styles.accountRow}>
            <div className={styles.accountLeft}>
              <div className={styles.googleIconWrapper}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>
              <div className={styles.accountDetails}>
                <div className={styles.accountName}>
                  {loading ? (
                    'Memuat...'
                  ) : statusData?.isLinked ? (
                    statusData.linkedEmail
                  ) : (
                    'Not linked'
                  )}
                </div>
                <div className={styles.accountSubtext}>
                  {statusData?.isLinked ? 'Google Account Connected' : 'Belum ada akun Google terhubung'}
                </div>
              </div>
            </div>

            <div>
              {loading ? (
                <div style={{ padding: '0.5rem 1rem', color: '#94a3b8' }}>
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : statusData?.isLinked ? (
                <button
                  type="button"
                  onClick={() => setShowUnlinkModal(true)}
                  className={styles.btnUnlink}
                >
                  <Unlink size={16} /> Unlink Gmail Account
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/auth/google/link';
                  }}
                  className={styles.btnLink}
                >
                  <Link2 size={16} /> Link Gmail Account
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Unlink Modal */}
      {showUnlinkModal && (
        <div className={styles.modalOverlay} onClick={() => setShowUnlinkModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.warningIcon}>
                <AlertTriangle size={20} />
              </div>
              <h3 className={styles.modalTitle}>Unlink Google Account?</h3>
            </div>
            <p className={styles.modalText}>
              You will no longer be able to login using this Google account. Data akun aplikasi, task, dan proyek Anda tetap aman.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowUnlinkModal(false)}
                className={styles.btnCancel}
                disabled={isUnlinking}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnlink}
                className={styles.btnConfirmDelete}
                disabled={isUnlinking}
              >
                {isUnlinking ? 'Unlinking...' : 'Unlink'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
