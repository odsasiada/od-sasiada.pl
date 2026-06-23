import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  client: {},

  runtimeEnv: {
    APP_URL: process.env.APP_URL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    EMAIL_FROM: process.env.EMAIL_FROM,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_SKIP_VERIFY: process.env.EMAIL_SKIP_VERIFY,
    EMAIL_SMTP_HOST: process.env.EMAIL_SMTP_HOST,
    EMAIL_SMTP_PASSWORD: process.env.EMAIL_SMTP_PASSWORD,
    EMAIL_SMTP_PORT: process.env.EMAIL_SMTP_PORT,
    EMAIL_SMTP_USER: process.env.EMAIL_SMTP_USER,
    EMAIL_TLS_REJECT_UNAUTHORIZED: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED,
    PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
    SERVER_URL: process.env.SERVER_URL,
  },

  server: {
    APP_URL: z.url().default('http://localhost:3000'),
    // EPIC-3 (SPIKE-S3): Vercel Blob token, provisioned via Vercel Marketplace.
    // Optional — when absent, Media falls back to local-disk storage (dev), so the
    // app boots without it. Required only once the vercelBlobStorage adapter is wired.
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    DATABASE_URL: z.url({ protocol: /^postgres/ }),
    EMAIL_FROM: z.email(),
    EMAIL_FROM_NAME: z.string().min(1),
    EMAIL_SECURE: z.stringbool().default(false),
    EMAIL_SKIP_VERIFY: z.stringbool().default(false),
    EMAIL_SMTP_HOST: z.string().min(1),
    EMAIL_SMTP_PASSWORD: z.string().min(1),
    EMAIL_SMTP_PORT: z.coerce.number().min(1).max(65535),
    EMAIL_SMTP_USER: z.email(),
    EMAIL_TLS_REJECT_UNAUTHORIZED: z.stringbool().default(true),
    PAYLOAD_SECRET: z.string().min(32),
    SERVER_URL: z.url().default('http://localhost:3000'),
  },
})
