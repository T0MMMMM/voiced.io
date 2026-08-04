'use client'

import { useEffect, useState } from 'react'
import { IconButton } from '@/components/ui'
import type { QuestionComponentProps, RankingPayload } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

function Arrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={up ? 'M10 15V5M5.5 9.5 10 5l4.5 4.5' : 'M10 5v10M5.5 10.5 10 15l4.5-4.5'} />
    </svg>
  )
}

/**
 * Classement par déplacement.
 *
 * Pas de glisser-déposer : deux flèches font le même travail, marchent au
 * clavier sans rien ajouter, et ne demandent pas de viser. Sur cinq
 * éléments, on a fini avant d'avoir eu le temps de trouver ça lent.
 *
 * La notation compte les paires dans le bon ordre relatif : quatre éléments
 * bien placés sur cinq rapportent beaucoup plus que zéro.
 */
export function RankingQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<RankingPayload, { kind: 'classement'; order: string[] }>) {
  const [order, setOrder] = useState<string[]>(value?.order ?? payload.items)

  // La question change : on repart de la liste proposée, sinon le classement
  // de la précédente resterait affiché.
  useEffect(() => {
    setOrder(value?.order ?? payload.items)
  }, [payload.items, value?.order])

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= order.length) return

    const next = [...order]
    const moved = next[index]
    const displaced = next[target]
    if (moved === undefined || displaced === undefined) return

    next[index] = displaced
    next[target] = moved

    setOrder(next)
    onChange({ kind: 'classement', order: next })
  }

  return (
    <div className="space-y-2">
      <p className="eyebrow text-faint">{payload.topLabel}</p>

      <ol className="space-y-1.5">
        {order.map((item, index) => (
          <li
            key={item}
            className={cn(
              'bg-surface shadow-token rounded-token flex items-center gap-3 py-2 pr-2 pl-3',
              disabled && 'opacity-60',
            )}
          >
            <span className="eyebrow text-faint tnum w-5 shrink-0">
              {index + 1}
            </span>
            <span className="text-fg min-w-0 flex-1 text-[15px]">{item}</span>

            <IconButton
              label={`Monter ${item}`}
              size="sm"
              variant="ghost"
              disabled={disabled || index === 0}
              onClick={() => move(index, -1)}
            >
              <Arrow up />
            </IconButton>
            <IconButton
              label={`Descendre ${item}`}
              size="sm"
              variant="ghost"
              disabled={disabled || index === order.length - 1}
              onClick={() => move(index, 1)}
            >
              <Arrow up={false} />
            </IconButton>
          </li>
        ))}
      </ol>

      <p className="eyebrow text-faint">{payload.bottomLabel}</p>
    </div>
  )
}
