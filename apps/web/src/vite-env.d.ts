/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  /** Absolute URL of the backend in production (e.g. https://api-cobo.up.railway.app). Dev leaves it unset and uses the Vite proxy. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
