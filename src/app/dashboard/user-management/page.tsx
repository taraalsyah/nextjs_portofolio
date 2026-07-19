import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import UserManagementContent from './UserManagementContent';

export const metadata = {
  title: 'Manajemen Pengguna | Dashboard',
  description: 'Kelola data pengguna dan perizinan role mereka secara terpusat.',
};

export default async function UserManagementPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  // 1. Verifikasi permission di server-side (UserManagement.View)
  const sessionUser = await requirePermission('User Management', 'View');
  const sessionUserId = parseInt((sessionUser as any).id, 10);

  // Await searchParams as required by Next.js 15+ async APIs
  const searchParams = await props.searchParams;
  let currentPage = parseInt(searchParams.page || '1', 10);
  if (isNaN(currentPage) || currentPage < 1) {
    currentPage = 1;
  }

  // 2. Hitung total item pengguna
  const totalItems = await prisma.user.count();
  const totalPages = Math.ceil(totalItems / 10);

  // Jika halaman melebihi halaman terakhir, arahkan secara anggun ke halaman terakhir
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  // 3. Ambil data user dari database (termasuk role relation) dengan skip & take
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      roleId: true,
      roleRel: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      status: true,
      phone: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
    skip: (currentPage - 1) * 10,
    take: 10,
  });

  // 4. Ambil daftar role yang tersedia
  const roles = await prisma.role.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: { id: 'asc' },
  });

  // Serialisasi tanggal ke string agar aman dikirim ke client component
  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <UserManagementContent
      initialUsers={serializedUsers}
      availableRoles={roles}
      sessionUserId={sessionUserId}
      totalItems={totalItems}
      currentPage={currentPage}
    />
  );
}
