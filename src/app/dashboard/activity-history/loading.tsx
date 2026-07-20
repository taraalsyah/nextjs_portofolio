import React from 'react';
import { PageSkeleton } from '@/components/ui/loading';

export default function ActivityHistoryLoading() {
  return (
    <PageSkeleton
      type="table"
      title="Riwayat Aktivitas"
      description="Memantau log perubahan dan aktivitas penting pada akun Anda"
      tableHeaders={['Waktu', 'Action', 'Description']}
    />
  );
}
