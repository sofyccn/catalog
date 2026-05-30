/** Brand mark + reusable footer shared by the landing and the app shell. */

export function KyodoGear({ size = 56, theme = 'light' }: { size?: number; theme?: 'light' | 'dark' }) {
  const dark = theme === 'dark'
  const col = dark ? '#ffffff' : 'var(--green)'
  const ring = `${cogPath(50, 50, 43, 33, 10)} ${holeCCW(50, 50, 26)}`
  const showSprout = size >= 26
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <path d={ring} fill={col} fillRule="evenodd" />
      {showSprout ? (
        <g>
          <line x1="50" y1="61" x2="50" y2="43" stroke={col} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M50 49 Q41 47 39 38 Q49 39 50 49 Z" fill="var(--amber-bright)" />
          <path d="M50 46 Q59 44 61 35 Q51 37 50 46 Z" fill={dark ? 'var(--amber-bright)' : 'var(--amber)'} />
        </g>
      ) : (
        <circle cx="50" cy="50" r="9" fill={col} />
      )}
    </svg>
  )
}

function cogPath(cx: number, cy: number, rOut: number, rIn: number, teeth: number) {
  let d = ''
  for (let i = 0; i < teeth; i++) {
    const b = (i / teeth) * Math.PI * 2
    const t1 = b + (0.42 / teeth) * Math.PI * 2
    const v1 = b + (0.52 / teeth) * Math.PI * 2
    const v2 = b + (1.0 / teeth) * Math.PI * 2
    const P = (r: number, a: number) =>
      `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
    d += (i === 0 ? 'M ' : 'L ') + P(rOut, b) + ' L ' + P(rOut, t1) + ' L ' + P(rIn, v1) + ' L ' + P(rIn, v2) + ' '
  }
  return d + 'Z'
}

function holeCCW(cx: number, cy: number, r: number) {
  return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`
}

export function Lockup({
  size = 46,
  theme = 'light',
  tagline = true,
  sub = true,
}: {
  size?: number
  theme?: 'light' | 'dark'
  tagline?: boolean
  sub?: boolean
}) {
  const dark = theme === 'dark'
  return (
    <span className="kl-lockup" style={{ gap: size * 0.28 }}>
      <KyodoGear size={size} theme={theme} />
      <span className="kl-lockup__text">
        <span
          className="kl-lockup__name"
          style={{ fontSize: size * 0.62, color: dark ? '#fff' : 'var(--ink)' }}
        >
          Kyodo
        </span>
        {sub && (
          <span
            className="kl-lockup__sub"
            style={{
              fontSize: Math.max(size * 0.18, 9),
              color: dark ? 'rgba(255,255,255,0.62)' : 'var(--ink-soft)',
              marginTop: size * 0.13,
            }}
          >
            Importadora Cobo
          </span>
        )}
        {tagline && (
          <span
            className="kl-lockup__tag"
            style={{
              fontSize: Math.max(size * 0.26, 12),
              color: dark ? 'var(--amber-bright)' : 'var(--green)',
              marginTop: size * 0.16,
            }}
          >
            el amigo del agricultor
          </span>
        )}
      </span>
    </span>
  )
}

/** Deep-green footer with brand blurb + locations. Used on landing and inside the app. */
export function Footer() {
  const Loc = ({ town, prov, detail }: { town: string; prov: string; detail: string }) => (
    <div className="kl-loc">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--amber-bright)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
      <div>
        <div className="kl-loc__town">{town}</div>
        <div className="kl-loc__sub">{prov}</div>
        <div className="kl-loc__sub">{detail}</div>
      </div>
    </div>
  )
  return (
    <footer className="kl-footer">
      <div className="kl-footer__grid">
        <div className="kl-footer__brand">
          <Lockup theme="dark" size={42} tagline sub />
          <p className="kl-footer__blurb">
            Importamos y vendemos repuestos y equipos para la agricultura ecuatoriana
            desde nuestras dos bodegas.
          </p>
        </div>
        <div className="kl-footer__locs">
          <span className="kl-footer__label">Dónde estamos</span>
          <div className="kl-footer__locgrid">
            <Loc town="Tisaleo" prov="Tungurahua" detail="Lun – Sáb · 8h00 – 18h00" />
            <Loc town="Guayllabamba" prov="Pichincha" detail="Lun – Sáb · 8h00 – 18h00" />
          </div>
        </div>
      </div>
      <div className="kl-footer__bottom">
        <span>© {new Date().getFullYear()} Importadora Cobo · Catálogo Kyodo</span>
        <span>¿Cliente nuevo? Un admin aprueba tu acceso antes de empezar.</span>
      </div>
    </footer>
  )
}
