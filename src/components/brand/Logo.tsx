import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Une barre de son plate, et un pic au milieu.
 *
 * C'est le vocabulaire de la forme d'onde utilisée partout ailleurs dans le
 * produit, réduit à ce qui se reconnaît : le silence, puis la voix. Un
 * spectre aux hauteurs variées se lit comme n'importe quel égaliseur ;
 * un seul pic sur une ligne plate ne ressemble qu'à lui-même.
 *
 * Toutes les barres partagent le même centre : c'est la hauteur seule qui
 * fait le dessin, et la marque tient donc à seize pixels.
 */
const BARS = [
  { x: 1.8, height: 3 },
  { x: 5.4, height: 3 },
  { x: 9, height: 16 },
  { x: 12.6, height: 3 },
  { x: 16.2, height: 3 },
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
