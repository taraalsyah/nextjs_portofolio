import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteUserApiToken } from '@/services/user/api-token.service';

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = parseInt((session.user as { id?: string | number }).id?.toString() || '0', 10);
  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  try {
    await deleteUserApiToken(userId, ipAddress, userAgent);

    return NextResponse.json(
      {
        success: true,
        message: 'API Token deleted successfully.',
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to delete API token.' },
      { status: 500 }
    );
  }
}
