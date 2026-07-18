'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Input from './ui/Input';
import styles from '@/app/login/login.module.css';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showRegisterSuccess = searchParams.get('registered') === 'true';
  const showSessionExpired = searchParams.get('error') === 'SessionExpired';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setErrors({});
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
        setErrors({ general: result.message || 'Gagal mengirim ulang kode.' });
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      setErrors({ general: 'Gagal menghubungi server. Silakan coba lagi.' });
    } finally {
      setIsResending(false);
    }
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal terdiri dari 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === 'PENDING_VERIFICATION') {
          setErrors({ general: 'Email Anda belum diverifikasi. Silakan lakukan verifikasi terlebih dahulu.' });
          setShowResendOption(true);
        } else {
          setErrors({ general: 'Email atau password salah' });
        }
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 2000);
      }
    } catch (err: any) {
      setErrors({ general: 'Terjadi kesalahan sistem. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
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
        <h2 className={styles.successTitle}>Login Berhasil!</h2>
        <p className={styles.successMessage}>
          Anda berhasil masuk. Mengarahkan Anda ke dashboard...
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="login-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${styles.card} glass`}
    >
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>
          Selamat <span className="text-gradient">Datang</span>
        </h1>
        <p className={styles.subtitle}>Masuk ke akun Anda untuk melanjutkan</p>
      </div>

      {showRegisterSuccess && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>Registrasi berhasil. Silakan login.</span>
        </div>
      )}

      {showSessionExpired && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>Sesi Anda telah berakhir. Silakan login kembali.</span>
        </div>
      )}

      {errors.general && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{errors.general}</span>
        </div>
      )}

      {showResendOption && (
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className={styles.resendVerificationBtn}
        >
          {isResending ? 'Mengirim...' : 'Kirim Ulang Kode Verifikasi'}
        </button>
      )}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={isLoading}
          required
        />

        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Masukkan password Anda"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          disabled={isLoading}
          required
        />

        <div className={styles.forgotPasswordWrapper}>
          <Link href="/forgot-password" className={styles.textLink}>
            Lupa Password?
          </Link>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner} />
          ) : (
            'Login'
          )}
        </button>
      </form>

      <div className={styles.cardFooter}>
        <p>
          Belum punya akun?{' '}
          <Link href="/register" className={styles.textLinkAccent}>
            Daftar
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
