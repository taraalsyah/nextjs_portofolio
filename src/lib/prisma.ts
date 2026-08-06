import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
}

// In development, check if cached global instance is missing newly generated fields
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  try {
    const dmmf = (globalForPrisma.prisma as any)?._dMMF;
    const taskModel = dmmf?.modelMap?.Task || dmmf?.datamodel?.models?.find((m: any) => m.name === 'Task');
    const hasIsLocked = taskModel?.fields?.some((f: any) => f.name === 'isLocked');
    if (!hasIsLocked) {
      console.log('[prisma.ts] In-memory PrismaClient instance is stale (missing isLocked). Re-instantiating PrismaClient...');
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
