import { MapPin } from 'lucide-react'

/** Warehouse location badge. Staff-only: the API never sends the field to
 *  clients, so rendering it whenever it's present is safe. */
export function CasilleroTag({ value }: { value: string }) {
  return (
    <span
      className="tag"
      title="Casillero / ubicación en bodega"
      style={{ background: 'var(--amber-tint)', color: 'var(--amber)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
    >
      <MapPin size={11} /> Casillero {value}
    </span>
  )
}
