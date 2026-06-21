/**
 * Promote a user to ACTIVE + ADMIN by email. Used to bootstrap yourself or
 * trusted admins when they're stuck on REJECTED or PENDING in production.
 *
 *   pnpm --filter api exec tsx scripts/promote-admin.ts sofycobo14@gmail.com
 *   pnpm --filter api exec tsx scripts/promote-admin.ts tio@correo.com DISPATCHER
 *
 * Default role is ADMIN; pass CLIENT / DISPATCHER as second arg to override.
 */
import { prisma } from '../src/lib/prisma.js'

const ROLES = ['CLIENT', 'DISPATCHER', 'ADMIN'] as const
type Role = typeof ROLES[number]

async function main() {
  const email = (process.argv[2] ?? '').trim().toLowerCase()
  const role = (process.argv[3] ?? 'ADMIN').toUpperCase() as Role
  if (!email) {
    console.error('Usage: tsx scripts/promote-admin.ts <email> [CLIENT|DISPATCHER|ADMIN]')
    process.exit(1)
  }
  if (!ROLES.includes(role)) {
    console.error(`Rol inválido "${role}". Usa CLIENT, DISPATCHER, o ADMIN.`)
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (!existing) {
    console.error(`No hay ningún usuario con email "${email}".`)
    console.error(`(El usuario primero tiene que registrarse en Clerk. Cuando lo haga, vuelve a correr este script.)`)
    process.exit(1)
  }

  console.log(`Antes: ${existing.email}  · status=${existing.status}  · role=${existing.role ?? '(null)'}  · active=${existing.active}`)
  const updated = await prisma.user.update({
    where: { email },
    data: { status: 'ACTIVE', role, active: true },
  })
  console.log(`Después: ${updated.email}  · status=${updated.status}  · role=${updated.role}  · active=${updated.active}`)
  console.log(`\n✓ Listo. Refresca la app en el navegador.`)
  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
