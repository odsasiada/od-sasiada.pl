import type { NextConfig } from 'next'

import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob host (S3.3 / Q3) — absolute blob URLs in production. Local dev serves media as
    // same-origin URLs (/api/media/...) which need no pattern.
    remotePatterns: [{ hostname: '*.public.blob.vercel-storage.com', protocol: 'https' }],
  },
}

export default withPayload(nextConfig)
