import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import ActivityHistoryContent from './ActivityHistoryContent';

export const metadata = {
  title: 'Riwayat Aktivitas | Dashboard',
  description: 'Lihat seluruh riwayat aktivitas akun Anda.',
};

export default async function ActivityHistoryPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 1. Verifikasi session di server side
  const sessionUser = await requirePermission('Activity History', 'View');
  const userId = parseInt((sessionUser as any).id, 10);
  if (isNaN(userId)) {
    throw new Error('Sesi pengguna tidak valid.');
  }

  // Await searchParams as required by Next.js 15+ async APIs
  const searchParams = await props.searchParams;
  let currentPage = parseInt(searchParams.page || '1', 10);
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  // 2. Query total items untuk pagination
  const totalItems = await prisma.activityLog.count({
    where: { userId },
  });

  const totalPages = Math.ceil(totalItems / 10);

  // Jika halaman melebihi halaman terakhir, arahkan secara anggun ke halaman terakhir
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  // 3. Ambil data logs untuk halaman saat ini
  const logs = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * 10,
    take: 10,
  });

  // Serialisasi tanggal untuk client component
  const serializedLogs = logs.map((log) => ({
    id: log.id,
    action: log.action,
    description: log.description,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <ActivityHistoryContent
      logs={serializedLogs}
      totalItems={totalItems}
      currentPage={currentPage}
    />
  );
}
