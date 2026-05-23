import bcrypt from 'bcrypt'
import { prisma } from '../src/lib/prisma.js'
import { Role } from '../src/generated/prisma/enums.js'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents (é, í, ñ -> e, i, n)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // --- Users: 1 admin, 1 dispatcher, 2 clients ---
  const users = [
    { email: 'admin@catalogo.ec', fullName: 'Administrador', role: Role.ADMIN },
    { email: 'despacho@catalogo.ec', fullName: 'Despachador', role: Role.DISPATCHER },
    { email: 'cliente1@catalogo.ec', fullName: 'Cliente Uno', role: Role.CLIENT },
    { email: 'cliente2@catalogo.ec', fullName: 'Cliente Dos', role: Role.CLIENT },
  ] as const

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, role: u.role },
      create: { email: u.email, fullName: u.fullName, role: u.role, passwordHash },
    })
  }

  // --- Categories: 5 ---
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

  // --- Products: 20, spread across categories ---
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

  console.log(
    `✅ Seed completado: ${users.length} usuarios, ${categories.length} categorías, 20 productos.`,
  )
  console.log('   Credenciales: admin@catalogo.ec / password123 (igual para todos los usuarios).')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error('❌ Error en el seed:', error)
    await prisma.$disconnect()
    process.exit(1)
  })
