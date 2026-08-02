'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import RegisterForm from '@/components/RegisterForm';
import styles from '@/app/login/login.module.css'; // Reuses login page container styles
import { useIsNativePlatform } from '@/hooks/useCapacitorPlatform';

export default function RegisterPage() {
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

        <RegisterForm />
      </div>
    </main>
  );
}
