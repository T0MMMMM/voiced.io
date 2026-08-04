'use client'

import { useState } from 'react'
import { useLocale } from '@/lib/i18n'
import { applyLocale, LOCALE_CHOICES, type Locale } from '@/lib/i18n/locales'
import { cn } from '@/lib/utils/cn'

/**
 * Le choix de langue, à côté du bouton de thème.
 *
 * Même matière et même taille : ce sont deux réglages personnels de même
 * nature, et rien ne justifierait d'en mettre un en avant.
 *
 * Changer de langue recharge la page. Le cookie est lu côté serveur pour
 * que la première image soit déjà traduite ; basculer sans recharger
 * laisserait le rendu serveur et le rendu client en désaccord.
 */
export function LangToggle() {
  const current = useLocale()
  const [busy, setBusy] = useState(false)

  function pick(locale: Locale) {
    if (locale === current || busy) return
    setBusy(true)
    applyLocale(locale)
    window.location.reload()
  }

  return (
    <div
      role="radiogroup"
      aria-label="Langue · Language"
      className="bg-surface shadow-token rounded-token flex h-11 items-center p-1"
    >
      {LOCALE_CHOICES.map((choice) => {
        const active = choice.value === current
        return (
          <button
            key={choice.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={busy}
            onClick={() => pick(choice.value)}
            className={cn(
              'rounded-token h-9 px-2.5 text-[13px] font-medium',
              'transition-colors duration-200 ease-out',
              active ? 'bg-accent text-on-accent' : 'text-muted hover:text-fg',
            )}
          >
            {choice.label}
          </button>
        )
      })}
    </div>
  )
}
