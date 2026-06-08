/**
 * Analyze the raw .xls catalog from Fernando before importing.
 * Reads rows, normalizes the "Categoría" column (which mixes category +
 * brand + isCompleteUnit), detects PartType from the product name, and
 * prints a summary + a few representative samples.
 *
 * No DB writes. Run with:
 *   pnpm --filter api exec tsx scripts/import-cobo-analyze.ts /home/sofia/Documents/catalog/SOFI.xls
 */
import { read, utils } from 'xlsx'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ----- Mapping rules ------------------------------------------------------

// Raw "Categoría" cell value (lowercased & trimmed) → canonical category slug.
// Anything not here is either a brand (BRAND_NAMES) or unknown.
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

// "Categoría" values that are actually brand names.
const BRAND_NAMES: Record<string, string> = {
  'sthil': 'STIHL', // Fernando's hoja consistently misspells STIHL as STHIL
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

// Categoría = "NO APLICA" → no category assigned.
const NO_CATEGORY = new Set(['no aplica', 'no aplican', ''])

// Order matters: longest/most-specific keywords first. Each entry: regex → PartType slug.
// We scan the product NAME (uppercased) and assign the first match.
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
  [/\bBOMBA\b.*ACEITE/, 'motor-interno'],
  [/\bBATER[IÍ]A\b/, 'electrica'],
  [/\bCARGADOR\b/, 'electrica'],
  [/\bREGULADOR\b.*VOLTAJE/, 'electrica'],
  [/\bGENERADOR\b/, 'electrica'],
]

// ----- Helpers ------------------------------------------------------------

interface RawRow {
  codigo: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  modelos: string
  casillero: string
}

interface MappedRow {
  raw: RawRow
  code: string
  name: string
  description: string | null
  price: number
  categorySlug: string | null
  brandName: string | null
  partTypeSlug: string | null
  isCompleteUnit: boolean
  warehouseLocation: string | null
  warnings: string[]
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

function mapRow(r: RawRow): MappedRow {
  const catKey = normLower(r.categoria)
  const warnings: string[] = []

  let categorySlug: string | null = null
  let brandName: string | null = null
  let isCompleteUnit = false

  if (NO_CATEGORY.has(catKey)) {
    // leave categorySlug null; warn so we surface these
    warnings.push('sin categoría (NO APLICA)')
  } else if (CATEGORY_MAP[catKey]) {
    categorySlug = CATEGORY_MAP[catKey]
    if (categorySlug === 'equipos-completos') isCompleteUnit = true
  } else if (BRAND_NAMES[catKey]) {
    brandName = BRAND_NAMES[catKey]
    categorySlug = inferCategoryFromName(r.nombre)
    if (!categorySlug) {
      // Brand default per Sofia: Farmate → bombas estacionarias (most parts go there),
      // Husqvarna/STIHL → guañadas (every HUS/STIHL product in this catalog is a
      // guadaña accessory; chainsaw STIHL products already get inferred by name).
      if (brandName === 'Farmate') categorySlug = 'bombas-estacionarias'
      else if (brandName === 'Husqvarna' || brandName === 'STIHL') categorySlug = 'guadanas'
      else warnings.push(`marca ${brandName} sin categoría inferible`)
    }
  } else {
    warnings.push(`categoría desconocida: "${r.categoria}"`)
  }

  // Try to also detect brand from name even when categoría wasn't a brand.
  if (!brandName) {
    const upper = r.nombre.toUpperCase()
    for (const [key, real] of Object.entries(BRAND_NAMES)) {
      if (new RegExp(`\\b${key.toUpperCase()}\\b`).test(upper)) {
        brandName = real
        break
      }
    }
  }

  const partTypeSlug = detectPartType(r.nombre)
  if (!partTypeSlug && !isCompleteUnit) warnings.push('tipo de parte no detectado')

  // CASILLERO: strip trailing "--" placeholders, treat "--" as empty
  const cas = norm(r.casillero).replace(/-+$/, '').replace(/-+/, '-').trim()
  const warehouseLocation = cas.length > 0 ? cas : null

  return {
    raw: r,
    code: norm(r.codigo),
    name: norm(r.nombre),
    description: norm(r.descripcion) || null,
    price: typeof r.precio === 'number' ? r.precio : Number(r.precio) || 0,
    categorySlug,
    brandName,
    partTypeSlug,
    isCompleteUnit,
    warehouseLocation,
    warnings,
  }
}

// ----- Main ---------------------------------------------------------------

const filePath = resolve(process.argv[2] ?? '')
if (!filePath) {
  console.error('Usage: tsx scripts/import-cobo-analyze.ts <path-to-xls>')
  process.exit(1)
}

const wb = read(readFileSync(filePath))
console.log(`Sheets: ${wb.SheetNames.join(', ')}\n`)

const sheetName = wb.SheetNames[0]!
const sheet = wb.Sheets[sheetName]!
const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
console.log(`Filas totales en hoja "${sheetName}": ${rows.length}\n`)

// Map header keys flexibly (Fernando's columns).
function findCol(row: Record<string, unknown>, candidates: RegExp[]): string {
  for (const k of Object.keys(row)) {
    const lk = k.toLowerCase().trim()
    if (candidates.some((re) => re.test(lk))) return k
  }
  return ''
}

const first = rows[0] ?? {}
const colCode = findCol(first, [/^c[oó]digo$/])
const colName = findCol(first, [/^nombre$/])
const colDesc = findCol(first, [/^descripci[oó]n$/])
const colPrice = findCol(first, [/^precio/])
const colCat = findCol(first, [/^categor[ií]a$/])
const colModels = findCol(first, [/modelos/])
const colCasillero = findCol(first, [/casillero/])

console.log('Columnas detectadas:')
console.log(`  código     → "${colCode}"`)
console.log(`  nombre     → "${colName}"`)
console.log(`  descrip.   → "${colDesc}"`)
console.log(`  precio     → "${colPrice}"`)
console.log(`  categoría  → "${colCat}"`)
console.log(`  modelos    → "${colModels}"`)
console.log(`  casillero  → "${colCasillero}"\n`)

const mapped: MappedRow[] = []
let skippedEmpty = 0
const seenCodes = new Set<string>()
const duplicates: string[] = []

for (const r of rows) {
  const codigo = norm(r[colCode])
  const nombre = norm(r[colName])
  if (!codigo || !nombre) { skippedEmpty++; continue }
  if (seenCodes.has(codigo)) { duplicates.push(codigo); continue }
  seenCodes.add(codigo)

  mapped.push(
    mapRow({
      codigo,
      nombre,
      descripcion: norm(r[colDesc]),
      precio: Number(r[colPrice]) || 0,
      categoria: norm(r[colCat]),
      modelos: norm(r[colModels]),
      casillero: norm(r[colCasillero]),
    }),
  )
}

// ----- Summary -----------------------------------------------------------

const byCategory = new Map<string, number>()
const byBrand = new Map<string, number>()
const byPartType = new Map<string, number>()
const warningsByKind = new Map<string, number>()
let withCasillero = 0
let isCompleteCount = 0

for (const m of mapped) {
  byCategory.set(m.categorySlug ?? '∅ sin categoría', (byCategory.get(m.categorySlug ?? '∅ sin categoría') ?? 0) + 1)
  byBrand.set(m.brandName ?? '∅ sin marca', (byBrand.get(m.brandName ?? '∅ sin marca') ?? 0) + 1)
  byPartType.set(m.partTypeSlug ?? '∅ sin tipo', (byPartType.get(m.partTypeSlug ?? '∅ sin tipo') ?? 0) + 1)
  if (m.warehouseLocation) withCasillero++
  if (m.isCompleteUnit) isCompleteCount++
  for (const w of m.warnings) {
    const key = w.startsWith('categoría desconocida') ? 'categoría desconocida (varias)' : w
    warningsByKind.set(key, (warningsByKind.get(key) ?? 0) + 1)
  }
}

const sortedDesc = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])

