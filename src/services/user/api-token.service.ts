import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { createActivityLog } from '@/lib/activity';

export interface UserTokenAuthResult {
  authenticated: boolean;
  user?: {
    id: number;
    name: string;
    username: string | null;
    email: string;
    role: string;
    roleId: number | null;
    status: string;
    image: string | null;
  };
  ipAddress: string;
  userAgent: string;
}

/**
 * Generates a secure random Personal API Token with prefix 'ptm_'
 * Example: ptm_8d2f7b6c1e4a5d9f3c8b1e6a7d4c9f0a...
 */
export function generateRawApiToken(): string {
  const randomHex = crypto.randomBytes(32).toString('hex');
  return `ptm_${randomHex}`;
}

/**
 * Hashes raw token string using SHA-256 for secure database storage.
 */
export function hashApiToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verifies Personal API Token from 'Authorization: Bearer <token>' header.
 * Hashes raw token and matches against database hash safely.
 */
export async function verifyApiTokenHeader(request: Request): Promise<UserTokenAuthResult> {
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, ipAddress, userAgent };
  }

  const rawToken = authHeader.substring(7).trim();
  if (!rawToken || !rawToken.startsWith('ptm_')) {
    return { authenticated: false, ipAddress, userAgent };
  }

  const tokenHash = hashApiToken(rawToken);

  try {
    const user = await prisma.user.findFirst({
      where: {
        apiToken: tokenHash,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        roleId: true,
        status: true,
        image: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return { authenticated: false, ipAddress, userAgent };
    }

    return {
      authenticated: true,
      user,
      ipAddress,
      userAgent,
    };
  } catch {
    return { authenticated: false, ipAddress, userAgent };
  }
}

/**
 * Service to generate a new Personal API Token for user and log activity.
 */
export async function generateUserApiToken(
  userId: number,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<string> {
  const rawToken = generateRawApiToken();
  const tokenHash = hashApiToken(rawToken);

  await prisma.user.update({
    where: { id: userId },
    data: { apiToken: tokenHash },
  });

  await createActivityLog({
    userId,
    action: 'CREATE',
    description: 'Generated new Personal API Token',
    ipAddress,
    userAgent,
  });

  return rawToken;
}

/**
 * Service to regenerate Personal API Token (invalidating previous token).
 */
export async function regenerateUserApiToken(
  userId: number,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<string> {
  const rawToken = generateRawApiToken();
  const tokenHash = hashApiToken(rawToken);

  await prisma.user.update({
    where: { id: userId },
    data: { apiToken: tokenHash },
  });

  await createActivityLog({
    userId,
    action: 'UPDATE',
    description: 'Regenerated Personal API Token (invalidated previous token)',
    ipAddress,
    userAgent,
  });

  return rawToken;
}

/**
 * Service to delete Personal API Token (setting apiToken to NULL).
 */
export async function deleteUserApiToken(
  userId: number,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { apiToken: null },
  });

  await createActivityLog({
    userId,
    action: 'DELETE',
    description: 'Deleted Personal API Token',
    ipAddress,
    userAgent,
  });
}
