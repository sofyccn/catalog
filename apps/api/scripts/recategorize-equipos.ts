/**
 * Re-classify the 216 products currently in "equipos-completos":
 *   - Detect the real equipment category by name (motosierras, guañadas, etc.).
 *   - Detect mislabeled spare parts (NYLON, BARRA, AGUILON…) → mark
 *     isCompleteUnit=false and assign part-type if possible.
 *   - The truly ambiguous machines stay in "equipos-completos" with isCompleteUnit=true.
 *
 * Run with `--dry-run` to preview; without it to commit.
 *   pnpm --filter api exec tsx scripts/recategorize-equipos.ts --dry-run
 *   pnpm --filter api exec tsx scripts/recategorize-equipos.ts
 */
import { prisma } from '../src/lib/prisma.js'

const CATEGORY_NAMES: Record<string, string> = {
  motosierras: 'Motosierras',
  guadanas: 'Guañadas / Desbrozadoras',
  ahoyadoras: 'Ahoyadoras',
  oruga: 'Oruga',
  motores: 'Motores y generadores',
  'motor-diesel': 'Motor diésel',
  motocultores: 'Motocultores',
  'bombas-estacionarias': 'Bombas estacionarias',
  'bombas-mochila': 'Bombas de mochila',
  'bombas-agua': 'Bombas de agua y motobombas',
  'bombas-manuales': 'Bombas manuales',
  sopladores: 'Sopladores',
  'cortadoras-cesped': 'Cortadoras de césped',
  molinos: 'Molinos',
  'maquinas-agricolas': 'Otras máquinas agrícolas',
  electrica: 'Eléctrica',
}

/** Equipment category by product NAME. Order matters — more specific first. */
function inferCategoryFromName(name: string): string | null {
  const n = name.toUpperCase()
  if (/\bMOTOSIERRA\b|\bMS\d{3}\b|\bNT\d{4}\b|\bSH4\d{2}\b|\bCS\d{4}\b|\bMOTO?SIER/.test(n)) return 'motosierras'
  if (/\bGUADA[NÑ]A\b|\bFS\d{2,3}\b|\bSR4\d{2}\b|\bCG\d{2}\b|\bTU\d{2}\b/.test(n)) return 'guadanas'
  if (/\bAHOYADORA\b|\b63CC\b/.test(n)) return 'ahoyadoras'
  if (/\bORUGA\b/.test(n)) return 'oruga'
  if (/\bSOPLADORA?\b/.test(n)) return 'sopladores'
  if (/\bCORTADORA\b.*(CESPED|HIERBA)|\bCESPED\b/.test(n)) return 'cortadoras-cesped'
  if (/\bMOLINO\b/.test(n)) return 'molinos'
  if (/\bBOMBA\b.*MOCHILA|\bMOCHILA\b/.test(n)) return 'bombas-mochila'
  if (/\bBOMBA\b.*(SACAR\s)?AGUA|\bCAUDAL\b/.test(n)) return 'bombas-agua'
  if (/\bBOMBA\b.*MANUAL/.test(n)) return 'bombas-manuales'
  if (/\bBOMBA\b|\bSEMIESTACION|\bCABEZA\b\s*BOMBA|\bCABEZAL\b/.test(n)) return 'bombas-estacionarias'
  if (/\bMOTOCULTOR\b|\bMOTOAZADA\b|\bMINI\s?TRACTOR\b/.test(n)) return 'motocultores'
  if (/\bDIESEL\b|\b178F?\b|\b186F?\b|\b192F?\b|\b188F?\b/.test(n)) return 'motor-diesel'
  if (/\bGENERADOR\b/.test(n)) return 'electrica'
  if (/\bMOLDE\b|\bPELET|\bPICADOR|\bTRITURAD|\bELEVADOR\b|\bNEBUL|\bFERTIL|\bEXPRIMID|\bSIERRA\b|\bCIZALL|\bDESHIERBAD|\bPLANTADORA\b|\bREMOVEDOR\b|\bTRILLADOR|\bTACA\b/.test(n)) return 'maquinas-agricolas'
  if (/\bMOTOR\b|\b6[.,]?5\s?HP\b|\b13\s?HP\b|\b7\s?HP\b|\bGX\d{2}\b|\bHP\b|\bMOTGAS|\bMOGAS\b/.test(n)) return 'motores'
  return null
}

/** Spare-part-ish keywords that signal a row is NOT a machine despite being
 *  filed under MAQUINAS in Fernando's sheet. */
