'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import Input from './ui/Input';
import styles from '@/app/login/login.module.css';

type LoginStep = 'CREDENTIALS' | 'OTP_VERIFICATION';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showRegisterSuccess = searchParams.get('registered') === 'true';
  const showSessionExpired = searchParams.get('error') === 'SessionExpired';
  const showGoogleNotLinked = searchParams.get('error') === 'GoogleNotLinked';
  const showResetSuccess = searchParams.get('reset') === 'true';

  // Step 1: Credential States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  // Step 2: 2FA OTP States
  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [preAuthToken, setPreAuthToken] = useState<string>('');
  const [maskedEmail, setMaskedEmail] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState<number>(0);
  const [isResending, setIsResending] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  // Refs for 6 individual OTP slots
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Cooldown countdown timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP_VERIFICATION' && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, cooldown]);

  // Focus first slot when switching to OTP_VERIFICATION
  useEffect(() => {
    if (step === 'OTP_VERIFICATION') {
      setTimeout(() => {
        otpRefs[0].current?.focus();
      }, 100);
    }
  }, [step]);

  // Resend Verification Email for unverified pending registration
  const handleResendUnverified = async () => {
    setIsResendingVerification(true);
    setErrors({});
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setErrors({ general: result.message || 'Gagal mengirim ulang kode.' });
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch {
      setErrors({ general: 'Gagal menghubungi server. Silakan coba lagi.' });
    } finally {
      setIsResendingVerification(false);
    }
  };

  const validateCredentials = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email atau username wajib diisi';
    }

    if (!password) {
      newErrors.password = 'Password wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 1 Submission: Validate Credentials & Request OTP
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateCredentials()) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login-step1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.message === 'PENDING_VERIFICATION') {
          setErrors({ general: 'Email Anda belum diverifikasi. Silakan lakukan verifikasi terlebih dahulu.' });
          setShowResendOption(true);
        } else {
          setErrors({ general: data.message || 'Email/Username atau password salah.' });
        }
      } else if (data.requires2FA && data.preAuthToken) {
        setPreAuthToken(data.preAuthToken);
        setMaskedEmail(data.maskedEmail || 'email terdaftar');
        setStep('OTP_VERIFICATION');
        setCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
      }
    } catch {
      setErrors({ general: 'Terjadi kesalahan sistem saat memproses login.' });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Input Change Handler (Auto-advance to next slot)
  const handleOtpDigitChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  // OTP Keydown Handler (Backspace revert to previous slot)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  // OTP Paste Handler (Populate 6 digits)
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').trim();
    const digits = pastedText.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length > 0) {
      const newDigits = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);

      const nextFocusIndex = Math.min(digits.length, 5);
      otpRefs[nextFocusIndex].current?.focus();
    }
  };

  // Step 2 Submission: Verify OTP & Establish NextAuth Session
  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrors({ general: 'Masukkan 6 digit kode OTP yang diterima melalui email.' });
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify OTP with backend
      const verifyRes = await fetch('/api/auth/verify-2fa-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthToken, otp: fullOtp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setErrors({ general: verifyData.error || 'Invalid verification code. Please check your email and try again.' });
        setIsLoading(false);
        return;
      }

      // 2. Complete NextAuth Session Issuance
      const nextAuthRes = await signIn('credentials', {
        preAuthToken,
        is2FAVerified: 'true',
        redirect: false,
      });

      if (!nextAuthRes?.ok) {
        setErrors({ general: 'Gagal membuat sesi login. Silakan coba lagi.' });
        setIsLoading(false);
      } else {
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1800);
      }
    } catch {
      setErrors({ general: 'Terjadi kesalahan saat verifikasi OTP.' });
      setIsLoading(false);
    }
  };

  // Resend 2FA OTP Code
  const handleResend2FAOtp = async () => {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    setErrors({});

    try {
      const res = await fetch('/api/auth/resend-2fa-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preAuthToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error || 'Gagal mengirim ulang OTP.' });
      } else {
        if (data.preAuthToken) {
          setPreAuthToken(data.preAuthToken);
        }
        setOtpDigits(['', '', '', '', '', '']);
        setCooldown(60);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      }
    } catch {
      setErrors({ general: 'Gagal menghubungkan ke server.' });
    } finally {
      setIsResending(false);
    }
  };

  // Render Login Success Card
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
          Verifikasi dua langkah berhasil. Mengarahkan Anda ke dashboard...
        </p>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} />
        </div>
      </motion.div>
    );
  }

  // Render Step 2: Email OTP Verification Card
  if (step === 'OTP_VERIFICATION') {
    return (
      <motion.div
        key="otp-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={styles.card}
      >
        <div className={styles.cardHeader}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'var(--primary-soft)',
              border: '1px solid var(--primary-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}>
              <ShieldCheck size={22} />
            </div>
          </div>
          <h1 className={styles.title}>Enter verification code</h1>
          <div className={styles.otpInfoBox}>
            <span>Kode keamanan OTP 6 digit telah dikirim ke:</span>
            <span className={styles.otpTargetEmail}>{maskedEmail}</span>
          </div>
        </div>

        {errors.general && (
          <div className={styles.generalError}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{errors.general}</span>
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className={styles.form}>
          {/* 6 Individual Numeric OTP Input Slots */}
          <div className={styles.otpContainer}>
            {otpDigits.map((digit, idx) => (
              <input
                key={`otp-slot-${idx}`}
                ref={otpRefs[idx]}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={handleOtpPaste}
                disabled={isLoading}
                className={`${styles.otpSlot} ${errors.general ? styles.otpSlotError : ''}`}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || otpDigits.join('').length !== 6}
          >
            {isLoading ? (
              <span className={styles.spinner} />
            ) : (
              'Verify OTP'
            )}
          </button>
        </form>

        {/* Resend OTP & Cooldown Timer */}
        <div className={styles.resendCooldownWrapper}>
          {cooldown > 0 ? (
            <span className={styles.resendCooldownText}>
              Resend OTP in {cooldown}s
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend2FAOtp}
              disabled={isResending || isLoading}
              className={styles.resendActiveBtn}
            >
              {isResending ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <RefreshCw size={12} className="spin" /> Mengirim...
                </span>
              ) : (
                'Resend OTP'
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            setStep('CREDENTIALS');
            setErrors({});
            setOtpDigits(['', '', '', '', '', '']);
          }}
          className={styles.backToLoginBtn}
        >
          <ArrowLeft size={13} style={{ display: 'inline', marginRight: '0.25rem' }} />
          Kembali ke Form Login
        </button>
      </motion.div>
    );
  }

  // Render Step 1: Username/Email & Password Form Card
  return (
    <motion.div
      key="login-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={styles.card}
    >
      <div className={styles.cardHeader}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
          <img src="/logo.png" alt="TaskTuntas Logo" width={40} height={40} style={{ borderRadius: '8px', objectFit: 'contain' }} />
        </div>
        <h1 className={styles.title}>
          Selamat Datang
        </h1>
        <p className={styles.subtitle}>Masuk ke akun Anda untuk melanjutkan</p>
      </div>

      {showRegisterSuccess && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>Registrasi berhasil. Silakan login.</span>
        </div>
      )}

      {showResetSuccess && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>Password berhasil diubah. Silakan login menggunakan password baru.</span>
        </div>
      )}

      {showSessionExpired && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>Sesi Anda telah berakhir. Silakan login kembali.</span>
        </div>
      )}

      {showGoogleNotLinked && (
        <div className={styles.generalError}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>
            Google account is not linked to an existing account. Please login using your registered email/password and link this Google account from Account Linked.
          </span>
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
          onClick={handleResendUnverified}
          disabled={isResendingVerification}
          className={styles.resendVerificationBtn}
        >
          {isResendingVerification ? 'Mengirim...' : 'Kirim Ulang Kode Verifikasi'}
        </button>
      )}

      <form onSubmit={handleStep1Submit} className={styles.form} noValidate>
        <Input
          label="Email Address / Username"
          id="email"
          type="text"
          placeholder="nama@email.com atau username"
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
            'Lanjutkan Ke Verifikasi'
          )}
        </button>
      </form>

      <div className={styles.dividerContainer}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>atau</span>
        <div className={styles.dividerLine} />
      </div>

      <button
        type="button"
        onClick={() => {
          window.location.href = '/api/auth/google/login';
        }}
        className={styles.googleLoginBtn}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Continue with Google</span>
      </button>

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
