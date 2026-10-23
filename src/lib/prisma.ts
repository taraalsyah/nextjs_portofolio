import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  if (typeof window !== 'undefined') {
    return {} as PrismaClient;
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

// Reset client if running server has outdated client lacking newer models
if (globalForPrisma.prisma && (!(globalForPrisma.prisma as any).taskProject || !(globalForPrisma.prisma as any).taskPhase || !(globalForPrisma.prisma as any).comment)) {
  try {
    (globalForPrisma.prisma as any).$disconnect();
  } catch {}
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (typeof window === 'undefined') {
  globalForPrisma.prisma = prisma;
}

export default prisma;

