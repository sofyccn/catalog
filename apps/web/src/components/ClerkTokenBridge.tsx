import { useEffect } from 'react'
import { useAuth } from '@clerk/react'
import { setTokenGetter } from '../lib/api'

/** Feeds the Clerk session token into the axios instance. Render inside ClerkProvider. */
export function ClerkTokenBridge() {
  const { getToken } = useAuth()
  useEffect(() => {
    setTokenGetter(() => getToken())
    return () => setTokenGetter(null)
  }, [getToken])
  return null
}
