import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  const DynamicPrismaClient = (typeof require !== 'undefined' && require('@prisma/client')?.PrismaClient) || PrismaClient;
  return new DynamicPrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
    if (!(globalForPrisma.prisma as any).twoFactorToken) {
      console.log('[prisma.ts] Overwriting stale PrismaClient instance missing twoFactorToken...');
      globalForPrisma.prisma = createPrismaClient();
    }
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export default prisma;

