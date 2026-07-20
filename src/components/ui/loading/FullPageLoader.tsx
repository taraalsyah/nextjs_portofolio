import React from 'react';
import InlineSpinner from './InlineSpinner';
import styles from './Skeleton.module.css';

interface FullPageLoaderProps {
  label?: string;
}

export default function FullPageLoader({ label = 'Memuat dashboard...' }: FullPageLoaderProps) {
  return (
    <div className={styles.fullPageLoader}>
      <div className={styles.loaderBackdrop} />
      <InlineSpinner size={42} color="var(--secondary, hsl(180, 70%, 50%))" />
      {label && (
        <span
          style={{
            fontSize: '0.85rem',
            color: 'hsla(0, 0%, 100%, 0.6)',
            letterSpacing: '0.02em',
            zIndex: 1,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}
