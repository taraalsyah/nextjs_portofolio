import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { formatActivityDate } from '@/lib/activity';
import { formatToWIB } from '@/lib/date';
import {
  Shield,
  Activity,
  CheckCircle,
  Clock,
  User as UserIcon,
  AlertCircle
} from 'lucide-react';

export default async function DashboardPage() {
  // 1. Verifikasi otorisasi session di backend & ambil ID user terverifikasi
  const sessionUser = await requirePermission('Dashboard', 'View');
  const sessionUserId = parseInt((sessionUser as any).id, 10);

  // 2. Query data user aktif dari DB menggunakan filter id dari session
  const dbUser = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    throw new Error('Data pengguna tidak ditemukan.');
  }

  // 3. Query log aktivitas terkini KHUSUS milik user ini berdasarkan sessionUserId
  const recentActivities = await prisma.activityLog.findMany({
    where: { userId: sessionUserId },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  const memberSince = dbUser.createdAt
    ? formatToWIB(dbUser.createdAt, 'd MMMM yyyy')
    : 'Maret 2026';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Welcome Section */}
      <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, margin: 0, color: 'var(--foreground)' }}>
          Selamat datang kembali, {dbUser.name}!
        </h2>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '0.25rem', fontSize: '0.82rem' }}>
          Semua sistem berjalan normal. Kelola workspace dan data akun Anda secara aman.
        </p>
      </div>

      {/* Grid Status Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Card 1: Active Role */}
        <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'var(--primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0,
          }}>
            <Shield size={18} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', fontWeight: 600 }}>Hak Akses</span>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.05rem', color: 'var(--foreground)' }}>
              {dbUser.role || 'user'}
            </span>
          </div>
        </div>

        {/* Card 2: Verification status */}
        <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'var(--success-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            flexShrink: 0,
          }}>
            <CheckCircle size={18} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', fontWeight: 600 }}>Status Akun</span>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.05rem', color: 'var(--foreground)' }}>
              {dbUser.status === 'ACTIVE' ? 'Aktif & Terverifikasi' : 'Tertunda'}
            </span>
          </div>
        </div>

        {/* Card 3: Membership Date */}
        <div style={{ padding: '1rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'var(--primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
            flexShrink: 0,
          }}>
            <Clock size={18} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-foreground)', fontWeight: 600 }}>Bergabung Sejak</span>
            <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginTop: '0.05rem', color: 'var(--foreground)' }}>
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
        <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--foreground)' }}>
            <UserIcon size={16} style={{ color: 'var(--primary)' }} /> Ringkasan Profil
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>ID Pengguna</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{dbUser.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Nama Lengkap</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{dbUser.name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.15rem', fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Alamat Email</span>
              <span style={{ fontWeight: 600, color: 'var(--foreground)' }}>{dbUser.email}</span>
            </div>
          </div>
        </div>

        {/* System log right */}
        <div style={{ padding: '1.25rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, color: 'var(--foreground)' }}>
            <Activity size={16} style={{ color: 'var(--primary)' }} /> Aktivitas Terkini
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentActivities.length === 0 ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--muted-foreground)' }}>
                Belum ada log aktivitas tercatat.
              </span>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <AlertCircle size={14} style={{ color: 'var(--primary)', marginTop: '0.15rem', flexShrink: 0 }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 500, color: 'var(--foreground)' }}>
                      {act.action}: {act.description.split('\n')[0]}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                      {formatActivityDate(act.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
