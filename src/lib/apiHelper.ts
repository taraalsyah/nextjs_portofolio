import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export interface AuthCheckResult {
  authorized: boolean;
  response?: NextResponse;
  userId?: number;
  ipAddress: string;
  userAgent: string;
}

/**
 * Validates backend API request session and permissions.
 * Bypasses checks if role is 'Admin'.
 */
export async function verifyApiPermission(
  request: Request,
  module: string,
  action: string
): Promise<AuthCheckResult> {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Unauthorized' }, { status: 401 }),
      ipAddress,
      userAgent,
    };
  }

  const userId = parseInt((session.user as any).id, 10);
  const role = (session.user as any).role || 'Staff';

  if (role === 'Admin') {
    return { authorized: true, userId, ipAddress, userAgent };
  }

  const permissions = (session.user as any).permissions || [];
  const permissionKey = `${module}.${action}`;

  if (!permissions.includes(permissionKey)) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Forbidden' }, { status: 403 }),
      ipAddress,
      userAgent,
    };
  }

  return { authorized: true, userId, ipAddress, userAgent };
}
