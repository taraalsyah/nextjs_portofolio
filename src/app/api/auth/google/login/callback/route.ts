import { NextRequest, NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'https://tasktuntas.com';

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      console.warn('Google OAuth login cancelled or returned error:', oauthError);
      return NextResponse.redirect(`${baseUrl}/login?error=OAuthCancelled`);
    }

    const stateCookie = req.cookies.get('google_login_state')?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      console.error('State token mismatch in Google login callback');
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidState`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/login?error=NoCodeProvided`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/google/login/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth client credentials not configured');
      return NextResponse.redirect(`${baseUrl}/login?error=OauthNotConfigured`);
    }

    // 1. Exchange authorization code for Google tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Failed to exchange code for tokens in Google login:', errText);
      return NextResponse.redirect(`${baseUrl}/login?error=TokenExchangeFailed`);
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    // 2. Fetch Google User Profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error('Failed to fetch Google profile in login');
      return NextResponse.redirect(`${baseUrl}/login?error=ProfileFetchFailed`);
    }

    const profile = await profileRes.json();
    const googleSub = profile.sub;
    const googleEmail = (profile.email || '').toLowerCase().trim();

    if (!googleSub || !googleEmail) {
      return NextResponse.redirect(`${baseUrl}/login?error=InvalidGoogleProfile`);
    }

    // 🔒 3. REQUIREMENT: Search for linked Google Account
    const accountDelegate = (prisma as any).account || (prisma as any).Account;
    if (!accountDelegate) {
      return NextResponse.redirect(`${baseUrl}/login?error=DatabaseError`);
    }

    const linkedAccount = await accountDelegate.findFirst({
      where: {
        provider: 'google',
        providerAccountId: googleSub,
      },
      include: { user: true },
    });

    // 🔒 4. UNLINKED ACCOUNT GUARD: Reject if not linked (do NOT auto-register)
    if (!linkedAccount || !linkedAccount.user) {
      console.warn(`Google login attempt rejected for unlinked account: ${googleEmail} (sub: ${googleSub})`);
      const res = NextResponse.redirect(
        `${baseUrl}/login?error=GoogleNotLinked&email=${encodeURIComponent(googleEmail)}`
      );
      res.cookies.delete('google_login_state');
      return res;
    }

    const user = linkedAccount.user;

    if (user.status !== 'ACTIVE') {
      console.warn(`Google login blocked for inactive user ID ${user.id} (${user.status})`);
      const res = NextResponse.redirect(`${baseUrl}/login?error=AccountDisabled`);
      res.cookies.delete('google_login_state');
      return res;
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log Activity
    try {
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
      await createActivityLog({
        userId: user.id,
        action: 'LOGIN',
        description: `Login via Linked Google Account (${googleEmail})`,
        ipAddress,
        userAgent,
      });
    } catch (e) {
      console.warn('Failed to log Google login activity:', e);
    }

    // 5. Create NextAuth JWT Session Cookie
    const secret = process.env.NEXTAUTH_SECRET || "N4UGN96dFGoDYMCJ-secret-key-tara-alsyah-portofolio";
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    const jwtToken = await encode({
      token: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        passwordHash: user.password,
        username: user.username || undefined,
        image: user.image || undefined,
        permissions: [],
      },
      secret,
    });

    const res = NextResponse.redirect(`${baseUrl}/dashboard`);
    res.cookies.set(cookieName, jwtToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });
    res.cookies.delete('google_login_state');
    return res;
  } catch (err: any) {
    console.error('GET /api/auth/google/login/callback error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=OAuthError`);
  }
}
