import React from 'react';
import { requireAuth } from '@/lib/session';
import {
  Shield,
  Activity,
  CheckCircle,
  Clock,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireAuth();

  const memberSince = (user as any).createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Maret 2026';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Welcome Section */}
      <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
          Selamat datang kembali, <span className="text-gradient">{user.name}</span>! 👋
        </h2>
        <p style={{ color: 'hsla(0, 0%, 100%, 0.55)', marginTop: '0.25rem', fontSize: '0.82rem', margin: '0.25rem 0 0' }}>
          Semua sistem berjalan normal. Kelola akun Anda secara aman melalui dashboard ini.
        </p>
      </div>

      {/* Grid Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Card 1: Active Role */}
        <div className="glass" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(265, 90%, 80%)',
            flexShrink: 0,
          }}>
            <Shield size={18} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsla(0, 0%, 100%, 0.4)', fontWeight: 600 }}>Hak Akses</span>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.05rem' }}>
              {(user as any).role || 'user'}
            </span>
          </div>
        </div>

        {/* Card 2: Verification status */}
        <div className="glass" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'hsla(180, 70%, 50%, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)',
            flexShrink: 0,
          }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsla(0, 0%, 100%, 0.4)', fontWeight: 600 }}>Status Akun</span>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.05rem' }}>
              {(user as any).status === 'ACTIVE' ? 'Aktif & Terverifikasi' : 'Tertunda'}
            </span>
          </div>
        </div>

        {/* Card 3: Membership Date */}
        <div className="glass" style={{ padding: '1rem', borderRadius: '10px', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'hsla(330, 90%, 65%, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)',
            flexShrink: 0,
          }}>
            <Clock size={18} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsla(0, 0%, 100%, 0.4)', fontWeight: 600 }}>Bergabung Sejak</span>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.05rem' }}>
              {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Main Info Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Info panel left */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <UserIcon size={16} style={{ color: 'var(--secondary)' }} /> Ringkasan Profil
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>ID Pengguna</span>
              <span style={{ fontWeight: 600 }}>{(user as any).id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>Nama Lengkap</span>
              <span style={{ fontWeight: 600 }}>{user.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.15rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>Alamat Email</span>
              <span style={{ fontWeight: 600 }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* System log right */}
        <div className="glass" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
            <Activity size={16} style={{ color: 'var(--accent)' }} /> Aktivitas Terkini
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ color: 'var(--secondary)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500 }}>Berhasil masuk sistem</span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsla(0, 0%, 100%, 0.4)' }}>Baru saja</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <AlertCircle size={14} style={{ color: 'var(--accent)', marginTop: '0.15rem', flexShrink: 0 }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500 }}>Verifikasi email berhasil dilakukan</span>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsla(0, 0%, 100%, 0.4)' }}>Beberapa menit yang lalu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
