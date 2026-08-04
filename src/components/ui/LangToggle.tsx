'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useLocale, useT } from '@/lib/i18n'
import { applyLocale, LOCALE_CHOICES } from '@/lib/i18n/locales'
import { IconButton } from './IconButton'

/** La durée de l'animation, partagée avec la feuille de style. */
const SWAP_MS = 260

const labelOf = (locale: string) =>
  LOCALE_CHOICES.find((choice) => choice.value === locale)?.label ?? 'FR'

/**
 * Le choix de langue, à côté du bouton de thème.
 *
 * Un seul mot à l'écran, celui de la langue en cours. Deux segments côte à
 * côte demandaient de lire les deux pour comprendre lequel était actif ;
 * ici on lit ce qu'on a, et cliquer donne l'autre.
 *
 * L'ancienne langue sort par le bas et la nouvelle entre par le haut. Ce
 * n'est pas une décoration : le mouvement dit qu'on a changé de valeur sur
 * une même position, là où une substitution brutale ressemblerait à un
 * défaut d'affichage.
 *
 * La page n'est pas rechargée. `router.refresh()` va rechercher les parties
 * rendues par le serveur pendant que le contexte met à jour les autres :
 * un rechargement complet aurait effacé l'animation qu'on vient de lancer.
 */
export function LangToggle() {
  const router = useRouter()
  const t = useT()
  const current = useLocale()

  /**
   * Le mot affiche, qui prend les devants.
   *
   * Le rafraichissement serveur met un instant a revenir ; attendre qu'il
   * arrive pour lancer l'animation l'aurait declenchee trop tard, une fois
   * le mouvement deja termine.
   */
  const [shown, setShown] = useState(current)
  const [leaving, setLeaving] = useState<string | null>(null)

  useEffect(() => setShown(current), [current])

  const other = LOCALE_CHOICES.find((choice) => choice.value !== shown)

  function swap() {
    if (!other || leaving) return

    setLeaving(labelOf(shown))
    setShown(other.value)
    applyLocale(other.value)
    router.refresh()
    window.setTimeout(() => setLeaving(null), SWAP_MS)
  }

  return (
    <IconButton
      label={t.common.lang}
      size="sm"
      onClick={swap}
      className="text-[13px] font-medium"
    >
      {/* La fenêtre coupe ce qui dépasse : c'est elle qui fait le
          glissement, les deux mots ne font que la traverser. */}
      <span className="relative block h-4 w-[1.6rem] overflow-hidden">
        {leaving && (
          <span className="lang-leave absolute inset-0 flex items-center justify-center">
            {leaving}
          </span>
        )}
        <span
          key={shown}
          className="lang-enter absolute inset-0 flex items-center justify-center"
        >
          {labelOf(shown)}
        </span>
      </span>
    </IconButton>
  )
}
