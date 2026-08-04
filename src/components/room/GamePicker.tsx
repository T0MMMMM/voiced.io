'use client'

import { Silhouette } from '@/components/room/Silhouette'
import { IconButton } from '@/components/ui'
import { GAMES, type GameId } from '@/lib/games'
import { cn } from '@/lib/utils/cn'

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'M12 4 6 10l6 6' : 'M8 4l6 6-6 6'} />
    </svg>
  )
}

/**
 * Le jeu se choisit sur une ligne, en feuilletant.
 *
 * Une liste de quatre entrées obligeait à lire quatre lignes pour en
 * retenir une. Ici le salon affiche le jeu retenu, en grand, et les flèches
 * font défiler les autres : c'est un choix, pas un inventaire.
 */
export function GamePicker({
  game,
  canChange,
  onChange,
}: {
  game: GameId
  canChange: boolean
  onChange: (next: GameId) => void
}) {
  const index = Math.max(
    0,
    GAMES.findIndex((candidate) => candidate.id === game),
  )
  const current = GAMES[index] ?? GAMES[0]!
  const available = current.playable

  function step(direction: -1 | 1) {
    const next = GAMES[(index + direction + GAMES.length) % GAMES.length]
    if (next) onChange(next.id)
  }

  return (
    <div className="bg-surface shadow-token rounded-token-lg flex items-center gap-3 px-3 py-3">
      <IconButton
        label="Jeu précédent"
        size="sm"
        variant="ghost"
        disabled={!canChange}
        onClick={() => step(-1)}
      >
        <Chevron direction="left" />
      </IconButton>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Silhouette
          gameId={current.id}
          className={available ? 'bg-accent' : 'bg-wave-ref'}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="text-fg text-[17px] font-medium tracking-[-0.015em]">
              {current.name}
            </span>
            {!available && <span className="eyebrow text-faint">Bientôt</span>}
          </span>
          <span className="text-muted mt-0.5 block truncate text-[13px]">
            {current.tagline}
          </span>
        </span>
      </div>

      {/* Une pastille par jeu : on sait où l'on est dans la série sans
          avoir à les compter. */}
      <span aria-hidden="true" className="hidden shrink-0 items-center gap-1 sm:flex">
        {GAMES.map((candidate) => (
          <span
            key={candidate.id}
            className={cn(
              'size-1.5 rounded-full transition-colors duration-200',
              candidate.id === current.id ? 'bg-accent' : 'bg-strong',
            )}
          />
        ))}
      </span>

      <IconButton
        label="Jeu suivant"
        size="sm"
        variant="ghost"
        disabled={!canChange}
        onClick={() => step(1)}
      >
        <Chevron direction="right" />
      </IconButton>
    </div>
  )
}
