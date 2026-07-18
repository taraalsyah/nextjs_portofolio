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
 * Menghapus data session cookie secara manual dari sisi server.
 */
export async function destroySession() {
  const cookieStore = await cookies();
  
  // Hapus cookie session NextAuth di development dan production
  cookieStore.delete('next-auth.session-token');
  cookieStore.delete('__Secure-next-auth.session-token');
  cookieStore.delete('next-auth.callback-url');
  cookieStore.delete('next-auth.csrf-token');
}
export default getCurrentUser;
