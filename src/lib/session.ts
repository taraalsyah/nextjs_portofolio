import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

/**
 * Mendapatkan data user yang sedang login saat ini di sisi server.
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Mengharuskan user terautentikasi. Jika tidak ada session,
 * user otomatis di-redirect ke halaman login dengan parameter error SessionExpired.
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login?error=SessionExpired');
  }
  return user;
}

/**
 * Mengharuskan user terautentikasi dan memiliki permission tertentu.
 * Jika tidak memiliki permission, otomatis di-redirect ke halaman /dashboard/403.
 */
export async function requirePermission(module: string, action: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect('/login?error=SessionExpired');
  }

  const role = (session.user as any).role || 'Staff';
  if (role === 'Admin') {
    return session.user;
  }

  const permissions = (session.user as any).permissions || [];
  const permissionKey = `${module}.${action}`;

  if (!permissions.includes(permissionKey)) {
    redirect('/dashboard/403');
  }

  return session.user;
}

/**
 * Menghapus data session cookie secara manual dari sisi server.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  
  // Opsi domain yang mungkin digunakan di production oleh NextAuth
  const domainOptions = [
    {}, // Default host
    { domain: '.taraalsyah.online' }, // Wildcard parent domain
    { domain: 'taraalsyah.online' }, // Parent domain
    { domain: 'blog.taraalsyah.online' } // Subdomain blog
  ];

  // Daftar semua nama cookie NextAuth (secure & non-secure)
  const cookieNames = [
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.callback-url',
    '__Secure-next-auth.callback-url',
    'next-auth.csrf-token',
    '__Secure-next-auth.csrf-token'
  ];

  const isProd = process.env.NODE_ENV === 'production';

  for (const name of cookieNames) {
    for (const opt of domainOptions) {
      // Hapus cookie secara paksa dengan menetapkan maxAge: 0 dan waktu kadaluwarsa di masa lalu
      cookieStore.set(name, '', {
        ...opt,
        path: '/',
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax'
      });
    }
  }
}
export default getCurrentUser;
