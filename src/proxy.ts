import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Ambil token session NextAuth
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Proteksi rute dashboard jika belum terautentikasi / session habis
  if (url.pathname.startsWith('/dashboard')) {
    if (!token || !token.id) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'SessionExpired');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Redirect ke dashboard jika sudah login dan mengakses login/register
  if (url.pathname === '/login' || url.pathname === '/register') {
    if (token && token.id) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Mendapatkan host dari header request (misal: blog.tasktuntas.com)
  const host = request.headers.get('host') || '';

  // Deteksi jika request menggunakan domain subdomain blog.tasktuntas.com
  if (host === 'blog.tasktuntas.com') {
    // Hindari double prefix jika path sudah diawali dengan /blog
    if (!url.pathname.startsWith('/blog')) {
      url.pathname = `/blog${url.pathname}`;
    }
    
    // Lakukan rewrite internal Next.js ke folder /blog
    return NextResponse.rewrite(url);
  }

  // Izinkan request ke domain utama tasktuntas.com atau domain lain berjalan normal
  return NextResponse.next();
}

// Konfigurasi matcher agar proxy tidak memproses static assets, API, dsb.
export const config = {
  matcher: [
    /*
     * Cocokkan semua path request kecuali yang dimulai dengan:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - file statis dengan ekstensi (misal: .png, .jpg, .svg, .css, dll.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)',
  ],
};
