import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Masuk (Login)',
  description: 'Masuk ke akun TaskTuntas Anda untuk mengelola task dan proyek.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
