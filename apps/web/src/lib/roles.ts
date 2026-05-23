import type { Role } from '../types/auth'

/** Landing route for each role after login. */
export const roleHome: Record<Role, string> = {
  ADMIN: '/admin',
  DISPATCHER: '/despacho',
  CLIENT: '/catalogo',
}

export const roleLabel: Record<Role, string> = {
  ADMIN: 'Administrador',
  DISPATCHER: 'Despachador',
  CLIENT: 'Cliente',
}
