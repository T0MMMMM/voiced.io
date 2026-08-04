import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Les cinq barres reprennent exactement le vocabulaire de la waveform
 * utilisée partout ailleurs dans le produit : la marque et l'outil
 * parlent la même langue.
 */
const BARS = [
  { x: 1, height: 7 },
  { x: 5, height: 13 },
  { x: 9, height: 18 },
  { x: 13, height: 11 },
  { x: 17, height: 5 },
]

export function WaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-5', className)}
      fill="currentColor"
    >
      {BARS.map(({ x, height }) => (
        <rect
          key={x}
          x={x}
          y={(20 - height) / 2}
          width="2"
          height={height}
          rx="1"
        />
      ))}
    </svg>
  )
}

/**
 * Le bloc de marque : une tuile en relief, la même matière que tous les
 * boutons du site, suivie du mot en noir franc. Elle ramène à l'accueil,
 * comme tout logo de site.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="voiced.io : retour à l’accueil"
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <span className="bg-surface shadow-token rounded-token text-accent inline-flex size-9 shrink-0 items-center justify-center transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-px group-hover:shadow-[var(--shadow-lift)]">
        <WaveMark />
      </span>
      <span className="text-fg text-[17px] font-semibold tracking-[-0.02em]">
        voiced.io
      </span>
    </Link>
  )
}
