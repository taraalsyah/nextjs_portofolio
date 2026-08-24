import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const DynamicPrismaClient = (typeof require !== 'undefined' && require('@prisma/client')?.PrismaClient) || PrismaClient;
  return new DynamicPrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

// In development, check if cached global instance is missing newly generated models (like twoFactorToken)
if (process.env.NODE_ENV !== 'production') {
  try {
    const p = globalForPrisma.prisma as any;
    if (p && (!p.twoFactorToken || !p.task)) {
      console.log('[prisma.ts] In-memory PrismaClient instance is stale. Clearing require.cache and re-instantiating...');
      globalForPrisma.prisma = undefined;
      if (typeof require !== 'undefined' && require.cache) {
        Object.keys(require.cache).forEach((key) => {
          if (key.includes('.prisma') || key.includes('@prisma')) {
            delete require.cache[key];
          }
        });
      }
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

