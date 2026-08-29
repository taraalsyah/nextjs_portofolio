import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verifikasi Email',
  description: 'Verifikasi alamat email untuk mengaktifkan akun TaskTuntas Anda.',
};

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
