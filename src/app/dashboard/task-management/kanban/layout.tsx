import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kanban Board',
  description: 'Pindahkan alur kerja task secara fleksibel dari Backlog hingga Done.',
};

export default function KanbanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
