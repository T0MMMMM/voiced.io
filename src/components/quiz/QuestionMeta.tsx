'use client'

import { DIFFICULTY_LABELS } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * Difficulté et valeur de la question, côte à côte.
 *
 * Les deux vont ensemble : annoncer qu'une question est difficile sans dire
 * ce qu'elle rapporte laisserait croire à une punition. La couleur suit le
 * feu tricolore (vert, orange, rouge) parce que c'est la seule échelle de
 * difficulté que tout le monde lit sans légende.
 */
const TONES: Record<number, string> = {
  1: 'bg-ok/12 text-ok',
  2: 'bg-warn/14 text-warn',
  3: 'bg-rec/12 text-rec',
}

export function QuestionMeta({
  difficulty,
  points,
  className,
}: {
  difficulty: number
  points: number
  className?: string
}) {
  const level = Math.min(3, Math.max(1, difficulty))

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'rounded-token inline-flex items-center gap-1.5 px-2 py-1',
          TONES[level],
        )}
      >
        {/* Trois pastilles remplies selon le niveau : la difficulté se lit
            aussi sans distinguer les couleurs. */}
        <span aria-hidden="true" className="flex gap-0.5">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={cn(
                'size-1.5 rounded-full bg-current',
                step > level && 'opacity-25',
              )}
            />
          ))}
        </span>
        <span className="eyebrow">{DIFFICULTY_LABELS[level]}</span>
      </span>

      <span className="eyebrow text-faint">
        {points} point{points > 1 ? 's' : ''}
      </span>
    </span>
  )
}
