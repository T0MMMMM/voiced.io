import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
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
        'rounded-token-lg border-default border',
        sunken ? 'bg-sunken' : 'bg-surface shadow-token',
        padded && 'p-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
})
