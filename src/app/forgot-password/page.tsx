'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import Input from '@/components/ui/Input';
import styles from '@/app/login/login.module.css';

const schema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
});

type FormInput = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormInput) => {
    setIsLoading(true);
    setGeneralError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setGeneralError(result.message || 'Terjadi kesalahan sistem.');
      } else {
        setSuccessMessage('Jika email terdaftar, kami telah mengirimkan link reset password.');
      }
    } catch (error) {
      setGeneralError('Gagal menghubungkan ke server. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlows} />
      
      <div className={styles.container}>
        <div className={styles.backLinkWrapper}>
          <Link href="/login" className={styles.backLink}>
            <ArrowLeft size={16} /> Kembali ke Login
          </Link>
        </div>

        <motion.div
          key="forgot-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${styles.card} glass`}
        >
          <div className={styles.cardHeader}>
            <h1 className={styles.title}>
              Forgot <span className="text-gradient">Password</span>
            </h1>
            <p className={styles.subtitle}>Masukkan email Anda untuk menerima link reset password</p>
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
            <Input
              label="Email Address"
              id="email"
              type="email"
              placeholder="nama@email.com"
              disabled={isLoading}
              error={errors.email?.message}
              {...register('email')}
            />

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className={styles.spinner} />
              ) : (
                'Kirim Link Reset'
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
      </div>
    </main>
  );
}
