import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'

export const metadata: Metadata = {
  description: 'Fresh vegetables, fruits, pickles and honey straight from local suppliers.',
  title: 'od sąsiada',
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='pl'>
      <body>{children}</body>
    </html>
  )
}
