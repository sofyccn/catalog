/** "Pedido 12": the human order number (falls back while an older API is still deployed). */
export function orderLabel(order: { number?: number }): string {
  return order.number ? `Pedido ${order.number}` : 'Pedido'
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
