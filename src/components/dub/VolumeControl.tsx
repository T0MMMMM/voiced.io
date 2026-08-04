'use client'

import { cn } from '@/lib/utils/cn'

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="size-[18px] shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7.5h2.5L10 4.5v11L6.5 12.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
      {muted ? (
        <path d="M13.5 8 17 11.5M17 8l-3.5 3.5" />
      ) : (
        <path d="M13.2 7.4a3.6 3.6 0 0 1 0 5.2M15.6 5.4a6.8 6.8 0 0 1 0 9.2" />
      )}
    </svg>
  )
}

/**
 * Volume de la bande originale.
 *
 * Il ne sert pas pendant une prise — la vidéo y est muette de toute façon,
 * sans quoi le micro reprendrait la bande originale. Il sert à écouter la
 * scène avant de la doubler, et à doser l'original pendant qu'on écoute le
 * résultat.
 */
export function VolumeControl({
  value,
  onChange,
  className,
}: {
  value: number
  onChange: (next: number) => void
  className?: string
}) {
  const muted = value === 0

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <button
        type="button"
        onClick={() => onChange(muted ? 0.8 : 0)}
        aria-label={muted ? 'Rétablir le son' : 'Couper le son'}
        className={cn(
          'rounded-token transition-colors duration-200',
          muted ? 'text-faint' : 'text-muted hover:text-fg',
        )}
      >
        <SpeakerIcon muted={muted} />
      </button>

      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="Volume de la bande originale"
        className="accent-accent h-1 w-24 cursor-pointer"
      />
    </div>
  )
}
