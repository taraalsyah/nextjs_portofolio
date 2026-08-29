import React, { Suspense } from 'react';
import AccountLinkedContent from './AccountLinkedContent';
import InlineSpinner from '@/components/ui/loading/InlineSpinner';

export default function AccountLinkedPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2rem' }}><InlineSpinner size={24} /> <span>Memuat Account Linked...</span></div>}>
      <AccountLinkedContent />
    </Suspense>
  );
}
