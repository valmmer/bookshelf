// src/server/prisma.ts
import { Prisma, PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * ✅ Tipamos explicitamente como Prisma.LogLevel[] (array mutável),
 * sem usar "as const" — isso evita o erro de readonly.
 */
const logs: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error'];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logs, // <-- agora bate com o tipo que o Prisma espera
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
