'use client';

import React from 'react';
import { User } from 'lucide-react';

interface ProfileHeaderProps {
  name?: string | null;
}

export default function ProfileHeader({ name }: ProfileHeaderProps) {
  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2rem' }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '12px',
        background: 'var(--primary-glow)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'hsl(265, 90%, 80%)'
      }}>
        <User size={24} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Profil Saya</h2>
        <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.15rem 0 0', fontSize: '0.85rem' }}>
          Kelola informasi identitas, foto profil, dan data kontak Anda
        </p>
      </div>
    </div>
  );
}