function isMislabeledRepuesto(name: string): { repuesto: true; category: string | null } | { repuesto: false } {
  const n = name.toUpperCase()
  // Names that clearly identify a part, not a machine.
  if (/\bNYLON\b/.test(n)) return { repuesto: true, category: 'guadanas' }
  if (/\bAGUIL[OÓ]N\b|\bLANZA\b/.test(n)) return { repuesto: true, category: 'bombas-estacionarias' }
  if (/\bBARRA\s*PRESI[OÓ]N\b/.test(n)) return { repuesto: true, category: 'bombas-estacionarias' }
  if (/\bPROTECTOR\b.*HERBICIDA/.test(n)) return { repuesto: true, category: 'bombas-estacionarias' }
  if (/\bMEMBRANA\b|\bPAJERO\b|\bTACA\b|\bTIJERA\b\s*INJERTAD/.test(n)) return { repuesto: true, category: null }
  if (/\bARRANQUE\b\s+BRIGGS/.test(n)) return { repuesto: true, category: 'motores' }
  if (/\bTUBO\b\s*ESCAPE/.test(n)) return { repuesto: true, category: 'motores' }
  if (/\bEMBRAGUE\b/.test(n)) return { repuesto: true, category: null }
  if (/\bMEMBRANA\b/.test(n)) return { repuesto: true, category: null }
  if (/\bREMACHADORA\b/.test(n)) return { repuesto: true, category: null }
  if (/\bEXTENSION\b\s*TELESC/.test(n)) return { repuesto: true, category: null }
  if (/\bSAUNA\b|\bBICICLETA\b|\bPATO\b|\bSUPER\s*PEQUE/.test(n)) return { repuesto: false } // Fernando's "casa" goods — keep as machine
  return { repuesto: false }
}

async function ensureCategory(slug: string) {
  return prisma.category.upsert({
    where: { slug },
    update: {},
    create: { slug, name: CATEGORY_NAMES[slug] ?? slug, active: true },
  })
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  console.log(`Modo: ${dryRun ? 'DRY-RUN (no escribe)' : 'ESCRIBE BD'}\n`)

  const ec = await prisma.category.findUnique({ where: { slug: 'equipos-completos' } })
  if (!ec) { console.log('No existe categoría equipos-completos. Nada que hacer.'); return }

  const products = await prisma.product.findMany({
    where: { categoryId: ec.id },
    select: { id: true, code: true, name: true },
    orderBy: { name: 'asc' },
  })
  console.log(`Productos en "Equipos completos" hoy: ${products.length}\n`)

  // Plan changes per product.
  const plan: Array<{
    id: string; code: string; name: string;
    newCategorySlug: string;
    isCompleteUnit: boolean;
    reason: string;
  }> = []

  let toMachine = 0
  let toRepuesto = 0
  let stayAmbiguous = 0
  const newCatTally = new Map<string, number>()

  for (const p of products) {
    const mis = isMislabeledRepuesto(p.name)
    if (mis.repuesto) {
      // Mislabeled spare part.
      const target = mis.category ?? inferCategoryFromName(p.name) ?? 'equipos-completos'
      plan.push({ ...p, newCategorySlug: target, isCompleteUnit: false, reason: 'mislabeled-repuesto' })
      toRepuesto++
      newCatTally.set(target, (newCatTally.get(target) ?? 0) + 1)
      continue
    }
    const cat = inferCategoryFromName(p.name)
    if (cat) {
      plan.push({ ...p, newCategorySlug: cat, isCompleteUnit: true, reason: 'machine-detected' })
      toMachine++
      newCatTally.set(cat, (newCatTally.get(cat) ?? 0) + 1)
    } else {
      // Stays where it is, no change.
      stayAmbiguous++
    }
  }

  console.log(`Plan:`)
  console.log(`  ${String(toMachine).padStart(4)}  máquinas reasignadas a su categoría real`)
  console.log(`  ${String(toRepuesto).padStart(4)}  piezas mal etiquetadas → isCompleteUnit=false`)
  console.log(`  ${String(stayAmbiguous).padStart(4)}  quedan en equipos-completos (sin categoría inferible)`)
  console.log()
  console.log('Distribución por categoría destino:')
  for (const [slug, n] of [...newCatTally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  → ${slug}`)
  }

  if (dryRun) {
    console.log('\nDRY-RUN: no toco la BD.')
    await prisma.$disconnect()
    return
  }

  console.log('\nAplicando cambios…')

  // Ensure all destination categories exist.
  const slugsNeeded = [...new Set(plan.map((p) => p.newCategorySlug))]
  const slugToId = new Map<string, string>()
  for (const slug of slugsNeeded) {
    const c = await ensureCategory(slug)
    slugToId.set(slug, c.id)
  }

  let updated = 0
  for (const p of plan) {
    const newCategoryId = slugToId.get(p.newCategorySlug)!
    await prisma.product.update({
      where: { id: p.id },
      data: { categoryId: newCategoryId, isCompleteUnit: p.isCompleteUnit },
    })
    updated++
    if (updated % 50 === 0) console.log(`  …${updated}/${plan.length}`)
  }

  console.log(`\n✓ ${updated} productos actualizados.`)

  // Report final counts.
  const finalEC = await prisma.product.count({ where: { categoryId: ec.id } })
  const finalMachines = await prisma.product.count({ where: { isCompleteUnit: true } })
  const finalRepuestos = await prisma.product.count({ where: { isCompleteUnit: false } })
  console.log(`\nDespués del cambio:`)
  console.log(`  Equipos completos categoría: ${finalEC}`)
  console.log(`  isCompleteUnit=true (máquinas):  ${finalMachines}`)
  console.log(`  isCompleteUnit=false (repuestos): ${finalRepuestos}`)

  await prisma.$disconnect()
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
