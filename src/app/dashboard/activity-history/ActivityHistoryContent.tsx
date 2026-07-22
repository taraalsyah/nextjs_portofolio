'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatActivityDate } from '@/lib/activity';
import { History, Inbox } from 'lucide-react';
import { InlineSpinner } from '@/components/ui/loading';
import styles from './activity.module.css';

interface ActivityLogItem {
  id: number;
  action: string;
  description: string;
  createdAt: string;
}

interface ActivityHistoryContentProps {
  logs: ActivityLogItem[];
  totalItems: number;
  currentPage: number;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const delta = 1;

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      pages.push(i);
    } else if (
      (i === currentPage - delta - 1 && i > 1) ||
      (i === currentPage + delta + 1 && i < totalPages)
    ) {
      pages.push('...');
    }
  }

  return pages.filter((item, index, arr) => {
    if (item === '...' && arr[index - 1] === '...') {
      return false;
    }
    return true;
  });
}

function getBadgeClass(action: string): string {
  const act = action ? action.toUpperCase() : '';
  switch (act) {
    case 'CREATE':
      return styles.badgeCreate;
    case 'UPDATE':
      return styles.badgeUpdate;
    case 'DELETE':
      return styles.badgeDelete;
    case 'LOGIN':
      return styles.badgeLogin;
    case 'LOGOUT':
      return styles.badgeLogout;
    default:
      return styles.badgeCreate;
  }
}

export default function ActivityHistoryContent({
  logs,
  totalItems,
  currentPage,
}: ActivityHistoryContentProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalPages = Math.ceil(totalItems / 10);
  const itemFrom = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const itemTo = Math.min(currentPage * 10, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const handlePageNavigate = (targetPage: number) => {
    if (targetPage === currentPage || targetPage < 1 || targetPage > totalPages) return;
    startTransition(() => {
      router.push(`/dashboard/activity-history?page=${targetPage}`);
    });
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.tableCard} glass`}>
        {/* Header Section — Identical to User Management */}
        <div className={styles.tableHeaderSection}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(265, 90%, 80%)'
          }}>
            <History size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Riwayat Aktivitas</h2>
            <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.05rem 0 0', fontSize: '0.78rem' }}>
              Memantau log perubahan dan aktivitas penting pada akun Anda
            </p>
          </div>
        </div>

        {/* Content Section */}
        {totalItems === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={28} />
            <span className={styles.emptyStateText}>Belum ada aktivitas.</span>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative' }}>
              {isPending && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'hsla(230, 20%, 5%, 0.45)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '8px',
                }}>
                  <InlineSpinner size={28} color="var(--secondary)" />
                </div>
              )}

              {/* Logs Table Wrapper — Responsive Overflow Auto matching User Management */}
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.timeCol}>Waktu</th>
                      <th className={styles.actionCol}>Action</th>
                      <th className={styles.descCol}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const descLines = log.description.split('\n');

                      return (
                        <tr key={log.id}>
                          <td className={styles.timeCol}>
                            {formatActivityDate(new Date(log.createdAt))}
                          </td>
                          <td className={styles.actionCol}>
                            <span className={`${styles.badge} ${getBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className={styles.descCol}>
                            <ul className={styles.descriptionList}>
                              {descLines.map((line, idx) => (
                                <li key={idx} className={styles.descriptionItem}>
                                  {line}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls — Identical to User Management */}
            <div className={styles.paginationSection}>
              <div className={styles.paginationInfo}>
                Showing {itemFrom}–{itemTo} of {totalItems} activities
              </div>

              <div className={styles.paginationNav}>
                {currentPage === 1 ? (
                  <div className={`${styles.pageBtn} ${styles.disabledPageBtn}`}>
                    Previous
                  </div>
                ) : (
                  <button
                    onClick={() => handlePageNavigate(currentPage - 1)}
                    disabled={isPending}
                    className={styles.pageBtn}
                  >
                    Previous
                  </button>
                )}

                {pageNumbers.map((p, idx) => {
                  if (p === '...') {
                    return (
                      <span key={`ellipsis-${idx}`} className={styles.ellipsis}>
                        ...
                      </span>
                    );
                  }

                  const isCurrent = p === currentPage;

                  return (
                    <button
                      key={`page-${p}`}
                      onClick={() => handlePageNavigate(Number(p))}
                      disabled={isPending || isCurrent}
                      className={`${styles.pageBtn} ${isCurrent ? styles.activePageBtn : ''}`}
                    >
                      {p}
                    </button>
                  );
                })}

                {currentPage === totalPages ? (
                  <div className={`${styles.pageBtn} ${styles.disabledPageBtn}`}>
                    Next
                  </div>
                ) : (
                  <button
                    onClick={() => handlePageNavigate(currentPage + 1)}
                    disabled={isPending}
                    className={styles.pageBtn}
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
