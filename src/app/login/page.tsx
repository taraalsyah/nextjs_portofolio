'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '@/components/LoginForm';
import styles from './login.module.css';

export default function LoginPage() {
  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlows} />
      
      <div className={styles.container}>
        <div className={styles.backLinkWrapper}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Kembali ke Portofolio
          </Link>
        </div>

        <Suspense fallback={<div className={styles.card} style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><span className={styles.spinner}></span></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
