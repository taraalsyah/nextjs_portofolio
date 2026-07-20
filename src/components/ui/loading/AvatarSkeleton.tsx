import React from 'react';
import styles from './Skeleton.module.css';

interface AvatarSkeletonProps {
  size?: number | string;
  shape?: 'circle' | 'square';
  className?: string;
}

export default function AvatarSkeleton({
  size = 40,
  shape = 'circle',
  className = '',
}: AvatarSkeletonProps) {
  const sizeValue = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      className={`${styles.skeleton} ${shape === 'circle' ? styles.skeletonCircle : ''} ${className}`}
      style={{
        width: sizeValue,
        height: sizeValue,
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  );
}
