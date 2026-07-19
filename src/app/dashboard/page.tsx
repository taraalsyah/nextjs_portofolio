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
import styles from './dashboard.module.css';

export default async function DashboardPage() {
  // Verifikasi session server-side. Jika session tidak valid, di-redirect ke login
  const user = await requireAuth();

  // Hitung durasi bergabung (dummy info, simple layout)
  const memberSince = (user as any).createdAt
    ? new Date((user as any).createdAt).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Maret 2026';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Section */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
          Selamat datang kembali, <span className="text-gradient">{user.name}</span>! 👋
        </h2>
        <p style={{ color: 'hsla(0, 0%, 100%, 0.6)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
          Semua sistem berjalan normal. Kelola akun Anda secara aman melalui dashboard baru ini.
        </p>
      </div>

      {/* Grid Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Card 1: Active Role */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(265, 90%, 80%)'
          }}>
            <Shield size={24} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsla(0, 0%, 100%, 0.4)', fontWeight: 600 }}>Tingkat Hak Akses</span>
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.15rem' }}>
              {(user as any).role || 'user'}
            </span>
          </div>
        </div>

        {/* Card 2: Verification status */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'hsla(180, 70%, 50%, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)'
          }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsla(0, 0%, 100%, 0.4)', fontWeight: 600 }}>Status Akun</span>
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.15rem' }}>
              {(user as any).status === 'ACTIVE' ? 'Aktif & Terverifikasi' : 'Tertunda'}
            </span>
          </div>
        </div>

        {/* Card 3: Membership Date */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'hsla(330, 90%, 65%, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent)'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsla(0, 0%, 100%, 0.4)', fontWeight: 600 }}>Bergabung Sejak</span>
            <span style={{ display: 'block', fontSize: '1.2rem', fontWeight: 700, marginTop: '0.15rem' }}>
              {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Main Info Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem'
      }}>
        {/* Info panel left */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <UserIcon size={20} style={{ color: 'var(--secondary)' }} /> Ringkasan Profil
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>ID Pengguna</span>
              <span style={{ fontWeight: 600 }}>{(user as any).id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>Nama Lengkap</span>
              <span style={{ fontWeight: 600 }}>{user.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
              <span style={{ color: 'hsla(0, 0%, 100%, 0.5)' }}>Alamat Email</span>
              <span style={{ fontWeight: 600 }}>{user.email}</span>
            </div>
          </div>
        </div>

        {/* System log right */}
        <div className="glass" style={{ padding: '2rem', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Activity size={20} style={{ color: 'var(--accent)' }} /> Aktivitas Terkini
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ color: 'var(--secondary)', marginTop: '0.25rem' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500 }}>Berhasil masuk sistem</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsla(0, 0%, 100%, 0.4)' }}>Baru saja</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <AlertCircle size={16} style={{ color: 'var(--accent)', marginTop: '0.25rem' }} />
              <div>
                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500 }}>Verifikasi email berhasil dilakukan</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsla(0, 0%, 100%, 0.4)' }}>Beberapa menit yang lalu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
