import type { Metadata } from 'next'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { Header } from '@/components/layout/Header'
import './globals.css'

/**
 * Space Grotesk porte tout le texte : ses formes géométriques un peu
 * bancales lui donnent une voix, ce qui convient à un produit sur la voix.
 * Space Mono est sa sœur du même dessinateur : l'appairage est délibéré,
 * elle ne sert qu'aux timecodes, aux compteurs et aux libellés de piste.
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-grotesk',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'voiced.io',
  description:
    'Doublez une scène d’anime à deux, en direct, depuis votre navigateur.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} font-sans`}
      >
        <Header />
        {children}
      </body>
    </html>
  )
}
