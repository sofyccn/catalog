/**
 * Upload photos cropped from the printed catalog to products that have none.
 *
 * Input is a JSON list of { productId, file } (built and reviewed beforehand).
 * Each photo goes through the same pipeline as the admin upload (border trim,
 * thumb/medium/full WebP, Cloudflare R2). Products that already have a photo
 * are skipped, so Fernando's uploads are never replaced.
 *
 *   pnpm --filter api exec tsx scripts/import-catalog-photos.ts <mapping.json> <photosDir>           # dry run
 *   pnpm --filter api exec tsx scripts/import-catalog-photos.ts <mapping.json> <photosDir> --apply   # upload
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '../src/lib/prisma.js'
import { r2Configured } from '../src/lib/r2.js'
import { storeImage } from '../src/controllers/images.controller.js'

const [mappingFile, photosDir] = process.argv.slice(2)
const apply = process.argv.includes('--apply')

async function main() {
  if (!mappingFile || !photosDir) throw new Error('Usage: import-catalog-photos.ts <mapping.json> <photosDir> [--apply]')
  if (apply && !r2Configured()) throw new Error('R2 is not configured in apps/api/.env; cannot upload.')
  const mapping: { productId: string; file: string }[] = JSON.parse(readFileSync(mappingFile, 'utf8'))

  let uploaded = 0, skipped = 0, failed = 0
  for (const { productId, file } of mapping) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { code: true, name: true, _count: { select: { images: true } } },
    })
    if (!product) { console.log(`MISSING  ${productId}`); skipped++; continue }
    if (product._count.images > 0) { console.log(`SKIP     ${product.code} already has a photo`); skipped++; continue }
    if (!apply) { console.log(`WOULD    ${product.code.padEnd(16)} ${product.name}  <- ${file}`); continue }
    try {
      await storeImage(productId, readFileSync(join(photosDir, file)), 0)
      console.log(`UPLOADED ${product.code.padEnd(16)} ${product.name}`)
      uploaded++
    } catch (err) {
      console.log(`FAILED   ${product.code}: ${(err as Error).message}`)
      failed++
    }
  }
  console.log(apply ? { uploaded, skipped, failed } : { wouldUpload: mapping.length - skipped, skipped })
}
main().finally(() => prisma.$disconnect())
