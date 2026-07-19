'use client';

import React from 'react';
import { User } from 'lucide-react';

interface ProfileHeaderProps {
  name?: string | null;
}

export default function ProfileHeader({ name }: ProfileHeaderProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
        <User size={18} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Profil Saya</h2>
        <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.05rem 0 0', fontSize: '0.78rem' }}>
          Kelola informasi identitas, foto profil, dan data kontak Anda
        </p>
      </div>
    </div>
  );
}
