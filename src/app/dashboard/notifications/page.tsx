import React from 'react';
import { requirePermission } from '@/lib/session';
import NotificationsContent from './NotificationsContent';

export const metadata = {
  title: 'Notifikasi | Dashboard',
  description: 'Kelola seluruh riwayat notifikasi dan pemberitahuan Anda.',
};

export default async function NotificationsPage() {
  await requirePermission('Dashboard', 'View');

  return <NotificationsContent />;
}
