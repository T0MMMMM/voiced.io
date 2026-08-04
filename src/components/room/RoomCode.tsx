'use client'

import { useRef, useState } from 'react'
import { CheckIcon, CopyIcon } from '@/components/ui/icons'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils/cn'

/**
 * Le code est fait pour être lu à voix haute au téléphone, d'où la chasse
 * fixe et l'interlettrage généreux : quatre consonnes bien détachées se
 * dictent sans se tromper.
 *
 * C'est le code lui-même qu'on clique pour le copier : la cible la plus
 * évidente de l'écran est aussi la plus grande. La petite icône en bas à
 * droite ne fait que signaler que c'est possible.
 */
export function RoomCode({
  code,
  present,
}: {
  code: string
  /** Combien de joueurs sont connectes, affiche en pastille sur le code. */
  present?: number
}) {
  const t = useT()
  const codeRef = useRef<HTMLSpanElement>(null)
  const [copied, setCopied] = useState(false)

  function bounce() {
    const element = codeRef.current
    if (!element) return

    // Retirer puis remettre la classe ne suffit pas : le navigateur groupe
    // les deux changements et ne rejoue rien. Lire une propriété de mise en
    // page force le recalcul entre les deux, et l'animation repart.
    element.classList.remove('pop')
    void element.offsetWidth
    element.classList.add('pop')
  }

  async function copyCode() {
    bounce()
    try {
      // Le code seul, pas l'adresse : c'est ce qu'on colle dans une
      // conversation, et c'est ce que le champ « j'ai un code » attend.
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Presse-papiers refusé : le code reste lisible à l'écran, on n'a
      // rien perdu d'essentiel.
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-2">
      <p className="eyebrow text-faint">{t.room.code}</p>

      {/* Le point vert bat : c'est ce qui dit que le salon est vivant, et
          le nombre suffit a dire combien on est. */}
      {present !== undefined && (
        <span
          className="text-muted absolute top-0 right-0 flex items-center gap-1.5 text-[13px]"
          aria-label={t.room.connected(present)}
        >
          <span className="tnum">{present}</span>
          <span className="bg-accent size-2 animate-pulse rounded-full" />
        </span>
      )}

      <button
        type="button"
        onClick={() => void copyCode()}
        aria-label={
          copied ? t.room.copied : t.room.copy(code)
        }
        className="rounded-token group relative px-4 pb-3 transition-colors duration-200"
      >
        <span
          ref={codeRef}
          className="text-fg block font-mono text-[clamp(2.75rem,10vw,5rem)] leading-none font-bold tracking-[0.18em]"
        >
          {code}
        </span>

        <span
          className={cn(
            'absolute right-0 bottom-0 transition-colors duration-200',
            copied ? 'text-accent' : 'text-faint group-hover:text-muted',
          )}
        >
          {copied ? (
            <CheckIcon className="size-[15px]" />
          ) : (
            <CopyIcon className="size-[15px]" />
          )}
        </span>
      </button>

      <p
        aria-live="polite"
        className={cn(
          'eyebrow h-4 transition-opacity duration-200',
          copied ? 'text-accent opacity-100' : 'opacity-0',
        )}
      >
        {t.room.copied}
      </p>
    </div>
  )
}
