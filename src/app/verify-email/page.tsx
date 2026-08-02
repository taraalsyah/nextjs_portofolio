'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import VerifyForm from '@/components/VerifyForm';
import styles from '@/app/login/login.module.css';
import { useIsNativePlatform } from '@/hooks/useCapacitorPlatform';

export default function VerifyEmailPage() {
  const isNative = useIsNativePlatform();

  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlows} />
      
      <div className={styles.container}>
        {!isNative && (
          <div className={styles.backLinkWrapper}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft size={16} /> Kembali ke Portofolio
            </Link>
          </div>
        )}

        <Suspense fallback={<div className={styles.card} style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><span className={styles.spinner}></span></div>}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
