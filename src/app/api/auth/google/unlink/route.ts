import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const sessionUserId = parseInt(String((session.user as any).id || '0'), 10);
    if (isNaN(sessionUserId) || sessionUserId === 0) {
      return NextResponse.json({ error: 'Invalid user session.' }, { status: 401 });
    }

    const accountDelegate = (prisma as any).account || (prisma as any).Account;
    if (!accountDelegate) {
      return NextResponse.json({ error: 'Account database table not available.' }, { status: 500 });
    }

    // Delete linked Google accounts for this user
    const deleteResult = await accountDelegate.deleteMany({
      where: {
        userId: sessionUserId,
        provider: 'google',
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'No linked Google account found.' }, { status: 404 });
    }

    // Log activity
    try {
      const userAgent = req.headers.get('user-agent') || 'Unknown';
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || '127.0.0.1';
      await createActivityLog({
        userId: sessionUserId,
        action: 'UPDATE',
        description: 'Unlinked Google/Gmail account',
        ipAddress,
        userAgent,
      });
    } catch (e) {
      console.warn('Failed to log unlink activity:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Gmail account unlinked successfully.',
    });
  } catch (err: any) {
    console.error('DELETE /api/auth/google/unlink error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
