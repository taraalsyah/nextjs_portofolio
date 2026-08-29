import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manajemen Task',
  description: 'Kelola seluruh daftar task, penugasan, status workflow, dan prioritas.',
};

export default function TaskManagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
