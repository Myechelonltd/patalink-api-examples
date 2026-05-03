/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PATALINK_BASE_URL: string
  readonly VITE_PATALINK_API_KEY: string
  readonly VITE_PATALINK_ENCRYPTION_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
