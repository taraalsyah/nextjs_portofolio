import React from 'react';
import styles from './Skeleton.module.css';

interface CardSkeletonProps {
  variant?: 'stat' | 'default' | 'welcome' | 'settings';
  className?: string;
  height?: string;
}

export default function CardSkeleton({
  variant = 'default',
  className = '',
  height,
}: CardSkeletonProps) {
  if (variant === 'stat') {
    return (
      <div className={`${styles.statCardSkeleton} ${className}`} style={{ height: height || 'auto' }}>
        <div className={`${styles.skeleton} ${styles.skeletonCircle}`} style={{ width: '36px', height: '36px' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div className={styles.skeleton} style={{ width: '40%', height: '0.65rem' }} />
          <div className={styles.skeleton} style={{ width: '70%', height: '0.95rem' }} />
        </div>
      </div>
    );
  }

  if (variant === 'welcome') {
    return (
      <div className={`${styles.cardSkeleton} ${className}`} style={{ padding: '1.25rem' }}>
        <div className={styles.skeleton} style={{ width: '50%', height: '1.2rem' }} />
        <div className={styles.skeleton} style={{ width: '80%', height: '0.8rem', marginTop: '0.2rem' }} />
      </div>
    );
  }

  if (variant === 'settings') {
    return (
      <div className={`${styles.cardSkeleton} ${className}`} style={{ gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className={styles.skeleton} style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
          <div className={styles.skeleton} style={{ width: '30%', height: '0.9rem' }} />
        </div>
        <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '60%' }}>
            <div className={styles.skeleton} style={{ width: '50%', height: '0.85rem' }} />
            <div className={styles.skeleton} style={{ width: '90%', height: '0.7rem' }} />
          </div>
          <div className={styles.skeleton} style={{ width: '70px', height: '28px', borderRadius: '6px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.cardSkeleton} ${className}`} style={{ height: height || 'auto' }}>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div className={styles.skeleton} style={{ width: '18px', height: '18px', borderRadius: '4px' }} />
        <div className={styles.skeleton} style={{ width: '40%', height: '0.95rem' }} />
      </div>
      <div className={styles.skeleton} style={{ width: '100%', height: '0.75rem' }} />
      <div className={styles.skeleton} style={{ width: '85%', height: '0.75rem' }} />
      <div className={styles.skeleton} style={{ width: '60%', height: '0.75rem' }} />
    </div>
  );
}
