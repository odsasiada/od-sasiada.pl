import type { NextConfig } from 'next'

import { withPayload } from '@payloadcms/next/withPayload'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  images: {
    // Dev only: SERVER_URL is a required valid URL (env.ts `z.url().default('http://localhost:3000')`),
    // so Payload always emits ABSOLUTE localhost media urls in dev. next/image treats them as remote
    // and Next 16 blocks the loopback/private IP (::1/127.0.0.1) as an SSRF guard. Allow local IPs in
    // dev only; prod keeps the default (false) since prod urls use the public canonical domain.
    dangerouslyAllowLocalIP: isDev,
    // Vercel Blob host (S3.3 / Q3) — absolute blob URLs in production.
    // S4.6: media is served through Payload's `/api/media/file/...` route, and Payload emits it as
    // an ABSOLUTE url using SERVER_URL (prod: https://www.od-sasiada.pl/..., dev: http://localhost:3000/...).
    // next/image treats an absolute url as remote even when same-origin, so the host must be
    // allowlisted here or the optimizer rejects it. Prod media urls always use the canonical
    // domain (SERVER_URL=https://www.od-sasiada.pl), so a broad `*.vercel.app` pattern is not
    // needed and is omitted (S4.6 review). `localhost` is added only in dev (SERVER_URL points at
    // localhost there) so prod stays tight.
    remotePatterns: [
      { hostname: '*.public.blob.vercel-storage.com', protocol: 'https' },
      { hostname: 'od-sasiada.pl', protocol: 'https' },
      { hostname: 'www.od-sasiada.pl', protocol: 'https' },
      ...(isDev ? [{ hostname: 'localhost', port: '3000', protocol: 'http' as const }] : []),
    ],
  },
}

export default withPayload(nextConfig)
