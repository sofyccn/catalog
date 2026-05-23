export type Role = 'CLIENT' | 'DISPATCHER' | 'ADMIN'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  active: boolean
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}
