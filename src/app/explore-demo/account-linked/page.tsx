'use client';

import React from 'react';
import { DemoProvider } from '@/context/DemoContext';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { Link2, CheckCircle2, XCircle } from 'lucide-react';
import styles from '@/components/demo/demo.module.css';

interface LinkedAccount {
  id: string;
  name: string;
  isConnected: boolean;
  accountHandle?: string;
  iconBg: string;
  iconText: string;
}

const STATIC_LINKED_ACCOUNTS: LinkedAccount[] = [
  {
    id: 'google',
    name: 'Google',
    isConnected: true,
    accountHandle: 'tara.demo@example.com',
    iconBg: '#ea4335',
    iconText: 'G',
  },
  {
    id: 'github',
    name: 'GitHub',
    isConnected: true,
    accountHandle: 'tara-demo',
    iconBg: '#24292e',
    iconText: 'GH',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    isConnected: false,
    iconBg: '#00a4ef',
    iconText: 'MS',
  },
];

function AccountLinkedContent() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header Card */}
      <div className={styles.kanbanHeaderCard}>
        <h2 className={styles.kanbanTitleText}>
          <Link2 size={22} color="#2563eb" /> Account Linked & Integrations
        </h2>
        <p className={styles.kanbanSubtext}>
          Daftar integrasi akun OAuth pihak ketiga yang terhubung (Static Display Only).
        </p>
      </div>

      {/* Linked Accounts List Container */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {STATIC_LINKED_ACCOUNTS.map((acc) => (
          <div
            key={acc.id}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: acc.iconBg,
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {acc.iconText}
              </div>

              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  {acc.name}
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '0.15rem' }}>
                  {acc.isConnected ? acc.accountHandle : 'Belum terhubung'}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {acc.isConnected ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#16a34a',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 999,
                  }}
                >
                  <CheckCircle2 size={14} /> Connected
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#94a3b8',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.75rem',
                    borderRadius: 999,
                  }}
                >
                  <XCircle size={14} /> Not Connected
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ExploreDemoAccountLinkedPage() {
  return (
    <DemoProvider>
      <DemoLayout pageTitle="Account Linked">
        <AccountLinkedContent />
      </DemoLayout>
    </DemoProvider>
  );
}
