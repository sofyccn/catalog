/** Wordmark for the catalog header — Newsreader serif, deep green. */
export function KyodoLogo({ size = 42, tagline = false }: { size?: number; tagline?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: Math.round(size * 0.52),
          color: 'var(--green)',
          letterSpacing: '-0.02em',
        }}
      >
        Kyodo
      </span>
      {tagline && (
        <span className="label" style={{ fontSize: 9, marginTop: 3 }}>
          Importadora Cobo
        </span>
      )}
    </span>
  )
}
