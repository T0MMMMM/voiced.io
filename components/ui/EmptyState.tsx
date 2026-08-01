import { cn } from '@/lib/utils/cn'

export interface EmptyStateProps {
  title: string
  description?: string
  /** Toujours proposer l'action suivante plutôt que de laisser l'écran mort. */
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'border-default rounded-token-lg flex flex-col items-center gap-2 border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-fg text-[15px] font-medium">{title}</p>
      {description && <p className="text-muted max-w-sm text-[15px]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
