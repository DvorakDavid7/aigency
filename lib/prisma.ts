import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const pgAdapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const sqliteAdapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter: sqliteAdapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma