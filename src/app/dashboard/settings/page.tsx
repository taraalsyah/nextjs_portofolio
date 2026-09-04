import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import SettingsClientView from './SettingsClientView';

export const metadata = {
  title: 'Pengaturan Sistem',
  description: 'Pengaturan konfigurasi sistem dan parameter keamanan.',
};

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

  return <SettingsClientView user={user} />;
}
