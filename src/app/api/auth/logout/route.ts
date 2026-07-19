import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createActivityLog } from '@/lib/activity';

export async function POST(request: Request) {
  try {
    // 1. Catat aktivitas logout jika user memiliki session aktif
    try {
      const session = await getServerSession(authOptions);
      if (session && session.user && (session.user as any).id) {
        const userId = parseInt((session.user as any).id);
        await createActivityLog({
          userId,
          action: 'LOGOUT',
          description: 'Logout',
        });
      }
    } catch (logError) {
      console.warn('Gagal mencatat log aktivitas logout:', logError);
    }

    const response = NextResponse.redirect(new URL('/login', request.url), { status: 303 });

    // Opsi domain yang mungkin digunakan di production oleh NextAuth
    const domainOptions = [
      '', // Tanpa domain (default host)
      '.taraalsyah.online', // Wildcard parent domain
      'taraalsyah.online', // Parent domain
      'blog.taraalsyah.online' // Subdomain blog
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
      for (const domain of domainOptions) {
        // Buat string header Set-Cookie secara manual untuk menghindari overwrite di Response Cookie Map
        const parts = [
          `${name}=`,
          'Path=/',
          'Max-Age=0',
          'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
          'HttpOnly',
          'SameSite=Lax'
        ];
        
        if (domain) {
          parts.push(`Domain=${domain}`);
        }
        
        if (isProd) {
          parts.push('Secure');
        }

        response.headers.append('Set-Cookie', parts.join('; '));
      }
    }

    return response;
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
  }
}
