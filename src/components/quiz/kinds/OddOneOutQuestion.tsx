'use client'

import type { OddOneOutPayload, QuestionComponentProps } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * L'intrus.
 *
 * Une seule réponse est juste, donc tout ou rien. Les propositions sont des
 * boutons pleine largeur plutôt que des cases à cocher : on choisit une
 * fois, la cible est large, et le choix retenu se voit sans avoir à
 * chercher une petite marque.
 */
export function OddOneOutQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<OddOneOutPayload, { kind: 'intrus'; choice: string }>) {
  return (
    <ul className="space-y-2" role="radiogroup" aria-label="Propositions">
      {payload.items.map((item) => {
        const chosen = value?.choice === item

        return (
          <li key={item}>
            <button
              type="button"
              role="radio"
              aria-checked={chosen}
              disabled={disabled}
              onClick={() => onChange({ kind: 'intrus', choice: item })}
              className={cn(
                'rounded-token w-full px-4 py-3 text-left text-[15px]',
                'transition-[background-color,color,transform,box-shadow] duration-200 ease-out',
                chosen
                  ? 'bg-accent text-on-accent shadow-token'
                  : 'bg-sunken text-fg',
                !disabled && !chosen && 'hover:bg-accent-soft active:scale-[0.99]',
                disabled && 'cursor-default opacity-60',
              )}
            >
              {item}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
