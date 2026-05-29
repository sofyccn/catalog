export type Role = 'CLIENT' | 'DISPATCHER' | 'ADMIN'
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED'

/** The local account record returned by GET /auth/me. */
export interface Me {
  id: string
  email: string
  fullName: string
  role: Role | null
  status: UserStatus
  active: boolean
  phone: string | null
  city: string | null
  company: string | null
  photoUrl: string | null
  createdAt: string
}
