import type { User } from '../generated/prisma/client.js'

declare global {
  namespace Express {
    interface Request {
      /** Local DB user, provisioned/loaded from the Clerk session by attachUser. */
      localUser?: User
    }
  }
}

export {}
