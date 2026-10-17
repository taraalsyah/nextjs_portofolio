import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowLeft, Shield, Calendar, Lock } from 'lucide-react';
import { BRAND_CONFIG } from '@/content/terms';
import { PRIVACY_VERSION, PRIVACY_LAST_UPDATED, PRIVACY_SECTIONS } from '@/content/privacy';
import styles from '../terms/terms.module.css';

export const metadata: Metadata = {
  title: `Kebijakan Privasi | ${BRAND_CONFIG.name}`,
  description: `Kebijakan Privasi resmi platform ${BRAND_CONFIG.name} mengenai perlindungan, pemrosesan, dan kerahasiaan data pengguna.`,
  alternates: {
    canonical: `${BRAND_CONFIG.url}/privacy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <div className={styles.pageWrapper}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.brandLink}>
            <Layers size={22} style={{ color: '#2563EB' }} />
            <span className={styles.brandLogoText}>
              Task<span>tuntas</span>
            </span>
          </Link>

          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <Shield size={14} />
          <span>Privasi & Perlindungan Data</span>
        </div>
        <h1 className={styles.title}>Kebijakan Privasi</h1>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Calendar size={15} />
            <span>Terakhir diperbarui: <strong>{PRIVACY_LAST_UPDATED}</strong></span>
          </div>
          <div className={styles.metaItem}>
            <Lock size={15} />
            <span>Versi: <strong>{PRIVACY_VERSION}</strong></span>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className={styles.contentLayout} style={{ gridTemplateColumns: '1fr', maxWidth: '860px' }}>
        <main className={styles.mainContent}>
          <div className={styles.noticeCard}>
            Kami di <strong>{BRAND_CONFIG.name}</strong> berkomitmen untuk melindungi dan menghormati
            privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana data pribadi Anda dikumpulkan,
            digunakan, dan dijaga keamanannya sesuai standar peraturan perundang-undangan perlindungan
            data pribadi yang berlaku di Indonesia.
          </div>

          {PRIVACY_SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>{section.number}</span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </div>
              <div>
                {section.content.map((p, idx) => (
                  <p key={idx} className={styles.paragraph}>
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} {BRAND_CONFIG.company}. Seluruh hak cipta dilindungi.</p>
        <div className={styles.footerLinks}>
          <Link href="/">Beranda</Link>
          <Link href="/terms">Syarat & Ketentuan</Link>
          <Link href="/register">Daftar Akun</Link>
          <Link href="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
}
