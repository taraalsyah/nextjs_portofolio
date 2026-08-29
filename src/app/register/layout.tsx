import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daftar Akun',
  description: 'Daftar akun TaskTuntas baru dan mulai kelola alur kerja tim Anda.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
