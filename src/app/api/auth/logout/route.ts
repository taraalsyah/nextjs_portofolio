import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    // Hapus session cookie dari sisi server
    await destroySession();
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
