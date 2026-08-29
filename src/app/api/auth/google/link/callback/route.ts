import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.FRONTEND_URL || 'https://tasktuntas.com';

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.redirect(`${baseUrl}/login?error=SessionExpired`);
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    const sessionEmail = (session.user.email || '').toLowerCase().trim();

    if (isNaN(sessionUserId) || sessionUserId === 0 || !sessionEmail) {
      return NextResponse.redirect(`${baseUrl}/login?error=SessionExpired`);
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      console.warn('Google OAuth cancelled or returned error:', oauthError);
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=OAuthCancelled`);
    }

    const stateCookie = req.cookies.get('google_link_state')?.value;
    if (!state || !stateCookie || state !== stateCookie) {
      console.error('State token mismatch in Google link callback');
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=InvalidState`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=NoCodeProvided`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${baseUrl}/api/auth/google/link/callback`;

    if (!clientId || !clientSecret) {
      console.error('Google OAuth client credentials not configured');
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=OauthNotConfigured`);
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
      console.error('Failed to exchange code for tokens:', errText);
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=TokenExchangeFailed`);
    }

    const tokens = await tokenRes.json();
    const accessToken = tokens.access_token;

    // 2. Fetch Google User Profile (OpenID Connect userinfo)
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      console.error('Failed to fetch Google userinfo profile');
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=ProfileFetchFailed`);
    }

    const profile = await profileRes.json();
    const googleSub = profile.sub;
    const googleEmail = (profile.email || '').toLowerCase().trim();

    if (!googleSub || !googleEmail) {
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=InvalidGoogleProfile`);
    }

    // 🔒 3. REQUIREMENT: Strict Email Equality Validation
    if (googleEmail !== sessionEmail) {
      console.warn(`Email mismatch during Gmail link. Application email: ${sessionEmail}, Google email: ${googleEmail}`);
      const res = NextResponse.redirect(
        `${baseUrl}/dashboard/account-linked?error=EmailMismatch&googleEmail=${encodeURIComponent(googleEmail)}`
      );
      res.cookies.delete('google_link_state');
      return res;
    }

    // 🔒 4. SECURITY: Account Takeover & Duplicate Link Guard
    const accountDelegate = (prisma as any).account || (prisma as any).Account;
    if (!accountDelegate) {
      return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=DatabaseError`);
    }

    const existingLink = await accountDelegate.findFirst({
      where: {
        provider: 'google',
        OR: [
          { providerAccountId: googleSub },
          { email: googleEmail },
        ],
      },
    });

    if (existingLink) {
      if (existingLink.userId !== sessionUserId) {
        console.warn(`Google account (${googleEmail}) is already linked to another user ID ${existingLink.userId}`);
        const res = NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=AlreadyLinkedToOther`);
        res.cookies.delete('google_link_state');
        return res;
      }

      // Already linked to current user
      const res = NextResponse.redirect(`${baseUrl}/dashboard/account-linked?info=AlreadyLinked`);
      res.cookies.delete('google_link_state');
      return res;
    }

    // 5. Create Account Relation in Database
    await accountDelegate.create({
      data: {
        userId: sessionUserId,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleSub,
        email: googleEmail,
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        idToken: tokens.id_token || null,
      },
    });

    // 6. Log Activity
    try {
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
      await createActivityLog({
        userId: sessionUserId,
        action: 'UPDATE',
        description: `Linked Gmail Account: ${googleEmail}`,
        ipAddress,
        userAgent,
      });
    } catch (e) {
      console.warn('Failed to log link activity:', e);
    }

    const res = NextResponse.redirect(`${baseUrl}/dashboard/account-linked?success=LinkedSuccessfully`);
    res.cookies.delete('google_link_state');
    return res;
  } catch (err: any) {
    console.error('GET /api/auth/google/link/callback error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard/account-linked?error=OAuthError`);
  }
}
