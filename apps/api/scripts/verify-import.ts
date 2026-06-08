/** Quick sanity check after the Cobo import. */
import { prisma } from '../src/lib/prisma.js'

async function main() {
  const total = await prisma.product.count()
  const completos = await prisma.product.count({ where: { isCompleteUnit: true } })
  const conCasillero = await prisma.product.count({ where: { warehouseLocation: { not: null } } })
  const conMarca = await prisma.product.count({ where: { brandId: { not: null } } })
  const conTipo = await prisma.product.count({ where: { partTypeId: { not: null } } })

  console.log(`Total productos:  ${total}`)
  console.log(`Equipos completos: ${completos}`)
  console.log(`Con casillero:    ${conCasillero}`)
  console.log(`Con marca:        ${conMarca}`)
  console.log(`Con tipo de parte:${conTipo}`)

  console.log('\n5 motosierras de muestra:')
  const ms = await prisma.product.findMany({
    where: { category: { slug: 'motosierras' } },
    take: 5,
    include: { brand: true, partType: true, category: true },
    orderBy: { name: 'asc' },
  })
  for (const p of ms) {
    console.log(`  ${p.code}  ${p.name}  · ${p.category.name} · ${p.brand?.name ?? '—'} · ${p.partType?.name ?? '—'} · $${p.price} · casillero ${p.warehouseLocation ?? '—'}`)
  }

  console.log('\nTop 10 categorías por # productos:')
  const groups = await prisma.product.groupBy({
    by: ['categoryId'],
    _count: { _all: true },
    orderBy: { _count: { categoryId: 'desc' } },
    take: 15,
  })
  for (const g of groups) {
    const c = await prisma.category.findUnique({ where: { id: g.categoryId } })
    console.log(`  ${String(g._count._all).padStart(4)}  ${c?.name ?? g.categoryId} (${c?.slug})`)
  }

  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
