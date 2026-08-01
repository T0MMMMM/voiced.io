import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

const VARIANTS: Record<Variant, string> = {
  secondary: 'bg-surface text-fg border border-default hover:border-strong',
  ghost: 'bg-transparent text-muted hover:text-fg hover:bg-sunken',
  danger: 'bg-transparent text-rec hover:bg-sunken',
}

const SIZES: Record<Size, string> = {
  sm: 'size-8',
  md: 'size-10',
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
    { label, variant = 'ghost', size = 'md', className, children, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          'rounded-token inline-flex shrink-0 items-center justify-center transition-colors duration-150',
          'disabled:pointer-events-none disabled:opacity-40',
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
