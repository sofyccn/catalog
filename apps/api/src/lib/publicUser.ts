import type { User } from '../generated/prisma/client.js'

/** The user shape safe to return to clients (no internal-only fields). */
export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    active: user.active,
    phone: user.phone,
    city: user.city,
    company: user.company,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt,
  }
}
