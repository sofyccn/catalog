/** Read-only: preview re-classifying the 216 products in "equipos-completos"
 *  to their real equipment category (motosierras, guañadas, etc.) using the
 *  same inferCategoryFromName logic as the import. */
import { prisma } from '../src/lib/prisma.js'

function inferCategoryFromName(name: string): string | null {
  const n = name.toUpperCase()
  if (/\bMOTOSIERRA\b|\bMS\d{3}\b|\bNT\d{4}\b|\bSH4\d{2}\b/.test(n)) return 'motosierras'
  if (/\bGUADA[NÑ]A\b|\bFS\d{2,3}\b|\bSR4\d{2}\b|\bCG\d{2}\b|\bTU\d{2}\b/.test(n)) return 'guadanas'
  if (/\bAHOYADORA\b|\b63CC\b/.test(n)) return 'ahoyadoras'
  if (/\bORUGA\b/.test(n)) return 'oruga'
  if (/\bBOMBA\b.*MOCHILA|\bMOCHILA\b/.test(n)) return 'bombas-mochila'
  if (/\bBOMBA\b.*(SACAR\s)?AGUA|\bCAUDAL\b/.test(n)) return 'bombas-agua'
  if (/\bBOMBA\b.*MANUAL/.test(n)) return 'bombas-manuales'
  if (/\bBOMBA\b/.test(n)) return 'bombas-estacionarias'
  if (/\bMOTOCULTOR\b|\bMOTOAZADA\b|\bMINI\s?TRACTOR\b/.test(n)) return 'motocultores'
  if (/\bDIESEL\b|\b178F?\b|\b186F?\b|\b192F?\b|\b188F?\b/.test(n)) return 'motor-diesel'
  if (/\bGENERADOR\b/.test(n)) return 'electrica'
  if (/\bMOLINO\b|\bPELET|\bPICADOR|\bCORTADOR\b|\bTRITURAD|\bELEVADOR\b|\bNEBUL|\bFERTIL|\bEXPRIMID|\bSIERRA\b|\bCIZALL|\bDESHIERBAD/.test(n)) return 'maquinas-agro'
  if (/\bMOTOR\b|\b6[.,]?5\s?HP\b|\b13\s?HP\b|\b7\s?HP\b|\bGX\d{2}\b|\bHP\b/.test(n)) return 'motores'
  return null
}

async function main() {
  const equiposCompletosCat = await prisma.category.findUnique({ where: { slug: 'equipos-completos' } })
  if (!equiposCompletosCat) {
    console.log('No existe la categoría "equipos-completos".')
    return
  }
  const products = await prisma.product.findMany({
    where: { categoryId: equiposCompletosCat.id },
    select: { id: true, code: true, name: true },
  })
  console.log(`Hay ${products.length} productos en "Equipos completos".\n`)

  const tally = new Map<string, number>()
  const unmatched: Array<{ code: string; name: string }> = []
  for (const p of products) {
    const slug = inferCategoryFromName(p.name)
    if (slug) tally.set(slug, (tally.get(slug) ?? 0) + 1)
    else unmatched.push({ code: p.code, name: p.name })
  }

  console.log('Reasignaciones que detecté:')
  for (const [slug, n] of [...tally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  → ${slug}`)
  }
  console.log(`  ${String(unmatched.length).padStart(4)}  → (sin equipo claro, quedarían en 'equipos-completos')`)

  if (unmatched.length > 0 && unmatched.length <= 40) {
    console.log('\nLos sin equipo claro:')
    for (const p of unmatched) console.log(`  ${p.code}  ${p.name}`)
  } else if (unmatched.length > 40) {
    console.log('\nPrimeros 40 sin equipo claro:')
    for (const p of unmatched.slice(0, 40)) console.log(`  ${p.code}  ${p.name}`)
  }

  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
