import React from 'react';
import styles from './Skeleton.module.css';

interface InlineSpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export default function InlineSpinner({
  size = 16,
  color = 'currentColor',
  className = '',
}: InlineSpinnerProps) {
  return (
    <span
      className={`${styles.spinner} ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderWidth: size > 24 ? '3px' : '2px',
        color: color,
      }}
      aria-label="Loading"
      role="status"
    />
  );
}
