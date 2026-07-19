import React from 'react';
import { requireAuth } from '@/lib/session';
import { Settings, Shield, Bell, Database } from 'lucide-react';

export default async function SettingsPage() {
  await requireAuth();

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--glass-border)', boxShadow: '0 8px 24px -8px rgba(0, 0, 0, 0.4)' }}>
        {/* Settings Header */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
          <Settings className="text-gradient" size={22} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Pengaturan Akun</h2>
            <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.1rem 0 0', fontSize: '0.78rem' }}>
              Atur preferensi keamanan dan konfigurasi portal Anda
            </p>
          </div>
        </div>

        {/* Settings Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Group 1: Keamanan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--secondary)' }}>
              <Shield size={15} /> Keamanan & Akses
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>Ubah Kata Sandi</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.1rem' }}>Perbarui password Anda secara berkala demi keamanan</span>
              </div>
              <button style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--glass)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', color: 'var(--fg-color)' }}>
                Ubah
              </button>
            </div>
          </div>

          {/* Group 2: Notifikasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--secondary)' }}>
              <Bell size={15} /> Preferensi Notifikasi
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>Laporan Aktivitas Email</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.1rem' }}>Kirim log aktivitas login penting ke email terdaftar</span>
              </div>
              <div style={{ position: 'relative', width: '36px', height: '20px', background: 'var(--primary-glow)', borderRadius: '100px', cursor: 'pointer', border: '1px solid hsla(265, 80%, 60%, 0.4)', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* Group 3: Database & Integrasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--secondary)' }}>
              <Database size={15} /> Penyimpanan & Data
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>Prisma Client Engine</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.1rem' }}>Konektor TiDB Cloud Serverless (MySQL) aktif</span>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '100px', background: 'hsla(180, 70%, 50%, 0.15)', color: 'hsl(180, 90%, 80%)', border: '1px solid hsla(180, 70%, 50%, 0.2)', flexShrink: 0 }}>
                Terkoneksi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
