import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

/**
 * Une forme d'onde : le silence, un pic de voix, puis le retour au calme.
 *
 * Le profil est volontairement dissymétrique — montée franche, descente
 * plus lente. C'est ainsi qu'un son se comporte réellement, et c'est ce qui
 * distingue la marque d'un égaliseur symétrique quelconque.
 *
 * Toutes les barres partagent le même centre : c'est la hauteur seule qui
 * fait le dessin, et la marque tient donc à seize pixels.
 */
export const BAR_HEIGHTS = [1.4, 2, 3.4, 6, 11, 16.4, 12, 7, 3.6, 1.6]

const BARS = BAR_HEIGHTS.map((height, index) => ({
  x: 0.9 + index * 1.92,
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
          width="1.15"
          height={height}
          rx="0.58"
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
