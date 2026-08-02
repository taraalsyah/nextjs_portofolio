import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/utils/password';
import { regenerateUserApiToken } from '@/services/user/api-token.service';

export async function POST(request: Request) {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  let userId: number | null = null;
  let jsonParseError = false;

  // 1. Check for Username/Email & Password credentials in request body
  try {
    const rawText = await request.text();
    if (rawText && rawText.trim() !== '') {
      // Replace smart quotes if present from Mac copy-paste
      const sanitizedJson = rawText.replace(/“|”/g, '"');
      const body = JSON.parse(sanitizedJson);

      if (body && (body.email || body.username) && body.password) {
        const identifier = (body.email || body.username).toString().trim();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: identifier },
              { username: identifier },
            ],
          },
        });

        if (!user) {
          return NextResponse.json(
            { success: false, message: 'User with this email/username was not found.' },
            { status: 401 }
          );
        }

        if (user.status !== 'ACTIVE') {
          return NextResponse.json(
            { success: false, message: `User account is not active (current status: ${user.status}).` },
            { status: 401 }
          );
        }

        const isValidPassword = await comparePassword(body.password, user.password);
        if (!isValidPassword) {
          return NextResponse.json(
            { success: false, message: 'Invalid password.' },
            { status: 401 }
          );
        }

        userId = user.id;
      }
    }
  } catch (err) {
    jsonParseError = true;
  }

  // 2. Fallback to NextAuth Session if no credentials body was provided
  if (!userId) {
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      userId = parseInt((session.user as { id?: string | number }).id?.toString() || '0', 10);
    }
  }

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        message: jsonParseError
          ? 'Invalid JSON payload. Ensure you use standard double quotes (") instead of smart quotes.'
          : 'Unauthorized. Please provide valid email/username and password in request body or authenticate via session.',
      },
      { status: 401 }
    );
  }

  try {
    const rawToken = await regenerateUserApiToken(userId, ipAddress, userAgent);

    return NextResponse.json(
      {
        success: true,
        message: 'API Token regenerated successfully.',
        token: rawToken,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to regenerate API token.' },
      { status: 500 }
    );
  }
}
