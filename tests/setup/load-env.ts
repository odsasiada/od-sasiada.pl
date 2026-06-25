// Loads `.env.local` into process.env before any test module is imported.
// The Payload config (and `@/env`) read these at import time, so this MUST run
// in setupFiles, which Vitest evaluates before the test files.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { config as loadDotenv } from 'dotenv'

const envLocal = fileURLToPath(new URL('../../.env.local', import.meta.url))
const envDefault = fileURLToPath(new URL('../../.env', import.meta.url))

if (existsSync(envLocal)) {
  loadDotenv({ path: envLocal })
}
if (existsSync(envDefault)) {
  loadDotenv({ path: envDefault })
}

// Integration tests must NEVER touch the production Vercel Blob store. Dropping the token here
// (before payload.config / @/env are imported) makes the storage adapter fall back to local-disk
// (payload.config.ts), so test uploads stay local and the real blob store stays clean.
delete process.env.BLOB_READ_WRITE_TOKEN
