import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : [],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Auto-seed: ensure at least one user exists so login works after db push/reset
if (typeof window === 'undefined') {
  db.user.count().then((count) => {
    if (count === 0) {
      console.warn('[db] No users found — triggering auto-seed...')
      fetch(`http://localhost:${process.env.PORT || 3000}/api/seed`, {
        method: 'POST',
      }).catch(() => {
        // Server may not be ready yet; seed will be called from login route instead
      })
    }
  }).catch(() => {})
}