import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'https://tasktuntas.com';
      return NextResponse.redirect(`${baseUrl}/login?error=SessionExpired`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'https://tasktuntas.com';

    if (!clientId) {
      console.error('GOOGLE_CLIENT_ID is not configured');
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=OauthNotConfigured`);
    }

    const redirectUri = `${baseUrl}/api/auth/google/link/callback`;
    const stateToken = crypto.randomBytes(24).toString('hex');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', stateToken);
    authUrl.searchParams.set('prompt', 'select_account');

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('google_link_state', stateToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 10, // 10 minutes
    });

    return response;
  } catch (err: any) {
    console.error('GET /api/auth/google/link error:', err);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'https://tasktuntas.com';
    return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=OAuthError`);
  }
}
