import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

// In development, check if cached global instance is missing newly generated models (like twoFactorToken)
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  try {
    const p = globalForPrisma.prisma as any;
    if (!p.twoFactorToken || !p.task) {
      console.log('[prisma.ts] In-memory PrismaClient instance is stale. Re-instantiating PrismaClient...');
      globalForPrisma.prisma = undefined;
    }
  } catch {
    globalForPrisma.prisma = undefined;
  }
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

