import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartLine {
  productId: string
  code: string
  name: string
  quantity: number
  image?: string
}

interface CartState {
  lines: CartLine[]
  add: (line: Omit<CartLine, 'quantity'> & { quantity?: number }) => void
  setQty: (productId: string, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const inc = line.quantity ?? 1
          const existing = s.lines.find((l) => l.productId === line.productId)
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.productId === line.productId ? { ...l, quantity: l.quantity + inc } : l,
              ),
            }
          }
          return { lines: [...s.lines, { ...line, quantity: inc }] }
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          lines:
            qty <= 0
              ? s.lines.filter((l) => l.productId !== productId)
              : s.lines.map((l) => (l.productId === productId ? { ...l, quantity: qty } : l)),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'catalog-cart' },
  ),
)

export const cartCount = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.quantity, 0)
