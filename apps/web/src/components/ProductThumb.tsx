import { Package } from 'lucide-react'

/** Product image, or a tinted illustration fallback when there's no image yet. */
export function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    )
  }
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, var(--green-tint), var(--amber-tint))',
      }}
    >
      <Package size="34%" color="var(--green)" strokeWidth={1.4} style={{ opacity: 0.5 }} />
    </div>
  )
}
