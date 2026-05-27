import { prisma } from '../src/lib/prisma.js'

// [slug, name] — display order follows array order.
const CATEGORIES: [string, string][] = [
  ['motosierras', 'Motosierras'],
  ['guadanas', 'Guadañas / Desbrozadoras'],
  ['fumigadoras', 'Fumigadoras y bombas de mochila'],
  ['ahoyadoras', 'Ahoyadoras'],
  ['sopladores', 'Sopladores y atomizadores'],
  ['bombas-agua', 'Bombas de agua y motobombas'],
  ['cortadoras-cesped', 'Cortadoras de césped y podadoras'],
  ['molinos', 'Molinos'],
  ['motores', 'Motores y generadores'],
  ['accesorios', 'Accesorios y herramientas manuales'],
]

const PART_TYPES: [string, string][] = [
  ['carburadores', 'Carburadores y combustible'],
  ['encendido', 'Encendido'],
  ['motor-interno', 'Motor interno'],
  ['arranque', 'Arranque'],
  ['embrague-transmision', 'Embrague y transmisión'],
  ['filtros', 'Filtros'],
  ['empaques-sellos', 'Empaques y sellos'],
  ['escape', 'Escape'],
  ['cadenas-barras', 'Cadenas y barras'],
  ['discos-cuchillas', 'Discos y cuchillas'],
  ['aspersion', 'Aspersión y boquillas'],
  ['mangueras', 'Mangueras y conexiones'],
  ['mandos', 'Acelerador y mandos'],
  ['cuerpo', 'Cuerpo y estructura'],
  ['equipos-completos', 'Equipos completos'],
  ['accesorios-epp', 'Accesorios y EPP'],
]

// [canonicalName, aliases]
const BRANDS: [string, string[]][] = [
  ['STIHL', ['STHIL', 'ESTIHL']],
  ['Husqvarna', ['HUSBARNA', 'HUS', 'HUSVARNA']],
  ['Honda', []],
  ['Farmate', ['FARMATER']],
  ['Cifareli', ['CIFARELLI']],
  ['Jacto', []],
  ['Matabi', []],
  ['Oregon', []],
  ['Robin', []],
  ['Subaru', []],
  ['Shindaiwa', []],
  ['Echo', []],
]

// [code, name, brandName|null, categorySlug]
const MODELS: [string, string, string | null, string][] = [
  ['MS660', 'STIHL MS660', 'STIHL', 'motosierras'],
  ['MS381', 'STIHL MS381', 'STIHL', 'motosierras'],
  ['MS250', 'STIHL MS250', 'STIHL', 'motosierras'],
  ['MS170', 'STIHL MS170', 'STIHL', 'motosierras'],
  ['SR420', 'STIHL SR420', 'STIHL', 'sopladores'],
  ['FS55', 'STIHL FS55', 'STIHL', 'guadanas'],
  ['FS160', 'STIHL FS160', 'STIHL', 'guadanas'],
  ['FS161', 'STIHL FS161', 'STIHL', 'guadanas'],
  ['FS191', 'STIHL FS191', 'STIHL', 'guadanas'],
  ['FS280', 'STIHL FS280', 'STIHL', 'guadanas'],
  ['FS291', 'STIHL FS291', 'STIHL', 'guadanas'],
  ['143RII', 'Husqvarna 143RII', 'Husqvarna', 'guadanas'],
  ['GX35', 'Honda GX35', 'Honda', 'motores'],
  ['GX50', 'Honda GX50', 'Honda', 'motores'],
  ['GX120', 'Honda GX120', 'Honda', 'motores'],
  ['GX160', 'Honda GX160', 'Honda', 'motores'],
  ['TF800', 'Farmate TF800', 'Farmate', 'fumigadoras'],
  ['TF900', 'Farmate TF900 4T', 'Farmate', 'fumigadoras'],
  ['NS-20AS', 'Farmate NS-20AS', 'Farmate', 'fumigadoras'],
  ['15B', 'Mochila 15 Litros 15B', null, 'fumigadoras'],
  ['430', 'Guadaña 430', null, 'guadanas'],
  ['520', 'Guadaña/Ahoyadora 520', null, 'guadanas'],
  ['52CC', 'Ahoyadora 52cc', null, 'ahoyadoras'],
  ['63CC', 'Ahoyadora 63cc', null, 'ahoyadoras'],
  ['9HP', 'Motor 9HP', null, 'bombas-agua'],
  ['CG35', 'CG35 4 tiempos', null, 'guadanas'],
  ['NT4200', 'NT4200', null, 'guadanas'],
  ['NT450B', 'NT450B', null, 'guadanas'],
  ['HC-406', 'Farmate HC-406', 'Farmate', 'accesorios'],
  ['BC302', 'BC302', 'Farmate', 'fumigadoras'],
]

interface SeedProduct {
  code: string
  name: string
  price: number
  cat: string
  part: string | null
  brand: string | null
  models: string[]
  unit?: boolean
  isNew?: boolean
}

