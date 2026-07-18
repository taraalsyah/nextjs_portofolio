'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import Input from './ui/Input';
import { verifyEmailSchema, VerifyEmailInput } from '@/validators/auth';
import styles from '@/app/login/login.module.css';

export default function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // OTP Expiration timer (10 menit = 600 detik)
  const [timeLeft, setTimeLeft] = useState(600);
  
  // Cooldown kirim ulang (60 detik)
  const [cooldown, setCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      email,
      code: '',
    },
  });

  // Set email value when query param is parsed
  useEffect(() => {
    if (email) {
      setValue('email', email);
    }
  }, [email, setValue]);

  // Timer OTP Expiration (10 menit)
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Timer Cooldown (60 detik)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: VerifyEmailInput) => {
    if (timeLeft <= 0) {
      setGeneralError('Kode verifikasi telah kedaluwarsa. Silakan kirim ulang kode baru.');
      return;
    }

    setIsLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          code: data.code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.message || 'Terjadi kesalahan verifikasi.');
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      }
    } catch (error) {
      setGeneralError('Gagal menghubungi server. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.message || 'Gagal mengirim ulang kode.');
      } else {
        setSuccessMessage('Kode verifikasi baru berhasil dikirim.');
        setTimeLeft(600); // Reset timer OTP 10 menit
        setCooldown(60);   // Reset cooldown 60 detik
      }
    } catch (error) {
      setGeneralError('Gagal menghubungi server. Silakan coba lagi.');
    } finally {
      setIsResending(false);
    }
  };

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
        <h2 className={styles.successTitle}>Verifikasi Berhasil!</h2>
        <p className={styles.successMessage}>
          Email Anda telah terverifikasi. Mengarahkan Anda ke halaman login...
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="verify-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${styles.card} glass`}
    >
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>
          Verifikasi <span className="text-gradient">Email</span>
        </h1>
        <p className={styles.subtitle}>
          Kami telah mengirimkan 6 digit kode verifikasi ke <strong>{email}</strong>.
        </p>
      </div>

      {generalError && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      {successMessage && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        {/* Hidden Email Field */}
        <input type="hidden" {...register('email')} />

        <Input
          label="Kode Verifikasi (OTP)"
          id="code"
          type="text"
          maxLength={6}
          placeholder="Masukkan 6 digit kode"
          disabled={isLoading}
          error={errors.code?.message}
          {...register('code')}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.25rem 0' }}>
          <span style={{ fontSize: '0.85rem', color: timeLeft > 0 ? 'hsla(0, 0%, 100%, 0.6)' : 'var(--accent)' }}>
            {timeLeft > 0 ? `Berlaku: ${formatTime(timeLeft)}` : 'Kode Kedaluwarsa'}
          </span>
          
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            style={{
              fontSize: '0.85rem',
              color: cooldown > 0 ? 'hsla(0, 0%, 100%, 0.4)' : 'var(--secondary)',
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <RefreshCw size={14} className={isResending ? styles.spinner : ''} />
            {cooldown > 0 ? `Kirim Ulang (${cooldown}s)` : 'Kirim Ulang Kode'}
          </button>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            'Verifikasi'
          )}
        </button>
      </form>

      <div className={styles.cardFooter}>
        <p>
          Salah email?{' '}
          <Link href="/register" className={styles.textLinkAccent}>
            Daftar Ulang
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