console.log('═'.repeat(70))
console.log(`RESUMEN: ${mapped.length} productos válidos, ${skippedEmpty} filas vacías, ${duplicates.length} códigos duplicados`)
console.log('═'.repeat(70))

console.log('\nPor CATEGORÍA:')
for (const [k, n] of sortedDesc(byCategory)) console.log(`  ${String(n).padStart(4)}  ${k}`)

console.log('\nPor MARCA:')
for (const [k, n] of sortedDesc(byBrand)) console.log(`  ${String(n).padStart(4)}  ${k}`)

console.log('\nPor TIPO DE PARTE:')
for (const [k, n] of sortedDesc(byPartType)) console.log(`  ${String(n).padStart(4)}  ${k}`)

console.log(`\nEquipos completos: ${isCompleteCount}`)
console.log(`Con casillero: ${withCasillero}/${mapped.length}`)

console.log('\nWARNINGS:')
for (const [k, n] of sortedDesc(warningsByKind)) console.log(`  ${String(n).padStart(4)}  ${k}`)

if (duplicates.length) {
  console.log(`\nCódigos duplicados (${duplicates.length}):`, duplicates.slice(0, 20).join(', '), duplicates.length > 20 ? '…' : '')
}

// ----- Samples -----------------------------------------------------------

console.log('\n' + '═'.repeat(70))
console.log('MUESTRA DE 15 PRODUCTOS (cómo quedaría cada uno)')
console.log('═'.repeat(70))
const pick = (arr: MappedRow[], n: number) => {
  const step = Math.max(1, Math.floor(arr.length / n))
  return Array.from({ length: n }, (_, i) => arr[i * step]).filter(Boolean) as MappedRow[]
}
for (const m of pick(mapped, 15)) {
  console.log(
    `\n  ${m.code} — ${m.name}\n` +
    `    precio: $${m.price}\n` +
    `    categoría: ${m.categorySlug ?? '—'}   marca: ${m.brandName ?? '—'}   tipo: ${m.partTypeSlug ?? '—'}\n` +
    `    equipo completo: ${m.isCompleteUnit ? 'sí' : 'no'}   casillero: ${m.warehouseLocation ?? '—'}\n` +
    `    raw categoría: "${m.raw.categoria}"  ${m.warnings.length ? '· ' + m.warnings.join(', ') : ''}`,
  )
}

// ----- Unknown categoría values (for me to add to CATEGORY_MAP) ----------

const unknownCats = new Map<string, number>()
for (const m of mapped) {
  const w = m.warnings.find((x) => x.startsWith('categoría desconocida'))
  if (w) {
    const cat = w.replace('categoría desconocida: "', '').replace('"', '')
    unknownCats.set(cat, (unknownCats.get(cat) ?? 0) + 1)
  }
}
if (unknownCats.size > 0) {
  console.log('\nVALORES DE "Categoría" NO MAPEADOS (revisa y dime cómo tratarlos):')
  for (const [k, n] of sortedDesc(unknownCats)) console.log(`  ${String(n).padStart(4)}  "${k}"`)
}
