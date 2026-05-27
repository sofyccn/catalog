import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),
  // Clerk handles authentication; @clerk/express reads these from process.env.
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY es requerido'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY es requerido'),
  // Whoever signs up with this email is auto-approved as ADMIN (bootstrap).
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  // Cloudflare R2 (image storage) — optional so the app runs without it.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n')
  console.error(`❌ Variables de entorno inválidas:\n${issues}`)
  process.exit(1)
}

export const env = parsed.data
