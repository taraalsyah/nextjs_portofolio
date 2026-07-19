import React from 'react';
import { requireAuth } from '@/lib/session';
import { Settings, Shield, Bell, Eye, Database } from 'lucide-react';

export default async function SettingsPage() {
  // Verifikasi session server-side
  await requireAuth();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)' }}>
        {/* Settings Header */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
          <Settings className="text-gradient" size={32} />
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>Pengaturan Akun</h2>
            <p style={{ color: 'hsla(0, 0%, 100%, 0.5)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
              Atur preferensi keamanan dan konfigurasi portal Anda
            </p>
          </div>
        </div>

        {/* Settings Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Group 1: Keamanan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--secondary)' }}>
              <Shield size={18} /> Keamanan & Akses
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600 }}>Ubah Kata Sandi</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.15rem' }}>Perbarui password Anda secara berkala demi keamanan</span>
              </div>
              <button style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass)', fontWeight: 600, fontSize: '0.85rem' }}>
                Ubah
              </button>
            </div>
          </div>

          {/* Group 2: Notifikasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--secondary)' }}>
              <Bell size={18} /> Preferensi Notifikasi
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600 }}>Laporan Aktivitas Email</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.15rem' }}>Kirim log aktivitas login penting langsung ke email terdaftar</span>
              </div>
              <div style={{ position: 'relative', width: '40px', height: '24px', background: 'var(--primary-glow)', borderRadius: '100px', cursor: 'pointer', border: '1px solid hsla(265, 80%, 60%, 0.4)' }}>
                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '18px', height: '18px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* Group 3: Database & Integrasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--secondary)' }}>
              <Database size={18} /> Penyimpanan & Data
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.95rem', fontWeight: 600 }}>Prisma Client Engine</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.15rem' }}>Konektor TiDB Cloud Serverless (MySQL) aktif</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', background: 'hsla(180, 70%, 50%, 0.15)', color: 'hsl(180, 90%, 80%)', border: '1px solid hsla(180, 70%, 50%, 0.2)' }}>
                Terkoneksi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
