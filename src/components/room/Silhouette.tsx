'use client'

import { getShape, type GameId } from '@/lib/games'
import { cn } from '@/lib/utils/cn'

/**
 * La silhouette sonore d'un jeu, en petit et sans interaction. Le même
 * vocabulaire que sur l'accueil : on reconnaît un jeu à sa forme avant
 * d'avoir lu son nom, y compris dans une liste de choix.
 */
export function Silhouette({
  gameId,
  bars = 26,
  className,
}: {
  gameId: GameId
  bars?: number
  className?: string
}) {
  const shape = getShape(gameId)

  return (
    <span
      aria-hidden="true"
      className="flex h-5 w-20 shrink-0 items-center gap-px sm:w-24"
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn('h-full flex-1 rounded-full', className)}
          style={{ transform: `scaleY(${shape(i, bars).toFixed(3)})` }}
        />
      ))}
    </span>
  )
}
