import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Mendapatkan host dari header request (misal: blog.taraalsyah.online)
  const host = request.headers.get('host') || '';

  // Deteksi jika request menggunakan domain subdomain blog.taraalsyah.online
  if (host === 'blog.taraalsyah.online') {
    // Hindari double prefix jika path sudah diawali dengan /blog
    if (!url.pathname.startsWith('/blog')) {
      url.pathname = `/blog${url.pathname}`;
    }
    
    // Lakukan rewrite internal Next.js ke folder /blog
    return NextResponse.rewrite(url);
  }

  // Izinkan request ke domain utama taraalsyah.online atau domain lain berjalan normal
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