const PRODUCTS: SeedProduct[] = [
  { code: 'E55', name: 'Carburador MS660', price: 18.0, cat: 'motosierras', part: 'carburadores', brand: 'STIHL', models: ['MS660'] },
  { code: 'A01', name: 'Filtro de aire STIHL (universal)', price: 8.5, cat: 'motosierras', part: 'filtros', brand: 'STIHL', models: ['MS660', 'MS381', 'MS250'] },
  { code: 'G20', name: 'Cadena Oregon 36"', price: 32.0, cat: 'motosierras', part: 'cadenas-barras', brand: 'Oregon', models: ['MS660', 'MS381'] },
  { code: 'B25', name: 'Bujía NGK', price: 3.5, cat: 'motosierras', part: 'encendido', brand: null, models: ['MS660', 'FS280', 'GX35'] },
  { code: 'ARR-MS', name: 'Arranque completo MS381', price: 19.5, cat: 'motosierras', part: 'arranque', brand: 'STIHL', models: ['MS381', 'MS250'] },
  { code: 'P10', name: 'Pistón completo FS280', price: 24.0, cat: 'guadanas', part: 'motor-interno', brand: 'STIHL', models: ['FS280', 'FS291'] },
  { code: 'D40', name: 'Disco 40 dientes', price: 9.0, cat: 'guadanas', part: 'discos-cuchillas', brand: null, models: ['FS55', 'FS160', '430', '520'] },
  { code: 'NYL3', name: 'Nylon de corte (rollo)', price: 6.5, cat: 'guadanas', part: 'discos-cuchillas', brand: null, models: [] },
  { code: 'TF900-K', name: 'Bomba de mochila Farmate TF900 4T', price: 185.0, cat: 'fumigadoras', part: 'equipos-completos', brand: 'Farmate', models: ['TF900'], unit: true, isNew: true },
  { code: 'BQ-AZ', name: 'Boquilla azul abanico', price: 0.75, cat: 'fumigadoras', part: 'aspersion', brand: null, models: [] },
  { code: 'AGU-3', name: 'Aguilón triple', price: 14.0, cat: 'fumigadoras', part: 'aspersion', brand: null, models: ['TF800', 'TF900'] },
  { code: 'AH52', name: 'Ahoyadora 52cc completa', price: 145.0, cat: 'ahoyadoras', part: 'equipos-completos', brand: null, models: ['52CC'], unit: true, isNew: true },
  { code: 'SR420-C', name: 'Carburador soplador SR420', price: 22.0, cat: 'sopladores', part: 'carburadores', brand: 'STIHL', models: ['SR420'] },
  { code: 'GX35-U', name: 'Motor Honda GX35 4T', price: 165.0, cat: 'motores', part: 'equipos-completos', brand: 'Honda', models: ['GX35'], unit: true },
  { code: 'MO22', name: 'Capacitor de molino', price: 6.0, cat: 'molinos', part: 'encendido', brand: null, models: [] },
  { code: 'MNG12', name: 'Manguera 1/2" (metro)', price: 0.9, cat: 'accesorios', part: 'mangueras', brand: null, models: [] },
]

async function main() {
  // --- Categories ---
  const catBySlug = new Map<string, string>()
  for (let i = 0; i < CATEGORIES.length; i++) {
    const [slug, name] = CATEGORIES[i]!
    const c = await prisma.category.upsert({
      where: { slug },
      update: { name, displayOrder: i + 1, active: true },
      create: { slug, name, displayOrder: i + 1 },
    })
    catBySlug.set(slug, c.id)
  }

  // --- Part types ---
  const partBySlug = new Map<string, string>()
  for (let i = 0; i < PART_TYPES.length; i++) {
    const [slug, name] = PART_TYPES[i]!
    const p = await prisma.partType.upsert({
      where: { slug },
      update: { name, displayOrder: i + 1, active: true },
      create: { slug, name, displayOrder: i + 1 },
    })
    partBySlug.set(slug, p.id)
  }

  // --- Brands ---
  const brandByName = new Map<string, string>()
  for (const [name, aliases] of BRANDS) {
    const b = await prisma.brand.upsert({
      where: { name },
      update: { aliases, active: true },
      create: { name, aliases },
    })
    brandByName.set(name, b.id)
  }

  // --- Equipment models ---
  const modelByCode = new Map<string, string>()
  for (const [code, name, brandName, catSlug] of MODELS) {
    const m = await prisma.equipmentModel.upsert({
      where: { code },
      update: { name, brandId: brandName ? brandByName.get(brandName) ?? null : null, categoryId: catBySlug.get(catSlug)!, active: true },
      create: { code, name, brandId: brandName ? brandByName.get(brandName) ?? null : null, categoryId: catBySlug.get(catSlug)! },
    })
    modelByCode.set(code, m.id)
  }

  // --- Sample products + compatibility ---
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        price: p.price,
        categoryId: catBySlug.get(p.cat)!,
        partTypeId: p.part ? partBySlug.get(p.part) ?? null : null,
        brandId: p.brand ? brandByName.get(p.brand) ?? null : null,
        isCompleteUnit: p.unit ?? false,
        isNew: p.isNew ?? false,
        active: true,
      },
      create: {
        code: p.code,
        name: p.name,
        price: p.price,
        categoryId: catBySlug.get(p.cat)!,
        partTypeId: p.part ? partBySlug.get(p.part) ?? null : null,
        brandId: p.brand ? brandByName.get(p.brand) ?? null : null,
        isCompleteUnit: p.unit ?? false,
        isNew: p.isNew ?? false,
      },
    })
    await prisma.productModel.deleteMany({ where: { productId: product.id } })
    for (const code of p.models) {
      const modelId = modelByCode.get(code)
      if (modelId) await prisma.productModel.create({ data: { productId: product.id, modelId } })
    }
  }

  // --- Deactivate legacy demo data (old generic categories/products) ---
  const keepSlugs = CATEGORIES.map((c) => c[0])
  await prisma.category.updateMany({ where: { slug: { notIn: keepSlugs } }, data: { active: false } })
  const keepCodes = PRODUCTS.map((p) => p.code)
  await prisma.product.updateMany({ where: { code: { notIn: keepCodes } }, data: { active: false } })

  console.log(
    `✅ Seed: ${CATEGORIES.length} categorías, ${PART_TYPES.length} tipos de parte, ${BRANDS.length} marcas, ${MODELS.length} modelos, ${PRODUCTS.length} productos.`,
  )
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('❌ Error en el seed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
