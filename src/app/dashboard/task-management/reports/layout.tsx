import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Laporan & Statistik Task',
  description: 'Analisis metrik produktivitas, beban kerja pengguna, dan status penyelesaian task.',
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
