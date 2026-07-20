import React from 'react';
import CardSkeleton from './CardSkeleton';
import TableSkeleton from './TableSkeleton';
import FormSkeleton from './FormSkeleton';
import styles from './Skeleton.module.css';

interface PageSkeletonProps {
  type?: 'dashboard' | 'table' | 'form' | 'matrix';
  title?: string;
  description?: string;
  tableHeaders?: string[];
}

export default function PageSkeleton({
  type = 'dashboard',
  title,
  description,
  tableHeaders,
}: PageSkeletonProps) {
  if (type === 'dashboard') {
    return (
      <div className={styles.fadeIn} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Welcome Section Skeleton */}
        <CardSkeleton variant="welcome" />

        {/* 3 Metric Stat Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <CardSkeleton variant="stat" />
          <CardSkeleton variant="stat" />
          <CardSkeleton variant="stat" />
        </div>

        {/* 2 Main Info Panel Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
          <CardSkeleton variant="default" height="200px" />
          <CardSkeleton variant="default" height="200px" />
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={styles.fadeIn}>
        <TableSkeleton
          title={title}
          description={description}
          headers={tableHeaders}
          rows={10}
        />
      </div>
    );
  }

  if (type === 'form') {
    return (
      <div className={styles.fadeIn} style={{ maxWidth: '720px', margin: '0 auto' }}>
        <FormSkeleton hasAvatar={true} fields={7} />
      </div>
    );
  }

  if (type === 'matrix') {
    return (
      <div className={styles.fadeIn} style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem' }}>
        {/* Left Role List Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className={styles.skeleton} style={{ width: '100%', height: '36px', borderRadius: '8px' }} />
          <div className={styles.cardSkeleton} style={{ padding: '0.5rem', gap: '0.5rem' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.skeleton} style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
            ))}
          </div>
        </div>

        {/* Right Permission Matrix Skeleton */}
        <TableSkeleton
          columns={5}
          rows={6}
          headers={['Module', 'View', 'Create', 'Update', 'Delete']}
          title={title || 'Permission Matrix'}
        />
      </div>
    );
  }

  return <div className={styles.fadeIn}><CardSkeleton /></div>;
}
