'use client'

import { IconButton } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { formatTimecode } from '@/lib/utils/time'

export interface TransportProps {
  playing: boolean
  recording: boolean
  /** Nom du joueur qui tient le micro, si ce n'est pas vous. */
  blockedBy: string | null
  elapsedMs: number
  onPlayPause: () => void
  onRecord: () => void
  onRestart: () => void
  onBreakpoint: () => void
  onStep: (direction: 1 | -1) => void
}

/** Un raccourci n'est utile que s'il est écrit quelque part. */
const SHORTCUTS: [key: string, action: string][] = [
  ['Espace', 'lire ou mettre en pause'],
  ['B', 'poser une coupe à cet instant'],
  ['R', 'doubler le segment courant'],
  ['← →', 'segment précédent ou suivant'],
  ['Début', 'revenir au début'],
]

function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
      {playing ? (
        <path d="M6 4h3v12H6zM11 4h3v12h-3z" />
      ) : (
        <path d="M6.5 4.2v11.6L16 10 6.5 4.2Z" />
      )}
    </svg>
  )
}

export function Transport({
  playing,
  recording,
  blockedBy,
  elapsedMs,
  onPlayPause,
  onRecord,
  onRestart,
  onBreakpoint,
  onStep,
}: TransportProps) {
  const locked = blockedBy !== null

  return (
    <div className="flex flex-col items-center gap-6">
      {/* L'état d'enregistrement n'est jamais porté par la seule couleur :
          point, libellé et compteur disent tous les trois la même chose. */}
      <p
        role="status"
        aria-live="assertive"
        className="flex h-6 items-center gap-2 text-[15px]"
      >
        {recording ? (
          <>
            <span className="bg-rec size-2.5 animate-pulse rounded-full" />
            <span className="text-rec font-medium">Vous enregistrez</span>
            <span className="tnum text-muted font-mono">
              {formatTimecode(elapsedMs / 1000)}
            </span>
          </>
        ) : locked ? (
          <>
            <span className="bg-rec size-2.5 animate-pulse rounded-full" />
            <span className="text-muted">{blockedBy} enregistre</span>
          </>
        ) : (
          <span className="text-faint">
            Appuyez sur R : le segment courant se coupe tout seul
          </span>
        )}
      </p>

      <div className="flex items-center gap-6">
        <IconButton label="Revenir au début" onClick={onRestart} disabled={recording}>
          <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
            <path d="M5 4h2v12H5zM16 4.2v11.6L7.5 10 16 4.2Z" />
          </svg>
        </IconButton>

        <IconButton
          label={playing ? 'Mettre en pause' : 'Lire'}
          onClick={onPlayPause}
          disabled={recording}
        >
          <PlayIcon playing={playing} />
        </IconButton>

        <IconButton
          label="Poser une coupe à cet instant"
          onClick={onBreakpoint}
          disabled={recording}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
            <path
              d="M10 2.5v15"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M5.5 6.5 10 2.5l4.5 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </IconButton>

        {/* Le seul élément appuyé de l'écran. Tout le reste se tait autour. */}
        <button
          type="button"
          onClick={onRecord}
          disabled={locked && !recording}
          aria-label={recording ? 'Arrêter l’enregistrement' : 'Enregistrer'}
          className={cn(
            'shadow-token relative inline-flex size-20 items-center justify-center rounded-full',
            'transition-[transform,box-shadow] duration-200 ease-out',
            'hover:shadow-lift hover:-translate-y-px active:translate-y-0 active:duration-75',
            'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
            recording ? 'bg-surface' : 'bg-rec',
          )}
        >
          {recording ? (
            <span className="bg-rec size-6 rounded-[6px]" />
          ) : (
            <span className="size-7 rounded-full bg-white" />
          )}
          {recording && (
            <span className="border-rec absolute inset-0 animate-ping rounded-full border-2" />
          )}
        </button>

        <IconButton
          label="Segment précédent"
          onClick={() => onStep(-1)}
          disabled={recording}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
            <path d="M9.5 5v10L3 10l6.5-5ZM17 5v10l-6.5-5L17 5Z" />
          </svg>
        </IconButton>

        <IconButton
          label="Segment suivant"
          onClick={() => onStep(1)}
          disabled={recording}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="currentColor" aria-hidden="true">
            <path d="M10.5 5v10L17 10l-6.5-5ZM3 5v10l6.5-5L3 5Z" />
          </svg>
        </IconButton>
      </div>

      <dl className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {SHORTCUTS.map(([key, action]) => (
          <div key={key} className="flex items-center gap-1.5">
            <dt className="eyebrow text-fg bg-surface shadow-token rounded-[6px] px-1.5 py-0.5">
              {key}
            </dt>
            <dd className="text-faint text-[13px]">{action}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
