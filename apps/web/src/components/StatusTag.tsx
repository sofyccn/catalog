const STATUS_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  DRAFT: { label: 'Borrador', bg: 'var(--bg-tint)', color: 'var(--ink-faint)' },
  SENT: { label: 'Nuevo', bg: 'var(--blue-tint)', color: 'var(--blue)' },
  IN_REVIEW: { label: 'En revisión', bg: 'var(--amber-tint)', color: 'var(--amber)' },
  REVIEWED: { label: 'Proforma enviada', bg: 'var(--amber-tint)', color: 'var(--amber)' },
  APPROVED: { label: 'Aprobado', bg: 'var(--ok-tint)', color: 'var(--ok)' },
  REJECTED: { label: 'Rechazado', bg: 'var(--red-tint)', color: 'var(--red)' },
  CANCELLED: { label: 'Cancelado', bg: 'var(--bg-tint)', color: 'var(--ink-faint)' },
}

export function StatusTag({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.DRAFT!
  return (
    <span className="tag" style={{ background: m.bg, color: m.color, width: 'fit-content' }}>
      {m.label}
    </span>
  )
}
