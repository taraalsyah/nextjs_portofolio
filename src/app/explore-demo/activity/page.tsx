'use client';

import React from 'react';
import { DemoProvider } from '@/context/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { History } from 'lucide-react';
import styles from '@/components/demo/demo.module.css';

interface DemoActivityLog {
  id: string;
  waktu: string;
  action: 'LOGIN' | 'CREATE' | 'LOGOUT' | 'UPDATE' | 'DELETE';
  description: string;
}

const STATIC_DEMO_ACTIVITY_LOGS: DemoActivityLog[] = [
  {
    id: 'log-1',
    waktu: '31 Agustus 2026 23:45:22 WIB',
    action: 'LOGIN',
    description: 'Login via Linked Google Account (tara.alsyah@icode.co.id)',
  },
  {
    id: 'log-2',
    waktu: '31 Agustus 2026 20:40:52 WIB',
    action: 'CREATE',
    description: 'Task Activity: Membuat Task Baru: TSK-2070003 - "Buat explore demo"',
  },
  {
    id: 'log-3',
    waktu: '31 Agustus 2026 20:39:44 WIB',
    action: 'LOGIN',
    description: 'Login via Linked Google Account (tara.alsyah@icode.co.id)',
  },
  {
    id: 'log-4',
    waktu: '31 Agustus 2026 16:26:08 WIB',
    action: 'LOGOUT',
    description: 'Logout',
  },
  {
    id: 'log-5',
    waktu: '31 Agustus 2026 15:46:07 WIB',
    action: 'LOGIN',
    description: 'Login via Linked Google Account (tara.alsyah@icode.co.id)',
  },
  {
    id: 'log-6',
    waktu: '31 Agustus 2026 13:37:30 WIB',
    action: 'LOGOUT',
    description: 'Logout',
  },
  {
    id: 'log-7',
    waktu: '31 Agustus 2026 13:34:20 WIB',
    action: 'LOGIN',
    description: 'Login via Linked Google Account (tara.alsyah@icode.co.id)',
  },
  {
    id: 'log-8',
    waktu: '31 Agustus 2026 10:18:28 WIB',
    action: 'UPDATE',
    description: 'Task Activity: Menambahkan komentar pada task',
  },
  {
    id: 'log-9',
    waktu: '31 Agustus 2026 10:13:48 WIB',
    action: 'CREATE',
    description: 'Task Activity: Membuat Task Baru: TSK-2070002 - "Nih"',
  },
];

function ActivityHistoryContent() {
  const renderActionBadge = (action: DemoActivityLog['action']) => {
    switch (action) {
      case 'LOGIN':
        return (
          <span
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}
          >
            LOGIN
          </span>
        );
      case 'CREATE':
        return (
          <span
            style={{
              background: '#f0fdf4',
              color: '#16a34a',
              border: '1px solid #bbf7d0',
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}
          >
            CREATE
          </span>
        );
      case 'LOGOUT':
        return (
          <span
            style={{
              background: '#f1f5f9',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}
          >
            LOGOUT
          </span>
        );
      case 'UPDATE':
        return (
          <span
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: '1px solid #bfdbfe',
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}
          >
            UPDATE
          </span>
        );
      case 'DELETE':
        return (
          <span
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              padding: '0.2rem 0.6rem',
              borderRadius: 6,
              fontSize: '0.725rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
            }}
          >
            DELETE
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Outer Card Container matching Screenshot */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '1.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Header Title Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <History size={20} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Riwayat Aktivitas
          </h2>
        </div>

        {/* Table Container matching Screenshot */}
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#ffffff',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th
                  style={{
                    padding: '0.85rem 1.25rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                    width: '30%',
                  }}
                >
                  WAKTU
                </th>
                <th
                  style={{
                    padding: '0.85rem 1.25rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                    width: '18%',
                  }}
                >
                  ACTION
                </th>
                <th
                  style={{
                    padding: '0.85rem 1.25rem',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: '#64748b',
                    letterSpacing: '0.05em',
                  }}
                >
                  DESCRIPTION
                </th>
              </tr>
            </thead>
            <tbody>
              {STATIC_DEMO_ACTIVITY_LOGS.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td
                    style={{
                      padding: '0.85rem 1.25rem',
                      fontSize: '0.875rem',
                      color: '#64748b',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {log.waktu}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    {renderActionBadge(log.action)}
                  </td>
                  <td
                    style={{
                      padding: '0.85rem 1.25rem',
                      fontSize: '0.875rem',
                      color: '#0f172a',
                      fontWeight: 600,
                    }}
                  >
                    {log.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ExploreDemoActivityPage() {
  return (
    <DemoProvider>
      <DemoLayout pageTitle="Activity History">
        <ActivityHistoryContent />
      </DemoLayout>
    </DemoProvider>
  );
}
