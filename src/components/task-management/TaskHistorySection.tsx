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
          gap: '0.6rem',
          borderLeft: '2px solid var(--glass-border)',
          paddingLeft: '0.85rem',
          marginLeft: '0.35rem',
        }}
      >
        {histories.length === 0 ? (
          <p style={{ fontSize: '0.78rem', color: 'hsla(0,0%,100%,0.4)', margin: 0 }}>
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
                gap: '0.2rem',
                fontSize: '0.78rem',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '-1.25rem',
                  top: '0.25rem',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--secondary)',
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{h.user.name}</span>
                <span style={{ color: 'hsla(0,0%,100%,0.4)', fontSize: '0.72rem' }}>
                  • {formatDate(h.createdAt)}
                </span>
              </div>

              <div style={{ color: 'var(--fg-color)' }}>{h.action}</div>

              {(h.previousValue || h.newValue) && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'hsla(0,0%,100%,0.6)',
                    background: 'hsla(0,0%,100%,0.03)',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    marginTop: '0.15rem',
                  }}
                >
                  {h.previousValue && <div>Sebelumnya: {h.previousValue}</div>}
                  {h.newValue && <div>Menjadi: {h.newValue}</div>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
