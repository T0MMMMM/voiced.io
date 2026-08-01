import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils/cn'

export function Header({
  children,
  className,
}: {
  children?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn(
        'border-default bg-surface sticky top-0 z-40 flex h-14 items-center gap-4 border-b px-5',
        className,
      )}
    >
      <span className="text-fg text-[15px] font-semibold tracking-tight">
        voiced<span className="text-accent">.io</span>
      </span>
      <div className="text-muted flex flex-1 items-center justify-center text-[13px]">
        {children}
      </div>
      <ThemeToggle />
    </header>
  )
}
