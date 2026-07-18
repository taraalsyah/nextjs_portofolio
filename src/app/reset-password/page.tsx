'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import styles from '@/app/login/login.module.css';

const schema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password minimal terdiri dari 8 karakter' })
      .regex(/[A-Z]/, { message: 'Password harus mengandung minimal 1 huruf besar' })
      .regex(/[a-z]/, { message: 'Password harus mengandung minimal 1 huruf kecil' })
      .regex(/[0-9]/, { message: 'Password harus mengandung minimal 1 angka' })
      .regex(/[^A-Za-z0-9]/, { message: 'Password harus mengandung minimal 1 karakter spesial' }),
    confirmPassword: z.string().min(1, { message: 'Konfirmasi password wajib diisi' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password harus sama dengan password',
    path: ['confirmPassword'],
  });

type FormInput = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  // Validasi token saat halaman dibuka
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenError('Link reset password tidak valid atau telah kedaluwarsa.');
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        const result = await response.json();

        if (!response.ok) {
          setTokenError(result.message || 'Link reset password tidak valid atau telah kedaluwarsa.');
        }
      } catch (error) {
        setTokenError('Gagal memvalidasi token. Silakan coba lagi.');
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const onSubmit = async (data: FormInput) => {
    setIsLoading(true);
    setGeneralError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.message || 'Gagal mengubah password.');
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?reset=true');
        }, 3000);
      }
    } catch (error) {
      setGeneralError('Gagal menghubungkan ke server. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className={`${styles.card} glass`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem' }}>
        <RefreshCw className={styles.spinner} size={40} />
        <p style={{ marginTop: '1rem', color: 'hsla(0, 0%, 100%, 0.6)' }}>Memvalidasi link reset password...</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <motion.div
        key="error-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${styles.card} glass`}
      >
        <div className={styles.cardHeader} style={{ alignItems: 'center', textAlign: 'center' }}>
          <AlertTriangle className={styles.generalIcon} size={64} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
          <h2 className={styles.title} style={{ fontSize: '1.8rem' }}>Link Tidak Valid</h2>
          <p className={styles.subtitle}>{tokenError}</p>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/forgot-password" className={styles.submitBtn} style={{ display: 'block', textDecoration: 'none' }}>
            Kirim Link Baru
          </Link>
        </div>
      </motion.div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div
        key="success-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className={`${styles.successCard} glass`}
      >
        <CheckCircle2 className={styles.successIcon} size={64} />
        <h2 className={styles.successTitle}>Password Berhasil Diubah!</h2>
        <p className={styles.successMessage}>
          Password Anda telah berhasil diperbarui. Mengarahkan Anda ke halaman login...
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="reset-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${styles.card} glass`}
    >
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>
          Reset <span className="text-gradient">Password</span>
        </h1>
        <p className={styles.subtitle}>Masukkan password baru Anda untuk mengamankan akun</p>
      </div>

      {generalError && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Password Baru"
          id="password"
          type="password"
          placeholder="Minimal 8 karakter"
          disabled={isLoading}
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Konfirmasi Password"
          id="confirmPassword"
          type="password"
          placeholder="Ulangi password baru Anda"
          disabled={isLoading}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            'Ubah Password'
          )}
        </button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlows} />
      
      <div className={styles.container}>
        <div className={styles.backLinkWrapper}>
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={16} /> Kembali ke Login
          </Link>
        </div>

        <Suspense fallback={
          <div className={`${styles.card} glass`} style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <span className={styles.spinner}></span>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
