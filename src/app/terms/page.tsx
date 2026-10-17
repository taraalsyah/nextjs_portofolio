import type { Metadata } from 'next';
import Link from 'next/link';
import { Layers, ArrowLeft, Calendar, ShieldCheck, ListChecks, FileText } from 'lucide-react';
import {
  TERMS_VERSION,
  TERMS_LAST_UPDATED,
  BRAND_CONFIG,
  TERMS_SECTIONS,
} from '@/content/terms';
import styles from './terms.module.css';

export const metadata: Metadata = {
  title: `Syarat & Ketentuan | ${BRAND_CONFIG.name}`,
  description: `Syarat dan Ketentuan resmi penggunaan platform SaaS manajemen proyek dan produk digital ${BRAND_CONFIG.name}.`,
  alternates: {
    canonical: `${BRAND_CONFIG.url}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: `Syarat & Ketentuan | ${BRAND_CONFIG.name}`,
    description: `Syarat dan Ketentuan resmi penggunaan platform SaaS manajemen proyek dan produk digital ${BRAND_CONFIG.name}.`,
    url: `${BRAND_CONFIG.url}/terms`,
    siteName: BRAND_CONFIG.name,
    locale: 'id_ID',
    type: 'website',
  },
};

export default function TermsPage() {
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

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <ShieldCheck size={14} />
          <span>Legal & Kepatuhan Layanan</span>
        </div>
        <h1 className={styles.title}>Syarat & Ketentuan</h1>
        <div className={styles.metaRow}>
          <div className={styles.metaItem}>
            <Calendar size={15} />
            <span>Terakhir diperbarui: <strong>{TERMS_LAST_UPDATED}</strong></span>
          </div>
          <div className={styles.metaItem}>
            <FileText size={15} />
            <span>Versi Dokumen: <strong>{TERMS_VERSION}</strong></span>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Sticky Table of Contents */}
      <div className={styles.contentLayout}>
        {/* Sidebar Table of Contents */}
        <aside className={styles.sidebar} aria-label="Daftar Isi Syarat & Ketentuan">
          <div className={styles.tocTitle}>
            <ListChecks size={16} />
            <span>Daftar Isi</span>
          </div>
          <nav>
            <ul className={styles.tocList}>
              {TERMS_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={styles.tocLink}>
                    {section.number}: {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Articles Content */}
        <main className={styles.mainContent}>
          <div className={styles.noticeCard}>
            Selamat datang di <strong>{BRAND_CONFIG.name}</strong>. Dokumen Syarat & Ketentuan ini
            merupakan perjanjian yang mengikat secara hukum antara Anda dan {BRAND_CONFIG.company}.
            Dengan mendaftar, mengakses, atau melakukan transaksi pembayaran di platform kami, Anda
            menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan di bawah ini.
          </div>

          {TERMS_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className={styles.sectionCard}
              tabIndex={-1}
            >
              <div className={styles.sectionHeader}>
                <span className={styles.sectionNumber}>{section.number}</span>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
              </div>
              <div>
                {section.content.map((paragraph, idx) => (
                  <p key={idx} className={styles.paragraph}>
                    {paragraph}
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
          <Link href="/privacy">Kebijakan Privasi</Link>
          <Link href="/register">Daftar Akun</Link>
          <Link href="/login">Login</Link>
        </div>
      </footer>
    </div>
  );
}
