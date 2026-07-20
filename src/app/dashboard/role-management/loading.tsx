import React from 'react';
import { PageSkeleton } from '@/components/ui/loading';

export default function RoleManagementLoading() {
  return (
    <PageSkeleton
      type="matrix"
      title="Permission Matrix"
    />
  );
}
