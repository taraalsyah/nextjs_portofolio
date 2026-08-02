'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { CapacitorProvider } from '@/components/capacitor/CapacitorProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CapacitorProvider>{children}</CapacitorProvider>
    </SessionProvider>
  );
}
