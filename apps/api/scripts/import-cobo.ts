/**
 * Import Fernando's catalog (1208 products) from .xls into the BD.
 * Reuses the mapping logic from import-cobo-analyze.ts.
 *
 * Usage:
 *   pnpm --filter api exec tsx scripts/import-cobo.ts <path> [--dry-run]
 *   pnpm --filter api exec tsx scripts/import-cobo.ts /home/sofia/Documents/catalog/SOFI.xls
 *
 * Upserts categories, part types, brands, and products. Idempotent on `code`.
 */
import { read, utils } from 'xlsx'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { prisma } from '../src/lib/prisma.js'

// ----- Same mapping rules as the analyze script ---------------------------

const CATEGORY_MAP: Record<string, string> = {
  'motosierras': 'motosierras',
  'guadaña': 'guadanas',
  'guadanas': 'guadanas',
  'ahoyadora': 'ahoyadoras',
  'motores': 'motores',
  'motor diesel': 'motor-diesel',
  'motocultores': 'motocultores',
  'bomba estacionaria': 'bombas-estacionarias',
  'bomba de mochila': 'bombas-mochila',
  'bomba de sacar agua': 'bombas-agua',
  'repuesto bombas manuales': 'bombas-manuales',
  'podador hierba coche': 'podadores-hierba',
  'electrica': 'electrica',
  'construccion': 'construccion',
  'construcción': 'construccion',
  'repuestos oruga': 'oruga',
  'maquinas': 'equipos-completos',
  'máquinas': 'equipos-completos',
}

// Slug → human-readable display name for new categories.
const CATEGORY_NAMES: Record<string, string> = {
  'motosierras': 'Motosierras',
  'guadanas': 'Guañadas',
  'ahoyadoras': 'Ahoyadoras',
  'motores': 'Motores',
  'motor-diesel': 'Motor diésel',
  'motocultores': 'Motocultores',
  'bombas-estacionarias': 'Bombas estacionarias',
  'bombas-mochila': 'Bombas de mochila',
  'bombas-agua': 'Bombas de agua',
  'bombas-manuales': 'Bombas manuales',
  'podadores-hierba': 'Podadores de hierba',
  'electrica': 'Eléctrica',
  'construccion': 'Construcción',
  'oruga': 'Oruga',
  'equipos-completos': 'Equipos completos',
}

const BRAND_NAMES: Record<string, string> = {
  'sthil': 'STIHL',
  'stihl': 'STIHL',
  'husbarna': 'Husqvarna',
  'husqvarna': 'Husqvarna',
  'farmate': 'Farmate',
  'farmater': 'Farmate',
  'jacto': 'Jacto',
  'matabi': 'Matabi',
  'honda': 'Honda',
  'cifareli': 'Cifareli',
  'cifarelli': 'Cifareli',
  'oregon': 'Oregon',
  'robin': 'Robin',
  'subaru': 'Subaru',
  'shindaiwa': 'Shindaiwa',
  'echo': 'Echo',
}

const NO_CATEGORY = new Set(['no aplica', 'no aplican', ''])

