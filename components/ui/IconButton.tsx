import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'raised' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

/**
 * `raised` est le défaut : c'est la matière commune à tous les contrôles
 * du site — surface blanche, ombre grise, aucune bordure.
 */
const VARIANTS: Record<Variant, string> = {
  raised:
    'bg-surface text-fg shadow-token hover:shadow-lift hover:-translate-y-px',
  ghost: 'bg-transparent text-muted hover:text-fg hover:bg-sunken',
  danger:
    'bg-surface text-rec shadow-token hover:shadow-lift hover:-translate-y-px',
}

const SIZES: Record<Size, string> = {
  sm: 'size-9',
  md: 'size-11',
}

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  /** Obligatoire : un bouton sans texte doit toujours être nommé pour les lecteurs d'écran. */
  label: string
  variant?: Variant
  size?: Size
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { label, variant = 'raised', size = 'md', className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'rounded-token inline-flex shrink-0 items-center justify-center',
          'transition-[transform,box-shadow,background-color,color] duration-200 ease-out',
          'active:translate-y-0 active:shadow-token active:duration-75',
          'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
          VARIANTS[variant],
          SIZES[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
