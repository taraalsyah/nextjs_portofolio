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
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
        {/* Settings Header */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <Settings style={{ color: 'var(--primary)' }} size={22} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>Pengaturan Akun</h2>
            <p style={{ color: 'var(--muted-foreground)', margin: '0.1rem 0 0', fontSize: '0.78rem' }}>
              Atur preferensi keamanan dan konfigurasi portal Anda
            </p>
          </div>
        </div>

        {/* Settings Groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Group 1: Keamanan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--foreground)' }}>
              <Shield size={15} style={{ color: 'var(--primary)' }} /> Keamanan & Akses Akun
            </h3>
            <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>Hak Akses Role Aktif</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Akses modul saat ini dibatasi untuk role ({user.role})
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Group 2: Notifikasi Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--foreground)' }}>
              <Bell size={15} style={{ color: 'var(--primary)' }} /> Preferensi Notifikasi
            </h3>
            <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>Laporan Aktivitas Email</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Kirim log aktivitas login penting ke: <strong style={{ color: 'var(--foreground)' }}>{user.email}</strong>
                </span>
              </div>
              <div style={{ position: 'relative', width: '36px', height: '20px', background: 'var(--primary-soft)', borderRadius: '100px', cursor: 'pointer', border: '1px solid var(--primary-border)', flexShrink: 0 }}>
                <div style={{ position: 'absolute', top: '2px', right: '2px', width: '14px', height: '14px', background: 'var(--primary)', borderRadius: '50%', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </div>
            </div>
          </div>

          {/* Group 3: Database & Integrasi */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--foreground)' }}>
              <Database size={15} style={{ color: 'var(--primary)' }} /> Penyimpanan & Data Terisolasi
            </h3>
            <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--foreground)' }}>Isolasi Data Sesi (ID: {user.id})</span>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.1rem' }}>
                  Seluruh data dibatasi strictly berdasarkan NextAuth Session ID
                </span>
              </div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '100px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', flexShrink: 0 }}>
                Aman & Privat
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
