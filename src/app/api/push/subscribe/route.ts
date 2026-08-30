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
    const subscription = body?.subscription || body;

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const auth = subscription?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid push subscription data' }, { status: 400 });
    }

    await (prisma as any).pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: Number(userId),
        p256dh,
        auth,
        updatedAt: new Date(),
      },
      create: {
        userId: Number(userId),
        endpoint,
        p256dh,
        auth,
      },
    });

    return NextResponse.json({ success: true, message: 'Push subscription saved' });
  } catch (error: any) {
    console.error('[API /api/push/subscribe Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
