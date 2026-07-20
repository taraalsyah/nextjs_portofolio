import React from 'react';
import styles from './Skeleton.module.css';

interface FormSkeletonProps {
  fields?: number;
  hasAvatar?: boolean;
  className?: string;
}

export default function FormSkeleton({
  fields = 6,
  hasAvatar = false,
  className = '',
}: FormSkeletonProps) {
  return (
    <div className={`${styles.formSkeleton} ${className}`}>
      {/* Header / Mode badge skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div className={styles.skeleton} style={{ width: '90px', height: '24px', borderRadius: '100px' }} />
        <div className={styles.skeleton} style={{ width: '60px', height: '28px', borderRadius: '6px' }} />
      </div>

      {/* Optional Avatar Section */}
      {hasAvatar && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem 0' }}>
          <div className={`${styles.skeleton} ${styles.skeletonCircle}`} style={{ width: '96px', height: '96px' }} />
          <div className={styles.skeleton} style={{ width: '120px', height: '0.8rem' }} />
        </div>
      )}

      {/* Inputs Grid */}
      <div className={styles.formGrid}>
        {Array.from({ length: fields }).map((_, idx) => (
          <div key={idx} className={styles.inputGroup}>
            <div className={styles.skeleton} style={{ width: '35%', height: '0.8rem', marginBottom: '0.2rem' }} />
            <div className={styles.skeleton} style={{ width: '100%', height: '38px', borderRadius: '8px' }} />
          </div>
        ))}
      </div>

      {/* Form Action Buttons Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
        <div className={styles.skeleton} style={{ width: '80px', height: '36px', borderRadius: '8px' }} />
        <div className={styles.skeleton} style={{ width: '140px', height: '36px', borderRadius: '8px' }} />
      </div>
    </div>
  );
}
