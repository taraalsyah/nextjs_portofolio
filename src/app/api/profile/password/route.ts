import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updatePassword } from '@/services/user/user.service';

/**
 * PUT /api/profile/password
 * API endpoint to securely update user password.
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt((session.user as any).id, 10);
    const body = await request.json();

    const result = await updatePassword(userId, body);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('PUT /api/profile/password error:', error);
    const message = error?.message || 'Terjadi kesalahan pada server.';
    const status = message.includes('tidak ditemukan') ? 404 : 400;

    return NextResponse.json(
      { success: false, message },
      { status }
    );
  }
}
