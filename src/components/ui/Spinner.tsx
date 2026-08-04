import { cn } from '@/lib/utils/cn'

export interface SpinnerProps {
  size?: 'sm' | 'md'
  /** Annoncé aux lecteurs d'écran ; non affiché visuellement. */
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label = 'Chargement', className }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'border-strong border-t-accent inline-block animate-spin rounded-full border-2',
        size === 'sm' ? 'size-4' : 'size-6',
        className,
      )}
    />
  )
}
