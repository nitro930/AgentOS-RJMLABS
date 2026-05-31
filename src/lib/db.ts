import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaSchemaVersion?: string
}

// Force new client when schema changes
const SCHEMA_VERSION = 'onboarding-v1'
if (globalForPrisma.prismaSchemaVersion !== SCHEMA_VERSION) {
  globalForPrisma.prisma = undefined
  globalForPrisma.prismaSchemaVersion = SCHEMA_VERSION
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db