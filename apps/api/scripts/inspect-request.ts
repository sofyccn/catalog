/** Inspect a recent request to confirm it reached SENT (which triggers notifyNewOrder). */
import { prisma } from '../src/lib/prisma.js'

async function main() {
  const id = process.argv[2]
  const request = id
    ? await prisma.request.findUnique({
        where: { id },
        include: { client: true, items: true, history: { orderBy: { changedAt: 'asc' } } },
      })
    : (await prisma.request.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { client: true, items: true, history: { orderBy: { changedAt: 'asc' } } },
      }))

  if (!request) { console.log('No hay pedidos.'); return }

  console.log(`Pedido #${request.id.slice(-8)}`)
  console.log(`  Cliente:  ${request.client.email} (${request.client.fullName})`)
  console.log(`  Status:   ${request.status}`)
  console.log(`  Creado:   ${request.createdAt.toISOString()}`)
  console.log(`  Enviado:  ${request.sentAt?.toISOString() ?? '(nunca enviado — sigue en DRAFT?)'}`)
  console.log(`  Items:    ${request.items.length}`)
  console.log(`  Notas:    ${request.notes ?? '(sin nota)'}`)
  console.log(`\nHistoria del pedido:`)
  for (const h of request.history) {
    console.log(`  ${h.changedAt.toISOString()}  ${h.fromStatus ?? '∅'} → ${h.toStatus}${h.notes ? '  (' + h.notes + ')' : ''}`)
  }

  console.log(`\nDestinatarios esperados del mail (admins + dispatchers activos):`)
  const workers = await prisma.user.findMany({
    where: { status: 'ACTIVE', active: true, role: { in: ['DISPATCHER', 'ADMIN'] } },
    select: { email: true, role: true },
  })
  for (const w of workers) console.log(`  - ${w.email}  (${w.role})`)

  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
