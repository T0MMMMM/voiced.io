import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  /** Creusé dans le fond plutôt que posé dessus : pour ce qui est en retrait. */
  sunken?: boolean
}

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { padded = true, sunken = false, className, children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-token-lg',
        // Posé : l'ombre suffit, aucune bordure. Creusé : pas d'ombre, une
        // bordure fine pour marquer le bord de la cuvette.
        sunken ? 'bg-sunken border-default border' : 'bg-surface shadow-token',
        padded && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
