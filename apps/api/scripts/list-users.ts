/** List every user in the DB with their status, role, and clerkId. */
import { prisma } from '../src/lib/prisma.js'

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, fullName: true, status: true, role: true, active: true, clerkId: true, createdAt: true },
  })
  console.log(`Total: ${users.length} usuarios\n`)
  for (const u of users) {
    const clerk = u.clerkId ? u.clerkId.slice(0, 20) + '…' : '(null)'
    console.log(`  ${u.email.padEnd(35)} · ${u.status.padEnd(8)} · ${(u.role ?? '-').padEnd(10)} · clerk=${clerk}`)
  }
  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
