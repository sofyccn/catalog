import { Package } from 'lucide-react'

/** Product image, or a tinted illustration fallback when there's no image yet. */
export function ProductThumb({ src, alt, fit = 'cover' }: { src?: string; alt: string; fit?: 'cover' | 'contain' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }}
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
        background: 'var(--bg-tint)',
      }}
    >
      <Package size="30%" color="var(--ink-faint)" strokeWidth={1.4} style={{ opacity: 0.6 }} />
    </div>
  )
}
