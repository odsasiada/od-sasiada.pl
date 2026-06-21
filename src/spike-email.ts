import { writeFileSync } from 'node:fs'

import { getPayload } from 'payload'

import { env } from '@/env'
import config from '@/payload.config'

/**
 * SMTP test: sends one email to the EMAIL_FROM address (no spamming others).
 * Run: `pnpm payload run src/spike-email.ts`.
 */
const run = async () => {
  const payload = await getPayload({ config })
  await payload.sendEmail({
    html: '<p>This is a test email from the <strong>od sąsiada</strong> app. SMTP works ✅</p>',
    subject: 'SMTP test — od sąsiada',
    to: env.EMAIL_FROM,
  })
  writeFileSync('/tmp/spike-email.txt', `EMAIL OK → sent to ${env.EMAIL_FROM}\n`)
}

try {
  await run()
  process.exit(0)
} catch (err) {
  writeFileSync('/tmp/spike-email.txt', `EMAIL FAILED:\n${(err as Error)?.stack ?? String(err)}\n`)
  process.exit(1)
}
