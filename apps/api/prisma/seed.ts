import { prisma } from '../src/lib/prisma.js'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents (é, í, ñ -> e, i, n)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  // Users now come from Clerk (self-signup + admin approval), so we only seed
  // catalog data. The first ADMIN is bootstrapped via BOOTSTRAP_ADMIN_EMAIL.

  const categoryNames = ['Herramientas', 'Plomería', 'Eléctrico', 'Pinturas', 'Ferretería']
  const categories = []
  for (const name of categoryNames) {
    const slug = slugify(name)
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    })
    categories.push(category)
  }

  for (let i = 1; i <= 20; i++) {
    const category = categories[i % categories.length]!
    const code = `P${String(i).padStart(4, '0')}`
    await prisma.product.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: `Producto ${i}`,
        description: `Descripción de ejemplo para el producto ${i}.`,
        categoryId: category.id,
      },
    })
  }

  console.log(`✅ Seed completado: ${categories.length} categorías, 20 productos.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('❌ Error en el seed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
