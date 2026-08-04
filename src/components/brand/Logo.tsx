import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Cinq barres de niveau sonore dont les centres descendent puis remontent :
 * la marque dessine un V tout en restant une waveform. Le vocabulaire est
 * celui de la forme d'onde utilisée partout ailleurs dans le produit, et la
 * lettre est celle du nom.
 *
 * Ce sont les centres qui font le V, pas les hauteurs : des barres de
 * tailles très différentes se lisaient comme un spectre quelconque, alors
 * qu'un décalage vertical net se reconnaît même en seize pixels.
 */
const BARS = [
  { x: 1.2, cy: 5.6, height: 7 },
  { x: 5.1, cy: 9.5, height: 6.4 },
  { x: 9, cy: 13.4, height: 6 },
  { x: 12.9, cy: 9.5, height: 6.4 },
  { x: 16.8, cy: 5.6, height: 7 },
]

export function WaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-5', className)}
      fill="currentColor"
    >
      {BARS.map(({ x, cy, height }) => (
        <rect
          key={x}
          x={x}
          y={cy - height / 2}
          width="2"
          height={height}
          rx="1"
        />
      ))}
    </svg>
  )
}

/**
 * Le bloc de marque : une tuile pleine, vert franc, suivie du mot en noir.
 * Elle garde le relief et le rayon de tous les boutons du site, mais son
 * aplat de couleur la détache d'eux : un logo doit se reconnaître d'un
 * coup d'œil, pas se confondre avec un contrôle.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="voiced.io : retour à l’accueil"
      className={cn('group inline-flex items-center gap-2.5', className)}
    >
      <span className="bg-accent text-on-accent shadow-token rounded-token inline-flex size-9 shrink-0 items-center justify-center transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-px group-hover:shadow-[var(--shadow-lift)]">
        <WaveMark className="size-[22px]" />
      </span>
      <span className="text-fg text-[17px] font-semibold tracking-[-0.02em]">
        voiced.io
      </span>
    </Link>
  )
}
