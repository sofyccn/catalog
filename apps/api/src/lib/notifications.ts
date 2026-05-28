import { env } from '../config/env.js'
import { prisma } from './prisma.js'
import { sendEmail } from './email.js'

const appUrl = () => (env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

function layout(title: string, body: string, cta: { label: string; href: string }): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1c1a">
    <div style="font-weight:700;color:#1f5132;font-size:18px">Importadora Cobo</div>
    <h2 style="margin:16px 0 8px">${title}</h2>
    <p style="line-height:1.55;color:#525452">${body}</p>
    <p style="margin-top:20px"><a href="${cta.href}" style="display:inline-block;background:#1f5132;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">${cta.label}</a></p>
  </div>`
}

/** Client sent a pedido → notify dispatchers/admins. Never throws. */
export async function notifyNewOrder(requestId: string): Promise<void> {
  try {
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: { client: true, _count: { select: { items: true } } },
    })
    if (!request) return
    const workers = await prisma.user.findMany({
      where: { status: 'ACTIVE', active: true, role: { in: ['DISPATCHER', 'ADMIN'] } },
      select: { email: true },
    })
    const to = workers.map((w) => w.email).filter(Boolean)
    if (to.length === 0) return
    const subject = `Nuevo pedido de ${request.client.fullName}`
    const html = layout(
      'Nuevo pedido recibido',
      `${request.client.fullName} envió un pedido con ${request._count.items} producto(s). Revisa la disponibilidad y responde.`,
      { label: 'Ver pedidos', href: `${appUrl()}/despacho` },
    )
    // Send per-recipient so one blocked/invalid address doesn't drop the rest
    // (and the owner still receives while Resend is in test mode).
    for (const email of to) await sendEmail({ to: email, subject, html })
  } catch (err) {
    console.error('[notify] notifyNewOrder:', err)
  }
}

/** Dispatcher completed review → notify the client. Never throws. */
export async function notifyProformaReady(requestId: string): Promise<void> {
  try {
    const request = await prisma.request.findUnique({ where: { id: requestId }, include: { client: true } })
    if (!request) return
    await sendEmail({
      to: request.client.email,
      subject: 'Tu pedido fue revisado',
      html: layout(
        'Disponibilidad confirmada',
        'El despachador revisó tu pedido. Entra para ver qué está disponible y decidir si aceptas, rechazas o cancelas.',
        { label: 'Ver mi pedido', href: `${appUrl()}/pedido` },
      ),
    })
  } catch (err) {
    console.error('[notify] notifyProformaReady:', err)
  }
}
