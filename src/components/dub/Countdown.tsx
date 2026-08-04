'use client'

import { useEffect, useState } from 'react'

/** Trois temps, six cent millisecondes chacun : le rythme d'un « 3, 2, 1 ». */
export const COUNTDOWN_STEP_MS = 600
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
export function Countdown({ onDone }: { onDone: () => void }) {
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
      <span
        // La clé change à chaque temps : React remonte l'élément, et
        // l'animation se rejoue au lieu de rester figée sur le premier.
        key={value}
        className="pop text-fg font-mono text-[clamp(4rem,14vw,7rem)] leading-none font-bold"
      >
        {Math.max(1, value)}
      </span>
    </div>
  )
}
