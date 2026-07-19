'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <title>403 Forbidden | Dashboard</title>
      <div className="glass" style={{
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '400px',
        textAlign: 'center',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 24px -8px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'hsla(330, 90%, 65%, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent)'
        }}>
          <ShieldAlert size={24} />
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', margin: 0 }}>
            403 - Forbidden
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'hsla(0, 0%, 100%, 0.6)', marginTop: '0.5rem', lineHeight: '1.4' }}>
            You don't have permission to access this page.
          </p>
        </div>

        <Link
          href="/dashboard"
          style={{
            marginTop: '0.5rem',
            padding: '0.45rem 1.25rem',
            borderRadius: '6px',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            color: 'var(--fg-color)',
            fontSize: '0.8rem',
            fontWeight: 600,
            transition: 'var(--transition)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--secondary)';
            e.currentTarget.style.color = 'var(--secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--glass-border)';
            e.currentTarget.style.color = 'var(--fg-color)';
          }}
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
