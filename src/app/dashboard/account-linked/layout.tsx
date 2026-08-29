import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Akun Terhubung',
  description: 'Kelola koneksi akun Gmail dan Google OAuth yang terhubung.',
};

export default function AccountLinkedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
