import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Sept barres, une montée, un pic, une descente.
 *
 * Un logo se lit, il ne se détaille pas : une dizaine de barres fines
 * donnait l'illustration d'une forme d'onde, pas une marque. Sept barres
 * épaisses, largement espacées, gardent la même idée et tiennent encore à
 * seize pixels, ce qui est la seule taille où un logo doit vraiment
 * fonctionner.
 *
 * La symétrie est voulue : elle équilibre la tuile. Un profil réaliste,
 * avec attaque franche et longue traîne, ressemblait à une capture d'écran.
 */
const BAR_WIDTH = 1.9
const BAR_GAP = 0.85
const BAR_HEIGHTS = [3, 6, 11, 17.4, 11, 6, 3]

const SPAN = BAR_HEIGHTS.length * BAR_WIDTH + (BAR_HEIGHTS.length - 1) * BAR_GAP

const BARS = BAR_HEIGHTS.map((height, index) => ({
  x: (20 - SPAN) / 2 + index * (BAR_WIDTH + BAR_GAP),
  height,
}))

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
          width={BAR_WIDTH}
          height={height}
          rx={BAR_WIDTH / 2}
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
