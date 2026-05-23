import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client.js'
import { env } from '../config/env.js'

// Prisma 7 uses driver adapters: the connection string is passed at runtime
// (the datasource block in schema.prisma intentionally has no `url`).
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })
