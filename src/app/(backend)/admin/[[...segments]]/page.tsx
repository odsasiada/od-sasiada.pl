import type { Metadata } from 'next'

import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
import { Suspense } from 'react'

import { importMap } from '@/importMap'
import config from '@/payload.config'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) => (
  <Suspense>
    <RootPage config={config} importMap={importMap} params={params} searchParams={searchParams} />
  </Suspense>
)

export default Page
