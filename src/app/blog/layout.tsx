import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog & Artikel',
  description: 'Wawasan, tutorial, dan artikel seputar pengembangan web, UI/UX, dan manajemen produktivitas.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
