'use client'

import { cn } from '@/lib/utils/cn'

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="size-[17px] shrink-0"
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
 * Volume de la bande originale, posé dans le coin de l'image.
 *
 * Il se réduit à une icône tant qu'on ne s'en approche pas : c'est un
 * réglage qu'on touche deux fois par partie, il n'a rien à faire dans la
 * ligne des contrôles qu'on utilise en permanence. La glissière est
 * verticale, comme sur n'importe quel lecteur — et elle sort vers le haut
 * pour ne pas recouvrir l'image.
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
    <div
      className={cn(
        'group absolute right-3 bottom-3 z-20 flex flex-col items-center',
        className,
      )}
    >
      <div
        className={cn(
          'bg-surface/90 shadow-token rounded-token mb-1.5 px-2 py-3 backdrop-blur-sm',
          'origin-bottom scale-90 opacity-0 transition-[opacity,transform] duration-200 ease-out',
          'group-hover:scale-100 group-hover:opacity-100',
          'group-focus-within:scale-100 group-focus-within:opacity-100',
        )}
      >
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Volume de la bande originale"
          // `writing-mode` verticale est la façon standard d'orienter une
          // glissière ; une rotation par transformation casserait la zone
          // de clic et la navigation au clavier.
          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          className="accent-accent h-20 w-1 cursor-pointer"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(muted ? 0.8 : 0)}
        aria-label={muted ? 'Rétablir le son' : 'Couper le son'}
        className={cn(
          'bg-surface/90 shadow-token rounded-token flex size-8 items-center justify-center backdrop-blur-sm',
          'transition-colors duration-200',
          muted ? 'text-faint' : 'text-muted hover:text-fg',
        )}
      >
        <SpeakerIcon muted={muted} />
      </button>
    </div>
  )
}
