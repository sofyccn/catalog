import type { ReactNode } from 'react'
import { Footer, Lockup } from './parts'

type Mode = 'signin' | 'signup'

/** Split layout: deep-green hero (left) with brand + pitch, Clerk form (right).
 *  Stacks to single column on mobile. Below the split, a "How it works"
 *  section and a footer with locations. */
export function LandingShell({ mode, children }: { mode: Mode; children: ReactNode }) {
  const isSignIn = mode === 'signin'
  return (
    <div className="kl-page">
      <div className="kl-split">
        <section className="kl-hero">
          <FieldSceneBg />
          <div className="kl-hero__inner">
            <Lockup theme="dark" size={42} tagline sub />
            <div className="kl-hero__content">
              <Kicker onDark>El amigo del agricultor</Kicker>
              <h1 className="kl-display">
                Todo lo que tu finca necesita,<br />
                en un solo <em>catálogo</em>.
              </h1>
              <p className="kl-hero__sub">
                Motosierras, guadañas, fumigadoras, bombas, motores Honda y repuestos —
                de las marcas que sí aguantan. Arma tu pedido en línea; nosotros
                confirmamos el stock y el precio.
              </p>
            </div>
            <div className="kl-hero__brands">
              <BrandsStrip onDark />
            </div>
          </div>
        </section>

        <section className="kl-auth" id="auth">
          <div className="kl-auth__inner">
            <div className="kl-auth__clerk">{children}</div>
            <ApprovalNote signupHint={!isSignIn} />
          </div>
        </section>
      </div>

      <section className="kl-how">
        <div className="kl-section-head">
          <Kicker>Cómo funciona</Kicker>
          <h2 className="kl-h2">
            Pedir es <em>así de simple</em>
          </h2>
          <p className="kl-section-sub">
            No es una tienda en línea. Es el catálogo de Cobo donde armas tu pedido
            y nosotros lo confirmamos contigo.
          </p>
        </div>
        <HowItWorks />
      </section>

      <Footer />
    </div>
  )
}

// ---------- Local pieces ----------

function Kicker({ children, onDark = false }: { children: ReactNode; onDark?: boolean }) {
  return (
    <span className={`kl-kicker ${onDark ? 'kl-kicker--dark' : ''}`}>
      <span className="kl-kicker__rule" />
      {children}
    </span>
  )
}

function BrandsStrip({ onDark = false }: { onDark?: boolean }) {
  const items = ['STIHL', 'Husqvarna', 'Farmate', 'Honda', 'Jacto']
  return (
    <div className={`kl-brands ${onDark ? 'kl-brands--dark' : ''}`}>
      <span className="kl-brands__label">Marcas oficiales</span>
      {items.map((b) => (
        <span key={b} className="kl-brands__name">{b}</span>
      ))}
    </div>
  )
}

const STEPS = [
  {
    n: '01',
    t: 'Busca y arma tu pedido',
    d: 'Entra al catálogo completo, encuentra lo que tu finca necesita y arma tu lista. Sin pagar nada todavía.',
    icon: (
      <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </g>
    ),
  },
  {
    n: '02',
    t: 'Confirmamos disponibilidad',
    d: 'El despachador revisa el stock real en bodega y te devuelve una proforma con lo que hay y su precio.',
    icon: (
      <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4h6a2 2 0 0 1 2 2v0H7v0a2 2 0 0 1 2-2z" />
        <path d="M7 6H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" />
        <path d="M8.5 14l2.5 2.5 5-5" />
      </g>
    ),
  },
  {
    n: '03',
    t: 'Aceptas y coordinas el retiro',
    d: 'Tú decides. Aceptas la disponibilidad y coordinas el retiro en Tisaleo o Guayllabamba, o el envío.',
    icon: (
      <g stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h11v8H3z" />
        <path d="M14 10h4l3 3v2h-7z" />
        <circle cx="7" cy="18" r="1.8" />
        <circle cx="17" cy="18" r="1.8" />
      </g>
    ),
  },
]

function HowItWorks() {
  return (
    <div className="kl-steps">
      {STEPS.map((s) => (
        <div key={s.n} className="kl-step">
          <div className="kl-step__icon">
            <svg width="26" height="26" viewBox="0 0 24 24">{s.icon}</svg>
          </div>
          <div className="kl-step__body">
            <div className="kl-step__head">
              <span className="kl-step__n">{s.n}</span>
              <h3 className="kl-step__t">{s.t}</h3>
            </div>
            <p className="kl-step__d">{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ApprovalNote({ signupHint = false }: { signupHint?: boolean }) {
  return (
    <div className="kl-approval">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <p>
        <strong>¿Cliente nuevo?</strong>{' '}
        {signupHint
          ? 'Después de crear tu cuenta, un administrador revisa y aprueba tu acceso antes de empezar a pedir. Toma menos de un día.'
          : 'Si es tu primera vez, regístrate. Un administrador aprueba tu acceso antes de que empieces a pedir.'}
      </p>
    </div>
  )
}

function FieldSceneBg() {
  return (
    <div className="kl-hero__scene" aria-hidden="true">
      <div className="kl-hero__sun" />
      <div className="kl-hero__rows" />
      <div className="kl-hero__horizon" />
    </div>
  )
}
