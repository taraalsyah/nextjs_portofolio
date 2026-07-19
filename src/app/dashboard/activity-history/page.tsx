import React from 'react';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatActivityDate } from '@/lib/activity';
import { History, Inbox } from 'lucide-react';
import styles from './activity.module.css';

export const metadata = {
  title: 'Riwayat Aktivitas | Dashboard',
  description: 'Lihat seluruh riwayat aktivitas akun Anda.',
};

export default async function ActivityHistoryPage() {
  // 1. Verifikasi session di server side
  const sessionUser = await requireAuth();
  const userId = parseInt((sessionUser as any).id);

  // 2. Ambil data logs dari database diurutkan dari yang terbaru
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

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
        {logs.length === 0 ? (
          <div className={styles.emptyState}>
            <Inbox size={28} />
            <span className={styles.emptyStateText}>Belum ada riwayat aktivitas yang tercatat.</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
