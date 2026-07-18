'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, LayoutDashboard, User as UserIcon, Mail, Shield, Home } from 'lucide-react';
import styles from './dashboard.module.css';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <main className={styles.main}>
        <div className={styles.spinner} />
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <main className={styles.main}>
        <div className={`${styles.card} glass`}>
          <h2 className={styles.title}>Akses Ditolak</h2>
          <p className={styles.subtitle}>
            Silakan login terlebih dahulu untuk mengakses halaman dashboard.
          </p>
          <Link href="/login" className={styles.loginBtn}>
            Kembali ke Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.backgroundGlows} />
      
      <div className={styles.container}>
        <div className={`${styles.card} glass`}>
          <div className={styles.header}>
            <LayoutDashboard className={styles.dashboardIcon} size={32} />
            <h1 className={styles.title}>
              User <span className="text-gradient">Dashboard</span>
            </h1>
            <p className={styles.subtitle}>Selamat datang kembali di panel Anda</p>
          </div>

          <div className={styles.profileSection}>
            <div className={styles.profileItem}>
              <UserIcon className={styles.icon} size={20} />
              <div>
                <span className={styles.label}>Nama</span>
                <span className={styles.value}>{session?.user?.name || '-'}</span>
              </div>
            </div>

            <div className={styles.profileItem}>
              <Mail className={styles.icon} size={20} />
              <div>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{session?.user?.email || '-'}</span>
              </div>
            </div>

            <div className={styles.profileItem}>
              <Shield className={styles.icon} size={20} />
              <div>
                <span className={styles.label}>Role</span>
                <span className={styles.badge}>
                  {(session?.user as any)?.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/" className={styles.homeBtn}>
              <Home size={18} /> Beranda
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={styles.logoutBtn}
            >
              <LogOut size={18} /> Keluar
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
