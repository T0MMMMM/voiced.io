'use client'

import { useEffect, useState } from 'react'

/**
 * Trois temps de huit cents millisecondes.
 *
 * Le rythme n'est pas qu'esthetique : ces 2,4 secondes sont exactement le
 * temps dont la chaine audio a besoin pour se stabiliser apres l'ouverture
 * du micro. Le decompte fait donc deux choses a la fois — il cale celui qui
 * parle, et il laisse le flux devenir exploitable.
 */
export const COUNTDOWN_STEP_MS = 800
export const COUNTDOWN_FROM = 3
export const COUNTDOWN_TOTAL_MS = COUNTDOWN_STEP_MS * COUNTDOWN_FROM

/**
 * Le décompte avant une prise.
 *
 * Sans lui, l'enregistrement démarre pendant qu'on cherche encore sa
 * respiration, et la première syllabe est toujours perdue. Trois temps
 * suffisent à se caler — c'est le seul moment du site où une animation a le
 * droit d'occuper tout l'écran.
 */
export function Countdown({
  onDone,
  level,
}: {
  onDone: () => void
  /** Niveau d'entrée du micro, entre 0 et 1. */
  level: number
}) {
  const [value, setValue] = useState(COUNTDOWN_FROM)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setValue((current) => current - 1)
    }, COUNTDOWN_STEP_MS)

    const done = window.setTimeout(onDone, COUNTDOWN_TOTAL_MS)

    return () => {
      window.clearInterval(timer)
      window.clearTimeout(done)
    }
  }, [onDone])

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label={`Enregistrement dans ${value}`}
      className="bg-bg/75 absolute inset-0 z-30 flex items-center justify-center backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-5">
        <span
          // La clé change à chaque temps : React remonte l'élément, et
          // l'animation se rejoue au lieu de rester figée sur le premier.
          key={value}
          className="pop text-fg font-mono text-[clamp(4rem,14vw,7rem)] leading-none font-bold"
        >
          {Math.max(1, value)}
        </span>

        {/* Le micro chauffe pendant ces trois temps. La jauge dit qu'il
            capte déjà, ce qui est la seule chose qu'on veut savoir avant
            de se lancer. */}
        <span className="flex flex-col items-center gap-1.5">
          <span className="bg-sunken h-1.5 w-32 overflow-hidden rounded-full">
            <span
              className="bg-accent block h-full rounded-full transition-[width] duration-75"
              style={{ width: `${Math.min(100, level * 140)}%` }}
            />
          </span>
          <span className="eyebrow text-faint">Parlez pour vérifier</span>
        </span>
      </div>
    </div>
  )
}
