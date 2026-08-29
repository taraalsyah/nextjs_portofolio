import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Atur ulang kata sandi akun TaskTuntas Anda.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
