import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lupa Password',
  description: 'Layanan pemulihan kata sandi akun TaskTuntas.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
