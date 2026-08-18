import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Settings, Shield, Bell, Database, Mail } from 'lucide-react';

export default async function SettingsPage() {
  // 1. Verifikasi otorisasi session di backend & ambil ID user terverifikasi
  const sessionUser = await requirePermission('Settings', 'View');
  const sessionUserId = parseInt((sessionUser as any).id, 10);

  // 2. Query data user aktif dari DB menggunakan filter id dari session
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error('Data akun pengguna tidak ditemukan.');
  }

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
              <Shield size={15} /> Keamanan & Akses Akun
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>Hak Akses Role Aktif</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.1rem' }}>
                  Akses modul saat ini dibatasi untuk role ({user.role})
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--glass)', border: '1px solid var(--glass-border)' }}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Group 2: Notifikasi Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--secondary)' }}>
              <Bell size={15} /> Preferensi Notifikasi
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>Laporan Aktivitas Email</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.1rem' }}>
                  Kirim log aktivitas login penting ke: <strong style={{ color: 'var(--fg-color)' }}>{user.email}</strong>
                </span>
              </div>
              <div style={{ position: 'relative', width: '36px', height: '20px', background: 'var(--info-subtle)', borderRadius: '100px', cursor: 'pointer', border: '1px solid var(--border)', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
            </div>
          </div>

          {/* Group 3: Database & Integrasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--secondary)' }}>
              <Database size={15} /> Penyimpanan & Data Terisolasi
            </h3>
            <div style={{ background: 'hsla(0, 0%, 100%, 0.01)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600 }}>Isolasi Data Sesi (ID: {user.id})</span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: 'hsla(0, 0%, 100%, 0.4)', marginTop: '0.1rem' }}>
                  Seluruh data dibatasi strictly berdasarkan NextAuth Session ID
                </span>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.5rem', borderRadius: '100px', background: 'hsla(180, 70%, 50%, 0.15)', color: 'hsl(180, 90%, 80%)', border: '1px solid hsla(180, 70%, 50%, 0.2)', flexShrink: 0 }}>
                Aman & Privat
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
