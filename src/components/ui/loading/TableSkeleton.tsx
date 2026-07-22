import React from 'react';
import styles from './Skeleton.module.css';

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  headers?: string[];
  title?: string;
  description?: string;
  className?: string;
}

export default function TableSkeleton({
  columns = 5,
  rows = 10,
  headers,
  title,
  description,
  className = '',
}: TableSkeletonProps) {
  const defaultHeaders = Array.from({ length: columns }).map((_, i) => `Kolom ${i + 1}`);
  const displayHeaders = headers || defaultHeaders;
  const colCount = displayHeaders.length;

  return (
    <div className={`${styles.tableCard} ${className}`}>
      {/* Header section if title/desc provided */}
      {(title || description) && (
        <div className={styles.tableHeaderSkeleton}>
          <div className={`${styles.skeleton} ${styles.skeletonCircle}`} style={{ width: '36px', height: '36px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', width: '50%' }}>
            {title ? (
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</span>
            ) : (
              <div className={styles.skeleton} style={{ width: '40%', height: '1.1rem' }} />
            )}
            {description ? (
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)', fontSize: '0.78rem' }}>{description}</span>
            ) : (
              <div className={styles.skeleton} style={{ width: '70%', height: '0.78rem' }} />
            )}
          </div>
        </div>
      )}

      {/* Table Skeleton Structure */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {displayHeaders.map((h, idx) => (
                <th key={idx}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx}>
                {Array.from({ length: colCount }).map((_, cIdx) => (
                  <td key={cIdx}>
                    <div
                      className={styles.skeleton}
                      style={{
                        width: cIdx === 0 ? '75%' : cIdx === colCount - 1 ? '40%' : '60%',
                        height: '0.9rem',
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)' }}>
        <div className={styles.skeleton} style={{ width: '150px', height: '0.8rem' }} />
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeleton} style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
