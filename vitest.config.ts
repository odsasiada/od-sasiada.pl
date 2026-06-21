import { fileURLToPath } from 'node:url'

import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// Vitest config for unit + Payload-integration tests.
// - tsconfigPaths resolves the `@/` alias from tsconfig.json.
// - setup loads `.env.local` into process.env (Payload config reads env at import time).
// - integration tests need a real Postgres + a single shared Payload instance, so they
//   run single-threaded (no parallel pools) and with a generous timeout.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    // One Payload instance, one DB — never run integration suites in parallel
    // (Vitest 4: single-fork via top-level pool options).
    fileParallelism: false,
    globals: true,
    hookTimeout: 60_000,
    pool: 'forks',
    setupFiles: [fileURLToPath(new URL('./tests/setup/load-env.ts', import.meta.url))],
    testTimeout: 60_000,
  },
})
