import React from 'react';
import Link from 'next/link';
import { LogOut, LayoutDashboard, User as UserIcon, Mail, Shield, Home } from 'lucide-react';
import { requireAuth } from '@/lib/session';
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  // Verifikasi session server-side. Jika tidak valid, redirect otomatis ke /login?error=SessionExpired
  const user = await requireAuth();

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
                <span className={styles.value}>{user.name || '-'}</span>
              </div>
            </div>

            <div className={styles.profileItem}>
              <Mail className={styles.icon} size={20} />
              <div>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{user.email || '-'}</span>
              </div>
            </div>

            <div className={styles.profileItem}>
              <Shield className={styles.icon} size={20} />
              <div>
                <span className={styles.label}>Role</span>
                <span className={styles.badge}>
                  {(user as any).role || 'user'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <Link href="/" className={styles.homeBtn}>
              <Home size={18} /> Beranda
            </Link>

            {/* Logout menggunakan standard HTML Form POST ke API Route untuk membersihkan session cookie di server */}
            <form action="/api/auth/logout" method="POST" style={{ display: 'inline-block' }}>
              <button
                type="submit"
                className={styles.logoutBtn}
              >
                <LogOut size={18} /> Keluar
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
