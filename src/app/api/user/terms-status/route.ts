import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TERMS_VERSION } from '@/content/terms';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        acceptedTermsVersion: true,
        acceptedTermsAt: true,
      },
    });

    const isAccepted = user?.acceptedTermsVersion === TERMS_VERSION;

    return NextResponse.json({
      isAccepted,
      currentVersion: TERMS_VERSION,
      userVersion: user?.acceptedTermsVersion || null,
      acceptedAt: user?.acceptedTermsAt || null,
    });
  } catch (error: any) {
    console.error('GET /api/user/terms-status error:', error);
    return NextResponse.json(
      { error: 'Gagal memeriksa status persetujuan syarat & ketentuan.' },
      { status: 500 }
    );
  }
}
