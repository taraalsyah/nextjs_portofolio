import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    if (isNaN(sessionUserId) || sessionUserId === 0) {
      return NextResponse.json({ error: 'Invalid user session.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Find linked Google account
    const accountDelegate = (prisma as any).account || (prisma as any).Account;
    const googleAccount = accountDelegate
      ? await accountDelegate.findFirst({
          where: {
            userId: sessionUserId,
            provider: 'google',
          },
          select: {
            id: true,
            email: true,
            providerAccountId: true,
            createdAt: true,
          },
        })
      : null;

    return NextResponse.json({
      isLinked: Boolean(googleAccount),
      registeredEmail: user.email,
      linkedEmail: googleAccount?.email || (googleAccount ? user.email : null),
      linkedAt: googleAccount?.createdAt || null,
    });
  } catch (err: any) {
    console.error('GET /api/auth/google/status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
