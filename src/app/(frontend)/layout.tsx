import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google'

import './globals.css'

// Display — characterful headings. Body — clean, legible UI/body. latin-ext = poprawne PL znaki.
const display = Bricolage_Grotesque({
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
})

const body = Hanken_Grotesk({
  display: 'swap',
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  description: 'Świeże warzywa, owoce, kiszonki i miód prosto od lokalnych dostawców.',
  title: 'od sąsiada',
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${display.variable} ${body.variable}`} lang='pl'>
      <body>{children}</body>
    </html>
  )
}
