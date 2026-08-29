import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kategori Task',
  description: 'Kelola kategori tugas untuk pengelompokan pekerjaan yang rapi.',
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
