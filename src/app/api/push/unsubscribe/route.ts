import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/react';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const endpoint = body?.endpoint || body?.subscription?.endpoint;

    if (endpoint) {
      await (prisma as any).pushSubscription.deleteMany({
        where: {
          endpoint,
          userId: Number(userId),
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Push subscription removed' });
  } catch (error: any) {
    console.error('[API /api/push/unsubscribe Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
