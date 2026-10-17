import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TERMS_VERSION } from '@/content/terms';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id || '0', 10);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        acceptedTermsAt: new Date(),
        acceptedTermsVersion: TERMS_VERSION,
      },
      select: {
        id: true,
        acceptedTermsAt: true,
        acceptedTermsVersion: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Persetujuan Syarat & Ketentuan berhasil dicatat.',
      acceptedTermsVersion: updatedUser.acceptedTermsVersion,
      acceptedTermsAt: updatedUser.acceptedTermsAt,
    });
  } catch (error: any) {
    console.error('POST /api/user/accept-terms error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui persetujuan syarat & ketentuan.' },
      { status: 500 }
    );
  }
}
