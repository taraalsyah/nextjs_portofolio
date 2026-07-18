'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Input from './ui/Input';
import { registerSchema, RegisterInput } from '@/lib/validation';
import styles from '@/app/login/login.module.css';

export default function RegisterForm() {
  const router = useRouter();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setGeneralError(null);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setGeneralError('Email sudah terdaftar.');
        } else if (response.status === 400 && result.errors) {
          setGeneralError('Validasi input gagal.');
        } else {
          setGeneralError(result.message || 'Terjadi kesalahan sistem.');
        }
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 3000);
      }
    } catch (error) {
      setGeneralError('Gagal menghubungkan ke server. Silakan coba lagi.');
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
        <h2 className={styles.successTitle}>Registrasi Berhasil!</h2>
        <p className={styles.successMessage}>
          Akun Anda telah berhasil dibuat. Silakan login.
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="register-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`${styles.card} glass`}
    >
      <div className={styles.cardHeader}>
        <h1 className={styles.title}>
          Buat <span className="text-gradient">Akun</span>
        </h1>
        <p className={styles.subtitle}>Daftarkan diri Anda untuk membuat akun baru</p>
      </div>

      {generalError && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
        <Input
          label="Nama Lengkap"
          id="name"
          type="text"
          placeholder="Masukkan nama lengkap Anda"
          disabled={isLoading}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email Address"
          id="email"
          type="email"
          placeholder="nama@email.com"
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
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
          placeholder="Ulangi password Anda"
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
            'Daftar'
          )}
        </button>
      </form>

      <div className={styles.cardFooter}>
        <p>
          Sudah punya akun?{' '}
          <Link href="/login" className={styles.textLinkAccent}>
            Login
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