const PART_TYPE_RULES: Array<[RegExp, string]> = [
  [/\bCARBURADOR\b/, 'carburadores'],
  [/\bBOBINA\b/, 'encendido'],
  [/\bBUJ[IÍ]A\b/, 'encendido'],
  [/\bMAGNETO\b/, 'encendido'],
  [/\bCAPUCH[OÓ]N\b/, 'encendido'],
  [/\bSWITCH\b/, 'encendido'],
  [/\bARRANQUE\b/, 'arranque'],
  [/\bCIG[UÜ]E[NÑ]AL\b/, 'motor-interno'],
  [/\bPIST[OÓ]N\b/, 'motor-interno'],
  [/\bBIELA\b/, 'motor-interno'],
  [/\bCILINDRO\b/, 'motor-interno'],
  [/\bBLOCK\b/, 'motor-interno'],
  [/\bCABEZOTE\b/, 'motor-interno'],
  [/\bCABEZAL\b/, 'motor-interno'],
  [/\bARBOL\b.*LEVAS/, 'motor-interno'],
  [/\bV[AÁ]LVULA\b/, 'motor-interno'],
  [/\bRING\b/, 'motor-interno'],
  [/\bEMBOLO\b/, 'motor-interno'],
  [/\bBOMBA\b.*ACEITE/, 'motor-interno'],
  [/\bEMBRAGUE\b/, 'embrague-transmision'],
  [/\bPLATO\b.*EMBRAGUE/, 'embrague-transmision'],
  [/\bCAJA\b.*ENGRANAJE/, 'embrague-transmision'],
  [/\bENGRANAJE\b/, 'embrague-transmision'],
  [/\bCAMPANA\b/, 'embrague-transmision'],
  [/\bPI[NÑ][OÓ]N\b/, 'embrague-transmision'],
  [/\bPOLEA\b/, 'embrague-transmision'],
  [/\bCORREA\b/, 'embrague-transmision'],
  [/\bBANDA\b/, 'embrague-transmision'],
  [/\bCADENA\b/, 'cadenas-barras'],
  [/\bESPADA\b/, 'cadenas-barras'],
  [/\bBARRA\b.*PRESI[OÓ]N/, 'cadenas-barras'],
  [/\bBARRA\b/, 'cadenas-barras'],
  [/\bFILTRO\b/, 'filtros'],
  [/\bCEDAZO\b/, 'filtros'],
  [/\bEMPAQUE\b/, 'empaques-sellos'],
  [/\bSELLO\b/, 'empaques-sellos'],
  [/\bRETENEDOR\b/, 'empaques-sellos'],
  [/\bJUEGO\b.*EMPAQUE/, 'empaques-sellos'],
  [/\bAMORTIGUADOR\b/, 'empaques-sellos'],
  [/\bTUBO\b.*ESCAPE/, 'escape'],
  [/\bESCAPE\b/, 'escape'],
  [/\bDISCO\b/, 'discos-cuchillas'],
  [/\bCUCHILLA\b/, 'discos-cuchillas'],
  [/\bNYLON\b/, 'discos-cuchillas'],
  [/\bYOYO\b/, 'discos-cuchillas'],
  [/\bDESHIERBADOR\b/, 'discos-cuchillas'],
  [/\bGRASERO\b/, 'discos-cuchillas'],
  [/\bLANZA\b/, 'lanzas'],
  [/\bAGUIL[OÓ]N\b/, 'lanzas'],
  [/\bBOQUILLA\b/, 'aspersion'],
  [/\bMANGUERA\b/, 'mangueras'],
  [/\bMANGO\b/, 'mangueras'],
  [/\bACELERADOR\b/, 'mandos'],
  [/\bCABLE\b.*ACELERAR/, 'mandos'],
  [/\bMANUBRIO\b/, 'mandos'],
  [/\bMANO\b.*ACELER/, 'mandos'],
  [/\bMANDO\b/, 'mandos'],
  [/\bARNEZ\b/, 'cuerpo'],
  [/\bTANQUE\b/, 'cuerpo'],
  [/\bBASE\b/, 'cuerpo'],
  [/\bBRIDA\b/, 'cuerpo'],
  [/\bACORDION\b/, 'cuerpo'],
  [/\bCAMARA\b.*AIRE/, 'cuerpo'],
  [/\bIMPELER\b/, 'cuerpo'],
  [/\bBATER[IÍ]A\b/, 'accesorios-epp'],
  [/\bCARGADOR\b/, 'accesorios-epp'],
  [/\bREGULADOR\b.*VOLTAJE/, 'accesorios-epp'],
  [/\bGENERADOR\b/, 'accesorios-epp'],
]

// Slug → display name for any part type the import may need to create.
const PART_TYPE_NAMES: Record<string, string> = {
  'carburadores': 'Carburadores',
  'encendido': 'Encendido',
  'arranque': 'Arranque',
  'motor-interno': 'Motor interno',
  'embrague-transmision': 'Embrague / transmisión',
  'cadenas-barras': 'Cadenas y barras',
  'filtros': 'Filtros',
  'empaques-sellos': 'Empaques y sellos',
  'escape': 'Escape',
  'discos-cuchillas': 'Discos y cuchillas',
  'lanzas': 'Lanzas',
  'aspersion': 'Aspersión',
  'mangueras': 'Mangueras',
  'mandos': 'Mandos',
  'cuerpo': 'Cuerpo',
  'accesorios-epp': 'Accesorios / EPP',
}

// ----- Mapping helpers (same as analyze) ----------------------------------

interface MappedRow {
  code: string
  name: string
  description: string | null
  price: number
  categorySlug: string | null
  brandName: string | null
  partTypeSlug: string | null
  isCompleteUnit: boolean
  warehouseLocation: string | null
}

const norm = (s: unknown) => String(s ?? '').trim()
const normLower = (s: unknown) => norm(s).toLowerCase()

