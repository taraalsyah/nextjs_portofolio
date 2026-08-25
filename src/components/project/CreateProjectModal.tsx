'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  FolderPlus,
  Check,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Copy,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import styles from './project.module.css';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';
import { useSafeToast } from '@/components/ui/Toast';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const toast = useSafeToast();
  // Step 1: Fill Project Details -> Step 2: Choose Payment Method -> Step 3: Checkout / Auto-Create Pending -> Step 4: Project Auto-Created Success
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM'>('PRIVATE');

  // Payment states
  const [selectedMethod, setSelectedMethod] = useState<string>('qris');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [createdProjectData, setCreatedProjectData] = useState<any>(null);

  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedVa, setCopiedVa] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if user already has an active unused PAID payment or project created
  const checkActiveUnusedPayment = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/status');
      if (res.ok) {
        const data = await res.json();
        if (data.activePaidPayment) {
          setPaymentData(data.activePaidPayment);
          if (data.activePaidPayment.usedForProjectId) {
            setCreatedProjectData({ id: data.activePaidPayment.usedForProjectId });
          }
        }
      }
    } catch (err) {
      console.error('Error checking active payment:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkActiveUnusedPayment();
    } else {
      // Reset state on modal close
      setStep(1);
      setPaymentData(null);
      setCreatedProjectData(null);
      setProjectName('');
      setDescription('');
      setVisibility('PRIVATE');
      setError(null);
    }
  }, [isOpen, checkActiveUnusedPayment]);

  // Polling payment status when in Step 3 (Pending Checkout)
  useEffect(() => {
    if (step !== 3 || !paymentData?.transactionId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?transactionId=${paymentData.transactionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.payment) {
            setPaymentData(data.payment);
            if (data.payment.status === 'PAID') {
              toast?.showToast('Pembayaran Rp30.000 terkonfirmasi! Proyek otomatis dibuat.', 'success');
              setStep(4);
              onSuccess();
            }
          }
        }
      } catch (err) {
        console.error('Polling payment status error:', err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [step, paymentData?.transactionId, toast, onSuccess]);

  if (!isOpen || !isMounted) return null;

  // Step 1 -> Step 2: Validate details before moving to Payment Method Selection
  const handleProceedToPaymentSelection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Nama proyek wajib diisi.');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 2 -> Step 3: Initiate Payment with Draft Project Details
  const handleInitiatePayment = async () => {
    if (!projectName.trim()) {
      setError('Nama proyek wajib diisi.');
      setStep(1);
      return;
    }

    setIsLoadingPayment(true);
    setError(null);

    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          projectName: projectName.trim(),
          description: description.trim() || null,
          visibility,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses transaksi pembayaran.');
      }

      setPaymentData(data.payment);

      if (data.payment.status === 'PAID') {
        toast?.showToast('Pembayaran terkonfirmasi! Proyek otomatis dibuat oleh sistem.', 'success');
        setStep(4);
        onSuccess();
      } else {
        setStep(3);
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal memulai transaksi pembayaran.';
      setError(msg);
      toast?.showToast(msg, 'error');
    } finally {
      setIsLoadingPayment(false);
    }
  };

  // Manual Check Status Button
  const handleManualCheckStatus = async () => {
    if (!paymentData?.transactionId || isCheckingStatus) return;
    setIsCheckingStatus(true);
    setError(null);

    try {
      const res = await fetch(`/api/payments/status?transactionId=${paymentData.transactionId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memeriksa status pembayaran.');
      }

      if (data.payment) {
        setPaymentData(data.payment);
        if (data.payment.status === 'PAID') {
          toast?.showToast('Pembayaran Rp30.000 terverifikasi! Proyek otomatis dibuat.', 'success');
          setStep(4);
          onSuccess();
        } else if (data.payment.status === 'EXPIRED') {
          setError('Sesi pembayaran telah kadaluarsa. Silakan buat transaksi baru.');
        } else {
          toast?.showToast('Pembayaran belum diterima. Silakan selesaikan pembayaran.', 'info');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Dev & Demo Simulator Helper
  const handleSimulatePayment = async () => {
    if (!paymentData?.transactionId || isSimulating) return;
    setIsSimulating(true);

    try {
      const res = await fetch('/api/payments/simulate-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: paymentData.transactionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal melakukan simulasi pembayaran.');
      }

      setPaymentData(data.payment);
      if (data.project) {
        setCreatedProjectData(data.project);
      }
      toast?.showToast('Simulasi Berhasil! Proyek otomatis dibuat oleh sistem.', 'success');
      setStep(4);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  // Copy VA Number helper
  const handleCopyVa = (vaNum: string) => {
    navigator.clipboard.writeText(vaNum);
    setCopiedVa(true);
    toast?.showToast('Nomor Virtual Account berhasil disalin!', 'success');
    setTimeout(() => setCopiedVa(false), 2500);
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <FolderPlus size={20} style={{ color: '#38bdf8' }} />
            {step === 4 ? 'Proyek Berhasil Dibuat!' : 'Buat Proyek Baru'}
          </div>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator Header */}
        <div className={styles.stepWizardHeader}>
          <div className={`${styles.stepItem} ${step >= 1 ? styles.stepItemActive : ''}`}>
            <span className={`${styles.stepNumber} ${step >= 1 ? styles.stepNumberActive : ''}`}>1</span>
            Detail Proyek
          </div>
          <ArrowRight size={12} style={{ color: 'var(--muted-foreground)' }} />
          <div className={`${styles.stepItem} ${step >= 2 ? styles.stepItemActive : ''}`}>
            <span className={`${styles.stepNumber} ${step >= 2 ? styles.stepNumberActive : ''}`}>2</span>
            Metode Pembayaran
          </div>
          <ArrowRight size={12} style={{ color: 'var(--muted-foreground)' }} />
          <div className={`${styles.stepItem} ${step >= 3 ? styles.stepItemActive : ''}`}>
            <span className={`${styles.stepNumber} ${step >= 3 ? styles.stepNumberActive : ''}`}>3</span>
            {step === 4 ? 'Selesai' : 'Bayar & Auto-Create'}
          </div>
        </div>

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
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: FILL PROJECT DETAILS */}
          {step === 1 && (
            <form onSubmit={handleProceedToPaymentSelection} id="projectDetailsForm">
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

              {/* Fee Notice Banner */}
              <div className={styles.paymentFeeBanner} style={{ marginTop: '1rem', marginBottom: 0 }}>
                <div className={styles.feeLabel}>
                  <span className={styles.feeTitle}>Biaya Pembuatan Proyek</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                    Setelah pembayaran Rp30.000 berhasil, proyek akan otomatis dibuat oleh sistem.
                  </span>
                </div>
                <div className={styles.feeAmount}>Rp30.000</div>
              </div>
            </form>
          )}

          {/* STEP 2: SELECT PAYMENT METHOD */}
          {step === 2 && (
            <div>
              {/* Draft Project Summary Card */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Ringkasan Proyek:</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--foreground)' }}>
                  {projectName || 'Proyek Baru'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                  <span>Visibilitas: {visibility}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>Biaya: Rp30.000</span>
                </div>
              </div>

              <div style={{ marginBottom: '0.75rem', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>
                Pilih Metode Pembayaran:
              </div>

              <div className={styles.paymentMethodList}>
                {/* QRIS */}
                <div
                  className={`${styles.paymentMethodCard} ${
                    selectedMethod === 'qris' ? styles.paymentMethodCardSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('qris')}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <QrCode size={20} />
                    </div>
                    <div className={styles.methodMeta}>
                      <span className={styles.methodTitle}>QRIS (Instan & Bebas Biaya)</span>
                      <span className={styles.methodSub}>GoPay, OVO, Dana, LinkAja, BCA, ShopeePay, dll</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'qris'}
                    onChange={() => setSelectedMethod('qris')}
                  />
                </div>

                {/* Virtual Accounts */}
                <div
                  className={`${styles.paymentMethodCard} ${
                    selectedMethod === 'va_bca' ? styles.paymentMethodCardSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('va_bca')}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <Building2 size={20} />
                    </div>
                    <div className={styles.methodMeta}>
                      <span className={styles.methodTitle}>Virtual Account BCA</span>
                      <span className={styles.methodSub}>Transfer via m-BCA / KlikBCA</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'va_bca'}
                    onChange={() => setSelectedMethod('va_bca')}
                  />
                </div>

                <div
                  className={`${styles.paymentMethodCard} ${
                    selectedMethod === 'va_bni' ? styles.paymentMethodCardSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('va_bni')}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <Building2 size={20} />
                    </div>
                    <div className={styles.methodMeta}>
                      <span className={styles.methodTitle}>Virtual Account BNI</span>
                      <span className={styles.methodSub}>Transfer via BNI Mobile Banking</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'va_bni'}
                    onChange={() => setSelectedMethod('va_bni')}
                  />
                </div>

                <div
                  className={`${styles.paymentMethodCard} ${
                    selectedMethod === 'va_bri' ? styles.paymentMethodCardSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('va_bri')}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <Building2 size={20} />
                    </div>
                    <div className={styles.methodMeta}>
                      <span className={styles.methodTitle}>Virtual Account BRI</span>
                      <span className={styles.methodSub}>Transfer via BRImo</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'va_bri'}
                    onChange={() => setSelectedMethod('va_bri')}
                  />
                </div>

                <div
                  className={`${styles.paymentMethodCard} ${
                    selectedMethod === 'va_mandiri' ? styles.paymentMethodCardSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('va_mandiri')}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <Building2 size={20} />
                    </div>
                    <div className={styles.methodMeta}>
                      <span className={styles.methodTitle}>Virtual Account Mandiri</span>
                      <span className={styles.methodSub}>Transfer via Livin by Mandiri</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'va_mandiri'}
                    onChange={() => setSelectedMethod('va_mandiri')}
                  />
                </div>

                {/* E-Wallet */}
                <div
                  className={`${styles.paymentMethodCard} ${
                    selectedMethod === 'gopay' ? styles.paymentMethodCardSelected : ''
                  }`}
                  onClick={() => setSelectedMethod('gopay')}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodIcon}>
                      <Wallet size={20} />
                    </div>
                    <div className={styles.methodMeta}>
                      <span className={styles.methodTitle}>GoPay / E-Wallet</span>
                      <span className={styles.methodSub}>Pembayaran langsung via aplikasi GoPay</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={selectedMethod === 'gopay'}
                    onChange={() => setSelectedMethod('gopay')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CHECKOUT & AUTOMATIC CREATION PENDING */}
          {step === 3 && paymentData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Payment Status Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Status Pembayaran</div>
                  <span className={`${styles.paymentStatusBadge} ${styles.statusPending}`}>
                    <Clock size={14} /> Menunggu Pembayaran
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Total Biaya</div>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>Rp30.000</div>
                </div>
              </div>

              {/* Automatic Creation Notice */}
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sparkles size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
                <span>
                  Sistem akan <strong>otomatis membuat proyek &quot;{paymentData.projectName || projectName}&quot;</strong> saat pembayaran terverifikasi.
                </span>
              </div>

              {/* QRIS Display */}
              {(paymentData.paymentMethod === 'qris' || paymentData.qrUrl) && paymentData.qrUrl && (
                <div className={styles.qrWrapper}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--foreground)' }}>
                    Scan QRIS untuk Pembayaran
                  </div>
                  <img src={paymentData.qrUrl} alt="QRIS Code" className={styles.qrImage} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                    Gunakan aplikasi GoPay, OVO, Dana, LinkAja, ShopeePay, atau Mobile Banking pilihan Anda.
                  </span>
                </div>
              )}

              {/* Virtual Account Display */}
              {paymentData.vaNumber && (
                <div className={styles.vaBox}>
                  <div className={styles.vaHeader}>
                    <span className={styles.vaBankName}>
                      Virtual Account {paymentData.bank || paymentData.paymentMethod.replace('va_', '').toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Batas Waktu: 30 Menit</span>
                  </div>

                  <div className={styles.vaNumberRow}>
                    <span className={styles.vaNumberText}>{paymentData.vaNumber}</span>
                    <button onClick={() => handleCopyVa(paymentData.vaNumber)} className={styles.copyBtn}>
                      <Copy size={13} />
                      {copiedVa ? 'Tersalin!' : 'Salin VA'}
                    </button>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>
                    1. Buka aplikasi M-Banking & pilih Transfer ke Virtual Account.<br />
                    2. Masukkan nomor VA di atas dan konfirmasi nominal Rp30.000.
                  </div>
                </div>
              )}

              {/* Transaction Meta */}
              <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', display: 'flex', justifyContent: 'space-between' }}>
                <span>ID Transaksi: <strong>{paymentData.transactionId}</strong></span>
                <span>Waktu: {new Date(paymentData.createdAt || Date.now()).toLocaleTimeString()}</span>
              </div>

              {/* Actions & Simulator Helper */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingStatus}
                  className={styles.submitBtn}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {isCheckingStatus ? <InlineSpinner size={14} /> : <RefreshCw size={14} />}
                  {isCheckingStatus ? 'Memeriksa Status Pembayaran...' : 'Cek Status Pembayaran'}
                </button>

                {/* Dev & Demo Simulator Trigger */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  type="button"
                  style={{
                    width: '100%',
                    padding: '0.55rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px dashed rgba(245, 158, 11, 0.4)',
                    color: '#f59e0b',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {isSimulating ? <InlineSpinner size={13} /> : <Zap size={14} />}
                  {isSimulating ? 'Memproses Simulasi...' : '⚡ Simulasi Pembayaran Berhasil (Dev Mode)'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: PROJECT AUTOMATICALLY CREATED SUCCESS */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '1rem 0' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 0.4rem 0' }}>
                  Pembayaran Berhasil & Proyek Telah Otomatis Dibuat!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.5 }}>
                  Pembayaran fee sebesar <strong>Rp30.000</strong> telah dikonfirmasi.<br />
                  Proyek <strong>&quot;{paymentData?.projectName || projectName || 'Baru'}&quot;</strong> sudah resmi terdaftar dan siap digunakan.
                </p>
              </div>

              <div
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  background: 'var(--surface-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  color: 'var(--muted-foreground)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>ID Transaksi: <strong>{paymentData?.transactionId}</strong></span>
                <span>Status: <strong style={{ color: '#10b981' }}>PAID & CREATED</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          {step === 1 && (
            <>
              <button type="button" onClick={onClose} className={styles.cancelBtn}>
                Batal
              </button>
              <button
                type="submit"
                form="projectDetailsForm"
                className={styles.submitBtn}
              >
                <ArrowRight size={16} />
                Lanjut ke Metode Pembayaran
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)} className={styles.cancelBtn} disabled={isLoadingPayment}>
                Kembali
              </button>
              <button
                type="button"
                onClick={handleInitiatePayment}
                className={styles.submitBtn}
                disabled={isLoadingPayment}
                style={{ opacity: isLoadingPayment ? 0.6 : 1 }}
              >
                {isLoadingPayment ? <InlineSpinner size={15} /> : <CreditCard size={16} />}
                {isLoadingPayment ? 'Memproses...' : 'Bayar & Buat Proyek (Rp30.000)'}
              </button>
            </>
          )}

          {step === 3 && (
            <button type="button" onClick={() => setStep(2)} className={styles.cancelBtn}>
              Kembali ke Pilih Metode
            </button>
          )}

          {step === 4 && (
            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className={styles.submitBtn}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Check size={16} />
              Selesai & Buka Proyek
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
