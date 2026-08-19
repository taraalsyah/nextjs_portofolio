import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import UserManagementContent from './UserManagementContent';

export const metadata = {
  title: 'Manajemen Pengguna | Dashboard',
  description: 'Kelola data pengguna dan perizinan role mereka secara terpusat.',
};

export default async function UserManagementPage(props: {
  searchParams: Promise<{
    page?: string;
    name?: string;
    email?: string;
    roleId?: string;
    status?: string;
    joinedDate?: string;
  }>;
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

  const nameFilter = searchParams.name?.trim() || '';
  const emailFilter = searchParams.email?.trim() || '';
  const roleIdFilter = searchParams.roleId?.trim() || '';
  const statusFilter = searchParams.status?.trim() || '';
  const joinedDateFilter = searchParams.joinedDate?.trim() || '';

  // Construct Prisma where clause for combined AND filtering
  const whereClause: any = {};

  if (nameFilter) {
    whereClause.OR = [
      { name: { contains: nameFilter } },
      { username: { contains: nameFilter } },
    ];
  }

  if (emailFilter) {
    whereClause.email = { contains: emailFilter };
  }

  if (roleIdFilter) {
    const parsedRoleId = parseInt(roleIdFilter, 10);
    if (!isNaN(parsedRoleId)) {
      whereClause.roleId = parsedRoleId;
    }
  }

  if (statusFilter) {
    if (statusFilter === 'SOFT_BLOCKED') {
      whereClause.otpSoftBlockUntil = { gt: new Date() };
    } else {
      whereClause.status = statusFilter;
    }
  }

  if (joinedDateFilter) {
    const startDate = new Date(`${joinedDateFilter}T00:00:00.000Z`);
    const endDate = new Date(`${joinedDateFilter}T23:59:59.999Z`);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      whereClause.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }
  }

  // 2. Hitung total item pengguna berdasarkan filter
  const totalItems = await prisma.user.count({ where: whereClause });
  const totalPages = Math.ceil(totalItems / 10);

  // Jika halaman melebihi halaman terakhir, arahkan secara anggun ke halaman terakhir
  if (totalPages > 0 && currentPage > totalPages) {
    currentPage = totalPages;
  }

  // 3. Ambil data user dari database dengan filter & pagination
  const users = await prisma.user.findMany({
    where: whereClause,
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
      otpSoftBlockUntil: true,
      otpSoftBlockCount: true,
      createdAt: true,
    },
    orderBy: { id: 'asc' },
    skip: (currentPage - 1) * 10,
    take: 10,
  });

  // 4. Ambil daftar role yang tersedia untuk dropdown filter
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
    otpSoftBlockUntil: u.otpSoftBlockUntil ? u.otpSoftBlockUntil.toISOString() : null,
  }));

  return (
    <UserManagementContent
      initialUsers={serializedUsers}
      availableRoles={roles}
      sessionUserId={sessionUserId}
      totalItems={totalItems}
      currentPage={currentPage}
      filterParams={{
        name: nameFilter,
        email: emailFilter,
        roleId: roleIdFilter,
        status: statusFilter,
        joinedDate: joinedDateFilter,
      }}
    />
  );
}
