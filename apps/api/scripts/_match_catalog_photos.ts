/** DRY RUN (temporary): match extracted catalog cells to products. Reads only. */
import { readFileSync, writeFileSync } from 'node:fs'
import { prisma } from '../src/lib/prisma.js'

type Cell = { page: number; cell: number; side: string; title: string; price: string; photo: string | null; size: string | null }
const [cellsFile, outFile] = process.argv.slice(2) as [string, string]
const cells: Cell[] = JSON.parse(readFileSync(cellsFile, 'utf8'))

const ALIASES: [RegExp, string][] = [
  [/\b(STHIL|SITHIL|STIL|STILH|STHL)\b/g, 'STIHL'],
  [/\b(HUSBARNA|HUSQVARNA|HUSQ|HUSV|HUS|HUSVARNA|HUSQUARNA)\b/g, 'HUSQ'],
  [/\bGUADANA\b/g, 'GUADANA'],
  [/\bRIN\b/g, 'RING'],
  [/\bBONBIN\b/g, 'BOMBIN'],
  [/\bMOTO ?SIERRA\b/g, 'MOTOSIERRA'],
]
const STOP = new Set(['DE', 'DEL', 'LA', 'EL', 'PARA', 'CON', 'Y', 'O', 'A', 'EN'])

function tokens(s: string): string[] {
  let t = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  t = t.replace(/[^A-Z0-9]+/g, ' ')
  for (const [re, to] of ALIASES) t = t.replace(re, to)
  return t.split(' ').filter((w) => w && !STOP.has(w))
}
const nums = (ts: string[]) => ts.filter((w) => /\d/.test(w))

/** "$4,50" / OCR "94,50" -> 4.5 (the leading $ is often read as 9). */
function parsePrice(p: string): number | null {
  let s = p.replace(/\s/g, '')
  if (s.startsWith('$')) s = s.slice(1)
  else if (s.startsWith('9') && s.length > 1) s = s.slice(1)
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, code: true, name: true, price: true, active: true, _count: { select: { images: true } } },
  })
  const prepared = products.map((p) => {
    const ts = tokens(p.name)
    return { ...p, price: Number(p.price), ts: new Set(ts), nums: new Set(nums(ts)), codeTs: tokens(p.code) }
  })

  // Catalog titles often start with the product code ("G13 REPUESTO CAMPANA…").
  const byCode = new Map(prepared.map((p) => [p.code.toUpperCase(), p]))

  const rows = []
  for (const c of cells) {
    if (!c.photo) continue
    const ts = tokens(c.title)
    if (ts.length < 2) { rows.push({ ...c, status: 'unreadable' }); continue }
    const cn = nums(ts)
    const price = parsePrice(c.price)
    // 1) Code match: a title word equal to a product code, confirmed by a shared
    //    name word or the price, is the most reliable signal there is.
    const rawWords = c.title.toUpperCase().split(/\s+/).map((w) => w.replace(/[^A-Z0-9.*\-/]/g, '')).filter(Boolean)
    // Only code-like words count (codes such as "CAJA" or "GENERADOR" are plain words).
    const codeHit = rawWords.filter((w) => /\d/.test(w)).map((w) => byCode.get(w)).find((p) => {
      if (!p) return false
      const shared = ts.filter((w) => p.ts.has(w) && !/^\d+$/.test(w)).length
      return shared >= 1
    })
    if (codeHit) {
      rows.push({
        ...c, priceParsed: price, status: 'match', via: 'code',
        best: { id: codeHit.id, code: codeHit.code, name: codeHit.name, price: codeHit.price, images: codeHit._count.images, active: codeHit.active, score: 2, priceMatch: price !== null && Math.abs(codeHit.price - price) < 0.01 },
      })
      continue
    }
    // The catalog often prefixes its own item number ("1014 SWITCH ROBIN", "M32 MOTOR…").
    // Score the title as-is and without that leading token, and keep the better one.
    const variants = [ts]
    if (ts.length >= 3 && /\d/.test(ts[0]!) && ts[0]!.length <= 8) variants.push(ts.slice(1))
    const scoreWith = (words: string[]) => {
      const wn = nums(words)
      return prepared.map((p) => {
        const numOk = wn.every((n) => p.nums.has(n) || p.codeTs.includes(n))
        const inter = words.filter((w) => p.ts.has(w)).length
        const union = new Set([...words, ...p.ts]).size
        let score = numOk ? inter / union : 0
        const priceMatch = price !== null && Math.abs(p.price - price) < 0.01
        if (score > 0 && priceMatch) score += 0.15
        return { p, score, priceMatch }
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score)
    }
    const scored = variants.map(scoreWith).sort((a, b) => (b[0]?.score ?? 0) - (a[0]?.score ?? 0))[0]!
    const [best, second] = scored
    const margin = best ? best.score - (second?.score ?? 0) : 0
    // Confident: clearly the best name match, or a decent name match confirmed by
    // the exact price where no runner-up shares that price.
    const priceConfirmed = !!best && best.priceMatch && best.score >= 0.5 && !(second?.priceMatch && second.score >= best.score - 0.1)
    const confident = !!best && ((best.score >= 0.6 && margin >= 0.15) || priceConfirmed)
    rows.push({
      ...c,
      priceParsed: price,
      status: !best ? 'no-match' : confident ? 'match' : 'review',
      best: best && { id: best.p.id, code: best.p.code, name: best.p.name, price: best.p.price, images: best.p._count.images, active: best.p.active, score: +best.score.toFixed(2), priceMatch: best.priceMatch },
      second: second && { code: second.p.code, name: second.p.name, score: +second.score.toFixed(2) },
    })
  }

  // A product can only take one photo from the catalog: keep its highest-scoring confident cell.
  const byProduct = new Map<string, any>()
  for (const r of rows as any[]) {
    if (r.status !== 'match') continue
    const prev = byProduct.get(r.best.id)
    if (!prev || r.best.score > prev.best.score) { if (prev) prev.status = 'duplicate'; byProduct.set(r.best.id, r) }
    else r.status = 'duplicate'
  }
  for (const r of rows as any[]) if (r.status === 'match' && r.best.images > 0) r.status = 'has-photo'
  // Crops that are mostly blank/text, or from full-width boxes (irregular layout), need a human look.
  const qualityFile = process.argv[4]
  if (qualityFile) {
    const q: Record<string, { ink: number; mid: number }> = JSON.parse(readFileSync(qualityFile, 'utf8'))
    for (const r of rows as any[]) {
      if (r.status !== 'match') continue
      const m = q[r.photo]
      if (r.side === 'C' || !m || m.mid < 0.12 || m.ink < 0.2) { r.status = 'review'; r.reason = 'crop' }
    }
  }

  writeFileSync(outFile, JSON.stringify(rows, null, 1))
  const count = (s: string) => rows.filter((r: any) => r.status === s).length
  console.log({
    cellsWithPhoto: rows.length,
    willUpload: count('match'),
    alreadyHavePhoto: count('has-photo'),
    review: count('review'),
    noMatch: count('no-match'),
    duplicate: count('duplicate'),
    unreadable: count('unreadable'),
  })
}
main().finally(() => prisma.$disconnect())
