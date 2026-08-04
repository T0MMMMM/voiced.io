'use client'

import { useEffect, useState } from 'react'
import type { PairsPayload, QuestionComponentProps } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * L'association.
 *
 * Deux colonnes à relier. Pas de traits à tirer à la souris : on choisit un
 * élément de gauche, puis son partenaire à droite. Le geste marche au
 * clavier, au doigt et à la souris sans code supplémentaire, alors qu'un
 * glisser-déposer aurait exigé trois implémentations et échouerait sur la
 * première ligne un peu étroite.
 *
 * Chaque paire juste rapporte sa part : en trouver trois sur quatre vaut
 * bien mieux que rien.
 */
export function PairsQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<
  PairsPayload,
  { kind: 'association'; pairs: Record<string, string> }
>) {
  const [pairs, setPairs] = useState<Record<string, string>>(value?.pairs ?? {})
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    setPairs(value?.pairs ?? {})
    setPending(null)
  }, [payload.left, value?.pairs])

  function assign(right: string) {
    if (!pending) return

    const next = { ...pairs }
    // Un partenaire ne sert qu'une fois : on le retire de son ancienne
    // paire, sinon deux éléments de gauche pointeraient vers le même.
    for (const [key, val] of Object.entries(next)) {
      if (val === right) delete next[key]
    }
    next[pending] = right

    setPairs(next)
    setPending(null)
    onChange({ kind: 'association', pairs: next })
  }

  const taken = new Set(Object.values(pairs))

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <ul className="space-y-2">
          {payload.left.map((item) => {
            const partner = pairs[item]
            const active = pending === item

            return (
              <li key={item}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setPending(active ? null : item)}
                  className={cn(
                    'rounded-token w-full px-3 py-2.5 text-left text-[15px]',
                    'transition-[background-color,color] duration-200',
                    active
                      ? 'bg-accent text-on-accent'
                      : partner
                        ? 'bg-accent-soft text-fg'
                        : 'bg-sunken text-fg',
                    disabled && 'cursor-default opacity-60',
                  )}
                >
                  <span className="block">{item}</span>
                  {partner && (
                    <span
                      className={cn(
                        'eyebrow mt-0.5 block',
                        active ? 'text-on-accent/80' : 'text-accent',
                      )}
                    >
                      → {partner}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <ul className="space-y-2">
          {payload.right.map((item) => (
            <li key={item}>
              <button
                type="button"
                disabled={disabled || !pending}
                onClick={() => assign(item)}
                className={cn(
                  'rounded-token w-full px-3 py-2.5 text-left text-[15px]',
                  'transition-[background-color,color,opacity] duration-200',
                  taken.has(item) ? 'bg-sunken text-faint' : 'bg-surface shadow-token text-fg',
                  pending && !disabled && 'hover:bg-accent-soft',
                  (disabled || !pending) && 'cursor-default',
                )}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-faint text-[13px]">
        {pending
          ? `Choisissez le partenaire de « ${pending} »`
          : 'Choisissez un élément de gauche, puis son partenaire à droite.'}
      </p>
    </div>
  )
}
