'use client'

import { createContext, useContext } from 'react'
import { dictionaryFor, type Dictionary } from './dictionaries'
import { fr } from './fr'
import type { Locale } from './locales'

export type { Dictionary }

/**
 * La langue descend par le contexte plutôt que par les props.
 *
 * Le serveur lit le cookie et pose la valeur une fois ; tout l'arbre y
 * accède ensuite sans qu'aucun composant intermédiaire ait à la faire
 * suivre. La faire passer de props en props aurait touché chaque fichier
 * de l'application pour une valeur qui ne change jamais en cours de page.
 */
const LangContext = createContext<{ locale: Locale; t: Dictionary }>({
  locale: 'fr',
  t: fr,
})

export function LangProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  return (
    <LangContext.Provider value={{ locale, t: dictionaryFor(locale) }}>
      {children}
    </LangContext.Provider>
  )
}

/** Le dictionnaire courant. `const t = useT()` puis `t.room.start`. */
export function useT(): Dictionary {
  return useContext(LangContext).t
}

export function useLocale(): Locale {
  return useContext(LangContext).locale
}
