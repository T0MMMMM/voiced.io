import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { Header } from '@/components/layout/Header'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'voiced.io',
  description: 'Doublez une scène d’anime à deux, en direct, depuis votre navigateur.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
