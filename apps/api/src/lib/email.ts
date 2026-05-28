import { env } from '../config/env.js'

export function emailConfigured(): boolean {
  return !!env.RESEND_API_KEY
}

const from = () => env.EMAIL_FROM ?? 'Catálogo Cobo <onboarding@resend.dev>'

/**
 * Send a transactional email via Resend's HTTP API (no SDK needed).
 * Never throws — if unconfigured or it fails, it logs and returns, so callers
 * (order transitions) are never blocked or broken by email.
 */
export async function sendEmail(opts: { to: string | string[]; subject: string; html: string }): Promise<void> {
  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to]
  if (!emailConfigured()) {
    console.log(`[email] (sin configurar) → ${recipients.join(', ')} · ${opts.subject}`)
    return
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: from(), to: recipients, subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) {
      console.error(`[email] error ${res.status}: ${(await res.text()).slice(0, 300)}`)
    }
  } catch (err) {
    console.error('[email] fallo de red:', err)
  }
}
