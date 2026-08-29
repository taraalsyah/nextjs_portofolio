import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Task Saya',
  description: 'Daftar seluruh tugas yang ditugaskan khusus kepada Anda.',
};

export default function MyTasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
