import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Akses Ditolak (403)',
  description: 'Anda tidak memiliki hak akses untuk membuka halaman ini.',
};

export default function ForbiddenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
