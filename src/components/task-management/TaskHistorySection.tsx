'use client';

import React from 'react';
import { History, Clock, User } from 'lucide-react';
import styles from '@/app/dashboard/task-management/task.module.css';

interface HistoryItem {
  id: number;
  action: string;
  fieldName?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  user: { id: number; name: string };
}

interface TaskHistorySectionProps {
  histories: HistoryItem[];
}

export function TaskHistorySection({ histories }: TaskHistorySectionProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700 }}>
        Riwayat Aktivitas ({histories.length})
      </h4>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          borderLeft: '2px solid var(--border)',
          paddingLeft: '1rem',
          marginLeft: '0.4rem',
        }}
      >
        {histories.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', margin: 0 }}>
            Belum ada riwayat aktivitas pada task ini.
          </p>
        ) : (
          histories.map((h) => (
            <div
              key={h.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                fontSize: '0.8rem',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '-1.35rem',
                  top: '0.25rem',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  boxShadow: '0 0 0 3px var(--surface-muted)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--foreground)' }}>
                  👤 {h.user.name}
                </span>
                <span style={{ color: 'var(--muted-foreground)', fontSize: '0.74rem' }}>
                  • {formatDate(h.createdAt)}
                </span>
              </div>

              <div style={{ color: 'var(--foreground)', fontSize: '0.82rem', lineHeight: '1.4' }}>
                {h.action}
              </div>

              {(h.previousValue || h.newValue) && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--foreground)',
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: '6px',
                    marginTop: '0.2rem',
                    lineHeight: '1.4',
                  }}
                >
                  {h.previousValue && (
                    <div style={{ color: 'var(--muted-foreground)' }}>
                      <strong>Sebelumnya:</strong> {h.previousValue}
                    </div>
                  )}
                  {h.newValue && (
                    <div style={{ color: 'var(--foreground)', marginTop: h.previousValue ? '0.15rem' : 0 }}>
                      <strong>Menjadi:</strong> {h.newValue}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
