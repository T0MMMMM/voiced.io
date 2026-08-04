import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Space_Grotesk, Space_Mono } from 'next/font/google'
import { THEME_INIT_SCRIPT } from '@/lib/theme'
import { Header } from '@/components/layout/Header'
import { LangProvider } from '@/lib/i18n'
import { LOCALE_STORAGE_KEY, resolveLocale } from '@/lib/i18n/locales'
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

/**
 * La langue est lue au rendu serveur, dans le cookie.
 *
 * C'est ce qui rend la premiere image deja traduite : la resoudre cote
 * client aurait affiche un ecran francais puis l'aurait remplace.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const store = await cookies()
  const locale = resolveLocale(store.get(LOCALE_STORAGE_KEY)?.value)

  return (
    <html lang={locale} data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${spaceMono.variable} font-sans`}
      >
        <LangProvider locale={locale}>
          <Header />
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
