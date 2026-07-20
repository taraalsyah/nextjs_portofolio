import React from 'react';
import { CardSkeleton } from '@/components/ui/loading';

export default function SettingsLoading() {
  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <CardSkeleton variant="settings" />
      <CardSkeleton variant="settings" />
      <CardSkeleton variant="settings" />
    </div>
  );
}