function inferCategoryFromName(name: string): string | null {
  const n = name.toUpperCase()
  if (/\bMOTOSIERRA\b|\bMS\d{3}\b|\bNT\d{4}\b|\bSH4\d{2}\b/.test(n)) return 'motosierras'
  if (/\bGUADA[NÑ]A\b|\bFS\d{2,3}\b|\bSR4\d{2}\b|\bNT?B?4?5?0?B\b|\bCG\d{2}\b|\bTU\d{2}\b/.test(n)) return 'guadanas'
  if (/\bAHOYADORA\b|\b63CC\b/.test(n)) return 'ahoyadoras'
  if (/\bBOMBA\b.*MOCHILA|\bMOCHILA\b/.test(n)) return 'bombas-mochila'
  if (/\bBOMBA\b.*(SACAR\s)?AGUA|\bIMPELER\b/.test(n)) return 'bombas-agua'
  if (/\bBOMBA\b.*MANUAL/.test(n)) return 'bombas-manuales'
  if (/\bBOMBA\b/.test(n)) return 'bombas-estacionarias'
  if (/\bMOTOCULTOR\b/.test(n)) return 'motocultores'
  if (/\bDIESEL\b|\b178F?\b|\b186F?\b|\b192F?\b|\b188F?\b/.test(n)) return 'motor-diesel'
  if (/\bMOTOR\b|\b6[.,]?5\s?HP\b|\b13\s?HP\b|\bGX\d{2}\b/.test(n)) return 'motores'
  return null
}

function detectPartType(name: string): string | null {
  for (const [re, slug] of PART_TYPE_RULES) {
    if (re.test(name.toUpperCase())) return slug
  }
  return null
}

function mapRow(r: {
  codigo: string; nombre: string; descripcion: string; precio: number;
  categoria: string; casillero: string
}): MappedRow | null {
  const catKey = normLower(r.categoria)
  let categorySlug: string | null = null
  let brandName: string | null = null
  let isCompleteUnit = false

  if (NO_CATEGORY.has(catKey)) {
    // leave null
  } else if (CATEGORY_MAP[catKey]) {
    categorySlug = CATEGORY_MAP[catKey]
    if (categorySlug === 'equipos-completos') isCompleteUnit = true
  } else if (BRAND_NAMES[catKey]) {
    brandName = BRAND_NAMES[catKey]
    categorySlug = inferCategoryFromName(r.nombre)
    if (!categorySlug) {
      if (brandName === 'Farmate') categorySlug = 'bombas-estacionarias'
      else if (brandName === 'Husqvarna' || brandName === 'STIHL') categorySlug = 'guadanas'
    }
  }

  if (!brandName) {
    const upper = r.nombre.toUpperCase()
    for (const [key, real] of Object.entries(BRAND_NAMES)) {
      if (new RegExp(`\\b${key.toUpperCase()}\\b`).test(upper)) { brandName = real; break }
    }
  }

  const partTypeSlug = detectPartType(r.nombre)
  const cas = norm(r.casillero).replace(/-+$/, '').replace(/-+/, '-').trim()
  const warehouseLocation = cas.length > 0 ? cas : null

  return {
    code: norm(r.codigo),
    name: norm(r.nombre),
    description: norm(r.descripcion) || null,
    price: typeof r.precio === 'number' ? r.precio : Number(r.precio) || 0,
    categorySlug,
    brandName,
    partTypeSlug,
    isCompleteUnit,
    warehouseLocation,
  }
}

// ----- Main ---------------------------------------------------------------

