import React from 'react';
import { requireAuth } from '@/lib/session';
import { User, Mail, Shield, Calendar, UserCheck } from 'lucide-react';

export default async function ProfilePage() {
  const user = await requireAuth();

  const formattedDate = (user as any).createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' }}>
        {/* Profile Header */}
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800,
            color: 'white',
            border: '2px solid var(--glass-border)',
            boxShadow: '0 8px 16px var(--secondary-glow)'
          }}>
            {user.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }} className="text-gradient">
              {user.name}
            </h2>
            <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              ID Akun: #{(user as any).id}
            </p>
          </div>
        </div>

        {/* Profile Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Field 1: Nama */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}><User size={20} /></div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Nama Lengkap</label>
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{user.name}</span>
            </div>
          </div>

          {/* Field 2: Email */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}><Mail size={20} /></div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Alamat Email</label>
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{user.email}</span>
            </div>
          </div>

          {/* Field 3: Role */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}><Shield size={20} /></div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Peran Pengguna</label>
              <span style={{
                display: 'inline-block',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '100px',
                background: 'var(--primary-glow)',
                color: 'hsl(265, 90%, 80%)',
                border: '1px solid hsla(265, 80%, 60%, 0.2)',
                marginTop: '0.25rem'
              }}>
                {(user as any).role || 'user'}
              </span>
            </div>
          </div>

          {/* Field 4: Status */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}><UserCheck size={20} /></div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Status Verifikasi</label>
              <span style={{
                display: 'inline-block',
                fontSize: '0.85rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
                borderRadius: '100px',
                background: 'hsla(180, 70%, 50%, 0.15)',
                color: 'hsl(180, 90%, 80%)',
                border: '1px solid hsla(180, 70%, 50%, 0.2)',
                marginTop: '0.25rem'
              }}>
                {(user as any).status === 'ACTIVE' ? 'Aktif & Terverifikasi' : 'Tertunda'}
              </span>
            </div>
          </div>

          {/* Field 5: Joined At */}
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
            <div style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}><Calendar size={20} /></div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.2rem' }}>Tanggal Registrasi</label>
              <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
