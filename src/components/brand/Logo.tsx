import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Une bulle de parole, avec une onde à l'intérieur.
 *
 * Les barres seules disaient « audio », ce que dit n'importe quel lecteur
 * de musique. La bulle dit ce que fait vraiment le site : des voix, à
 * plusieurs, qui se répondent. C'est la seule forme essayée qui raconte le
 * produit plutôt que sa technologie.
 *
 * Trois barres, pas davantage : à seize pixels, la bulle mange déjà la
 * moitié de la place, et un spectre entier s'y écraserait en une tache.
 */
const BUBBLE =
  'M3 6.5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-3.5 3v-3H6a3 3 0 0 1-3-3z'

const BARS = [
  { x: 6.5, height: 2.6 },
  { x: 9.35, height: 6 },
  { x: 12.2, height: 2.6 },
]

export function WaveMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-5', className)}
      fill="none"
    >
      <path
        d={BUBBLE}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {BARS.map(({ x, height }) => (
        <rect
          key={x}
          x={x}
          y={9 - height / 2}
          width="1.3"
          height={height}
          rx="0.65"
          fill="currentColor"
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
