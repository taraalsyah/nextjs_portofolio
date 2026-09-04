'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle, AlertTriangle } from 'lucide-react';
import { ButtonLoading } from '@/components/ui/loading';
import styles from './profile.module.css';

// ─── VALIDASI SCHEMA ZOD ──────────────────────────────────────────────────────
const updatePasswordSchema = z
  .object({
    old_password: z.string().min(1, 'Password lama wajib diisi'),
    new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
    confirm_password: z.string().min(1, 'Konfirmasi password baru wajib diisi'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Konfirmasi password tidak cocok dengan password baru',
    path: ['confirm_password'],
  });

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Visibility state for password fields
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: UpdatePasswordFormValues) => {
    setIsSubmitting(true);
    setStatus(null);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal memperbarui password.');
      }

      setStatus({ type: 'success', message: data.message || 'Password berhasil diperbarui.' });
      reset();
    } catch (err: any) {
      console.error('Update password error:', err);
      setStatus({ type: 'error', message: err.message || 'Terjadi kesalahan saat memperbarui password.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${styles.profileCard} glass`}>
      {/* Header */}
      <div className={styles.cardHeader} style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound size={18} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
              Ubah Password Akun
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', margin: '0.1rem 0 0' }}>
              Perbarui password Anda secara berkala untuk menjaga keamanan akun
            </p>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {status && (
        <div className={`${styles.alert} ${status.type === 'success' ? styles.alertSuccess : styles.alertError}`} style={{ marginBottom: '1rem' }}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Form Input Fields Grid */}
      <div className={styles.formGrid}>
        {/* Field 1: Password Lama */}
        <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
          <label className={styles.label}>
            <Lock className={styles.labelIcon} size={13} /> Password Saat Ini (Lama)
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showOldPassword ? 'text' : 'password'}
              {...register('old_password')}
              className={styles.input}
              placeholder="Masukkan password saat ini"
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              title={showOldPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
            >
              {showOldPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.old_password && <span className={styles.errorText}>{errors.old_password.message}</span>}
        </div>

        {/* Field 2: Password Baru */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Lock className={styles.labelIcon} size={13} /> Password Baru
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              {...register('new_password')}
              className={styles.input}
              placeholder="Minimal 8 karakter"
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              title={showNewPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
            >
              {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.new_password && <span className={styles.errorText}>{errors.new_password.message}</span>}
        </div>

        {/* Field 3: Konfirmasi Password Baru */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>
            <Lock className={styles.labelIcon} size={13} /> Konfirmasi Password Baru
          </label>
          <div style={{ position: 'relative', width: '100%' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirm_password')}
              className={styles.input}
              placeholder="Ulangi password baru"
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
              }}
              title={showConfirmPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirm_password && <span className={styles.errorText}>{errors.confirm_password.message}</span>}
        </div>
      </div>

      {/* Button Section */}
      <div className={styles.btnSection}>
        <ButtonLoading
          type="submit"
          isLoading={isSubmitting}
          loadingText="Memperbarui..."
          disabled={!isDirty}
          className={styles.saveBtn}
        >
          <KeyRound size={14} />
          <span>Perbarui Password</span>
        </ButtonLoading>
      </div>
    </form>
  );
}
