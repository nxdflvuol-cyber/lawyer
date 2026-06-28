import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// التحقق من اتصال قاعدة البيانات
export async function checkDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { ok: false, error: msg };
  }
}
