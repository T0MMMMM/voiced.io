import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

/**
 * Aucune variante en relief n'a de bordure : c'est l'ombre qui détache le
 * contrôle du fond crème. Ajouter un trait en plus rendrait l'objet lourd.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-accent text-on-accent shadow-token hover:bg-accent-hover hover:shadow-lift hover:-translate-y-px',
  secondary:
    'bg-surface text-fg shadow-token hover:shadow-lift hover:-translate-y-px',
  ghost: 'bg-transparent text-muted hover:text-fg hover:bg-sunken',
  danger:
    'bg-rec text-white shadow-token hover:shadow-lift hover:-translate-y-px',
}

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-14 px-7 text-[16px] gap-2.5',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'rounded-token inline-flex items-center justify-center font-medium tracking-[-0.01em]',
          'transition-[transform,box-shadow,background-color,color] duration-200 ease-out',
          // Le clic ramène le bouton au ras du fond : le relief se lit
          // dans le mouvement, pas seulement dans l'ombre.
          'active:translate-y-0 active:shadow-token active:duration-75',
          'disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none',
          VARIANTS[variant],
          SIZES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
