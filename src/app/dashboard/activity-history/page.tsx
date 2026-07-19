import React from 'react';
import Link from 'next/link';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatActivityDate } from '@/lib/activity';
import { History, Inbox } from 'lucide-react';
import styles from './activity.module.css';

export const metadata = {
  title: 'Riwayat Aktivitas | Dashboard',
  description: 'Lihat seluruh riwayat aktivitas akun Anda.',
};

/**
 * Calculates page numbers to display in a simplified pagination listing:
 * e.g. "1 ... 5 6 7 ... 20"
 */
function getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
  const pages: (number | string)[] = [];
  const delta = 1; // Show current page +/- delta

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

export default async function ActivityHistoryPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 1. Verifikasi session di server side
  const sessionUser = await requireAuth();
  const userId = parseInt((sessionUser as any).id);

  // Await searchParams as required by Next.js 15+ async APIs
  const searchParams = await props.searchParams;
  let currentPage = parseInt(searchParams.page || '1', 10);
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  // 2. Query total items untuk pagination
  const totalItems = await prisma.activityLog.count({
    where: { userId },
  });

  const totalPages = Math.ceil(totalItems / 10);

  // Jika halaman melebihi halaman terakhir, arahkan secara anggun ke halaman terakhir
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  // 3. Ambil data logs untuk halaman saat ini
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * 10,
    take: 10,
  });

  // Hitung rentang index item yang sedang ditampilkan
  const itemFrom = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const itemTo = Math.min(currentPage * 10, totalItems);

  // Daftar nomor halaman yang akan ditampilkan
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className={styles.container}>
      <div className={`${styles.tableCard} glass`}>
        {/* Header */}
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

        {/* Logs Table */}
        {totalItems === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={28} />
            <span className={styles.emptyStateText}>No activity history found.</span>
          </div>
        ) : (
          <>
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
                    let badgeClass = styles.badgeCreate;
                    if (log.action === 'UPDATE') {
                      badgeClass = styles.badgeUpdate;
                    } else if (log.action === 'DELETE') {
                      badgeClass = styles.badgeDelete;
                    } else if (log.action === 'LOGIN') {
                      badgeClass = styles.badgeCreate; // login uses create badge design (blue/teal)
                    } else if (log.action === 'LOGOUT') {
                      badgeClass = styles.badgeDelete; // logout uses delete badge design (rose/pink)
                    }

                    // Split newlines into clean list items
                    const descLines = log.description.split('\n');

                    return (
                      <tr key={log.id}>
                        <td className={styles.timeCol}>{formatActivityDate(log.createdAt)}</td>
                        <td className={styles.actionCol}>
                          <span className={`${styles.badge} ${badgeClass}`}>
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

            {/* Pagination Controls */}
            <div className={styles.paginationSection}>
              <div className={styles.paginationInfo}>
                Showing {itemFrom}–{itemTo} of {totalItems} activities
              </div>

              <div className={styles.paginationNav}>
                {/* Previous Button */}
                {currentPage === 1 ? (
                  <div className={`${styles.pageBtn} ${styles.disabledPageBtn}`}>
                    Previous
                  </div>
                ) : (
                  <Link href={`/dashboard/activity-history?page=${currentPage - 1}`} className={styles.pageBtn}>
                    Previous
                  </Link>
                )}

                {/* Page Numbers */}
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
                    <Link
                      key={`page-${p}`}
                      href={`/dashboard/activity-history?page=${p}`}
                      className={`${styles.pageBtn} ${isCurrent ? styles.activePageBtn : ''}`}
                    >
                      {p}
                    </Link>
                  );
                })}

                {/* Next Button */}
                {currentPage === totalPages ? (
                  <div className={`${styles.pageBtn} ${styles.disabledPageBtn}`}>
                    Next
                  </div>
                ) : (
                  <Link href={`/dashboard/activity-history?page=${currentPage + 1}`} className={styles.pageBtn}>
                    Next
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
