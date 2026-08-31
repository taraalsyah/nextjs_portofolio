'use client';

import React from 'react';
import Link from 'next/link';
import { useDemo } from '@/context/DemoContext';
import { RotateCcw, Sparkles, UserPlus } from 'lucide-react';
import styles from './demo.module.css';

export const DemoBanner: React.FC = () => {
  const { resetDemo } = useDemo();

  return (
    <div className={styles.demoBanner}>
      <div className={styles.bannerContent}>
        <Sparkles className={styles.bannerIcon} size={18} />
        <div>
          <strong>Mode Demo Interaktif</strong> &mdash; Anda sedang mencoba TaskTuntas menggunakan data sementara di memory browser. Semua perubahan akan hilang ketika halaman di-refresh.
        </div>
      </div>
      <div className={styles.bannerActions}>
        <button className={styles.resetBtn} onClick={resetDemo} title="Reset data ke kondisi awal">
          <RotateCcw size={14} /> Reset Demo
        </button>
        <Link href="/register" className={styles.registerBtn}>
          <UserPlus size={14} /> Buat Akun Gratis
        </Link>
      </div>
    </div>
  );
};

export default DemoBanner;
