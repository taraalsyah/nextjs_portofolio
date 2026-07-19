import React from 'react';
import { requirePermission } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import RoleManagementContent from './RoleManagementContent';

export const metadata = {
  title: 'Manajemen Hak Akses | Dashboard',
  description: 'Kelola peran pengguna (roles) dan matriks perizinan modul secara dinamis.',
};

export default async function RoleManagementPage() {
  // 1. Verifikasi permission di server-side (RoleManagement.View) dan harus Admin
  const sessionUser = await requirePermission('Role Management', 'View');
  if ((sessionUser as any).role !== 'Admin') {
    redirect('/dashboard/403');
  }

  // 2. Ambil data role beserta dengan relasi permissions mereka
  const roles = await prisma.role.findMany({
    include: {
      rolePermissions: {
        select: {
          permissionId: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  // 3. Ambil data semua permissions untuk matriks perizinan
  const permissions = await prisma.permission.findMany({
    orderBy: { id: 'asc' },
  });

  // Serialisasi data untuk dikirim ke client component
  const serializedRoles = roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissionIds: r.rolePermissions.map((rp) => rp.permissionId),
  }));

  return (
    <RoleManagementContent
      initialRoles={serializedRoles}
      availablePermissions={permissions}
    />
  );
}
