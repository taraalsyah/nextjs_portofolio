import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import styles from './PromoCard.module.css';

export const PromoCard: React.FC = () => {
  return (
    <aside className={styles.card} aria-label="Promosi TaskTuntas">
      <div className={styles.badge}>
        <Sparkles size={13} aria-hidden="true" />
        <span>Solusi Manajemen Proyek</span>
      </div>
      <h4 className={styles.title}>TaskTuntas</h4>
      <p className={styles.description}>
        Kelola proyek tim, workflow approval, dan pantau progres task harian dalam satu platform.
      </p>
      <ul className={styles.featureList}>
        <li className={styles.featureItem}>
          <Check size={14} className={styles.checkIcon} aria-hidden="true" /> 
          <span>Papan kanban interaktif</span>
        </li>
        <li className={styles.featureItem}>
          <Check size={14} className={styles.checkIcon} aria-hidden="true" /> 
          <span>Dual-layer approval workflow</span>
        </li>
        <li className={styles.featureItem}>
          <Check size={14} className={styles.checkIcon} aria-hidden="true" /> 
          <span>Integrasi laporan otomatis</span>
        </li>
      </ul>
      <Link href="/register" className={styles.ctaButton}>
        Coba Gratis <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </aside>
  );
};

export default PromoCard;
