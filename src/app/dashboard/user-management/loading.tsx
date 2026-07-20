import React from 'react';
import { PageSkeleton } from '@/components/ui/loading';

export default function UserManagementLoading() {
  return (
    <PageSkeleton
      type="table"
      title="Manajemen Pengguna"
      description="Lihat daftar anggota, edit hak akses role, serta kelola akun secara aman"
      tableHeaders={['Pengguna', 'Alamat Email', 'Hak Akses (Role)', 'Status', 'Tanggal Gabung', 'Aksi']}
    />
  );
}
