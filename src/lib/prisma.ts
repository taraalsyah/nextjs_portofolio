import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  if (typeof require !== 'undefined' && require.cache) {
    Object.keys(require.cache).forEach((key) => {
      if (key.includes('@prisma/client') || key.includes('.prisma/client')) {
        delete require.cache[key];
      }
    });
  }
  const FreshPrismaClient = (typeof require !== 'undefined' && require('@prisma/client')?.PrismaClient) || PrismaClient;
  return new FreshPrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
    if (!(globalForPrisma.prisma as any).projectJoinRequest || !(globalForPrisma.prisma as any).projectPayment) {
      console.log('[prisma.ts] Disconnecting stale PrismaClient instance...');
      const oldInstance = globalForPrisma.prisma;
      globalForPrisma.prisma = createPrismaClient();
      oldInstance.$disconnect().catch(() => {});
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

