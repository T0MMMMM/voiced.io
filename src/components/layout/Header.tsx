import { Logo } from '@/components/brand/Logo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils/cn'

/**
 * Pas de barre de navigation, ni fond, ni bordure, ni ombre sur l'en-tête
 * lui-même. Seuls les deux contrôles flottent au-dessus de la page, et
 * c'est leur relief qui les détache, pas un bandeau.
 */
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
        'absolute inset-x-0 top-0 z-40 flex h-20 items-center gap-4 px-6 sm:px-10',
        className,
      )}
    >
      <Logo />
      <div className="text-muted flex flex-1 items-center justify-center text-[13px]">
        {children}
      </div>
      <ThemeToggle />
    </header>
  )
}