async function main() {
  const filePath = resolve(process.argv[2] ?? '')
  const dryRun = process.argv.includes('--dry-run')
  if (!filePath || filePath === resolve('')) {
    console.error('Usage: tsx scripts/import-cobo.ts <path-to-xls> [--dry-run]')
    process.exit(1)
  }

  console.log(`Modo: ${dryRun ? 'DRY-RUN (no escribe BD)' : 'IMPORT REAL'}`)
  console.log(`Archivo: ${filePath}\n`)

  const wb = read(readFileSync(filePath))
  const sheet = wb.Sheets[wb.SheetNames[0]!]!
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const first = rows[0] ?? {}

  function findCol(row: Record<string, unknown>, candidates: RegExp[]): string {
    for (const k of Object.keys(row)) {
      const lk = k.toLowerCase().trim()
      if (candidates.some((re) => re.test(lk))) return k
    }
    return ''
  }
  const colCode = findCol(first, [/^c[oó]digo$/])
  const colName = findCol(first, [/^nombre$/])
  const colDesc = findCol(first, [/^descripci[oó]n$/])
  const colPrice = findCol(first, [/^precio/])
  const colCat = findCol(first, [/^categor[ií]a$/])
  const colCasillero = findCol(first, [/casillero/])

  const mapped: MappedRow[] = []
  const seen = new Set<string>()
  for (const r of rows) {
    const codigo = norm(r[colCode])
    const nombre = norm(r[colName])
    if (!codigo || !nombre || seen.has(codigo)) continue
    seen.add(codigo)
    const m = mapRow({
      codigo, nombre,
      descripcion: norm(r[colDesc]),
      precio: Number(r[colPrice]) || 0,
      categoria: norm(r[colCat]),
      casillero: norm(r[colCasillero]),
    })
    if (m) mapped.push(m)
  }

  // Unique reference values we'll need.
  const categorySlugs = [...new Set(mapped.map((m) => m.categorySlug).filter(Boolean))] as string[]
  const brandNames = [...new Set(mapped.map((m) => m.brandName).filter(Boolean))] as string[]
  const partTypeSlugs = [...new Set(mapped.map((m) => m.partTypeSlug).filter(Boolean))] as string[]

  console.log(`Productos a procesar:    ${mapped.length}`)
  console.log(`Categorías necesarias:   ${categorySlugs.length}`)
  console.log(`Marcas necesarias:       ${brandNames.length}`)
  console.log(`Tipos de parte:          ${partTypeSlugs.length}`)
  console.log()

  if (dryRun) {
    console.log('DRY-RUN: no escribo BD. Saliendo.')
    await prisma.$disconnect()
    return
  }

  // ----- Upsert categories / brands / part types ------------------------

  console.log('› Upserting categorías…')
  const categoryByslug = new Map<string, string>()
  for (const slug of categorySlugs) {
    const name = CATEGORY_NAMES[slug] ?? slug
    const c = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { slug, name, active: true },
    })
    categoryByslug.set(slug, c.id)
  }

  console.log('› Upserting marcas…')
  const brandByName = new Map<string, string>()
  for (const name of brandNames) {
    const b = await prisma.brand.upsert({
      where: { name },
      update: {},
      create: { name, aliases: [], active: true },
    })
    brandByName.set(name, b.id)
  }

  console.log('› Upserting tipos de parte…')
  const partTypeByslug = new Map<string, string>()
  for (const slug of partTypeSlugs) {
    const name = PART_TYPE_NAMES[slug] ?? slug
    const pt = await prisma.partType.upsert({
      where: { slug },
      update: {},
      create: { slug, name, active: true },
    })
    partTypeByslug.set(slug, pt.id)
  }

  // ----- Upsert products ------------------------------------------------

  console.log(`\n› Upserting ${mapped.length} productos…`)
  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: Array<{ code: string; msg: string }> = []

  for (let i = 0; i < mapped.length; i++) {
    const m = mapped[i]!
    if (!m.categorySlug) {
      // Without a category we can't satisfy the required Product.categoryId.
      // We park these under "equipos-completos" as a safe default; they're the
      // 25 "NO APLICA" rows and the admin can re-classify from /admin/catalogo.
      m.categorySlug = 'equipos-completos'
    }
    const categoryId = categoryByslug.get(m.categorySlug)
    if (!categoryId) {
      // Lazy-create unknown category just-in-time.
      const c = await prisma.category.upsert({
        where: { slug: m.categorySlug },
        update: {},
        create: { slug: m.categorySlug, name: CATEGORY_NAMES[m.categorySlug] ?? m.categorySlug, active: true },
      })
      categoryByslug.set(m.categorySlug, c.id)
    }

    const data = {
      name: m.name,
      description: m.description,
      price: m.price,
      categoryId: categoryByslug.get(m.categorySlug)!,
      brandId: m.brandName ? brandByName.get(m.brandName) ?? null : null,
      partTypeId: m.partTypeSlug ? partTypeByslug.get(m.partTypeSlug) ?? null : null,
      isCompleteUnit: m.isCompleteUnit,
      warehouseLocation: m.warehouseLocation,
      active: true,
    }

    try {
      const existing = await prisma.product.findUnique({ where: { code: m.code } })
      if (existing) {
        await prisma.product.update({ where: { code: m.code }, data })
        updated++
      } else {
        await prisma.product.create({ data: { code: m.code, ...data } })
        inserted++
      }
    } catch (err) {
      errors.push({ code: m.code, msg: (err as Error).message })
      skipped++
    }

    if ((i + 1) % 100 === 0) console.log(`  …${i + 1}/${mapped.length}`)
  }

  console.log('\n═'.repeat(60))
  console.log(`✓ insertados:  ${inserted}`)
  console.log(`✓ actualizados: ${updated}`)
  console.log(`✗ con error:   ${skipped}`)
  console.log('═'.repeat(60))

  if (errors.length) {
    console.log('\nErrores:')
    for (const e of errors.slice(0, 20)) console.log(`  ${e.code}: ${e.msg}`)
    if (errors.length > 20) console.log(`  …y ${errors.length - 20} más`)
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error('FATAL:', e)
  await prisma.$disconnect()
  process.exit(1)
})
