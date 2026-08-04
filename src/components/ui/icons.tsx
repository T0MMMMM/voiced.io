import { cn } from '@/lib/utils/cn'

/**
 * Jeu d'icônes du site. Toutes sur la même grille de 20, même graisse de
 * trait, mêmes extrémités arrondies : c'est ce qui les fait lire comme une
 * famille plutôt que comme une collection.
 *
 * Une icône n'apparaît que si elle remplace du texte ou double une action,
 * jamais en décoration à côté d'un libellé.
 */
type IconProps = { className?: string }

function Svg({
  className,
  children,
  filled = false,
}: IconProps & { children: React.ReactNode; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={cn('size-[18px] shrink-0', className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export const PlusIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M10 4.5v11M4.5 10h11" />
  </Svg>
)

export const ArrowRightIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" />
  </Svg>
)

export const UsersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="7.5" cy="7" r="2.6" />
    <path d="M2.8 15.5c.4-2.4 2.4-3.8 4.7-3.8s4.3 1.4 4.7 3.8" />
    <path d="M13.2 5.2a2.6 2.6 0 0 1 0 4.9M14.3 12.2c1.6.4 2.7 1.6 3 3.3" />
  </Svg>
)

export const SlidersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 6h5M13 6h3M4 14h3M11 14h5" />
    <circle cx="11" cy="6" r="1.8" />
    <circle cx="9" cy="14" r="1.8" />
  </Svg>
)

export const CopyIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="7" y="7" width="9" height="9" rx="2" />
    <path d="M13 4.5H6a2 2 0 0 0-2 2v6.5" />
  </Svg>
)

export const CheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4.5 10.5 8 14l7.5-8" />
  </Svg>
)

export const PlayIcon = ({ className }: IconProps) => (
  <Svg className={className} filled>
    <path d="M6.5 4.2v11.6L16 10 6.5 4.2Z" />
  </Svg>
)

export const UploadIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M10 13.5V4M6.5 7.5 10 4l3.5 3.5" />
    <path d="M3.5 13v2a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-2" />
  </Svg>
)
