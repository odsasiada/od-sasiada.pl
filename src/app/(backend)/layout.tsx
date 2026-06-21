import config from '@/payload.config'

import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import type React from 'react'

import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { Suspense } from 'react'

import { importMap } from '@/importMap'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'

  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <Suspense>
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  </Suspense>
)

export default Layout
