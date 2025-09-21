import { PrismaClient } from '@prisma/client';

declare global {
  // prevent multiple instances during dev hot reload
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
