'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'
import type { PetitBacPayload, QuestionComponentProps } from '@/lib/quiz/kinds'

/**
 * Le petit bac.
 *
 * Une lettre, des catégories, un mot par catégorie. C'est la seule forme
 * qui reste entièrement à l'arbitrage de l'hôte : « Nice » est-il une ville
 * pour la lettre N, et « Nutella » un aliment ? Aucune liste ne tranchera
 * cela mieux qu'une table qui en discute.
 *
 * La lettre est rappelée en grand devant chaque champ : sans elle sous les
 * yeux, on écrit spontanément un mot qui commence par autre chose.
 */
export function PetitBacQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<
  PetitBacPayload,
  { kind: 'petit_bac'; words: Record<string, string> }
>) {
  const [words, setWords] = useState<Record<string, string>>(value?.words ?? {})

  useEffect(() => {
    setWords(value?.words ?? {})
  }, [payload.categories, value?.words])

  function edit(category: string, text: string) {
    const next = { ...words, [category]: text }
    setWords(next)
    onChange({ kind: 'petit_bac', words: next })
  }

  return (
    <div className="space-y-4">
      <p className="text-muted text-[15px]">
        Un mot par catégorie, commençant par
        <span className="text-fg mx-1.5 font-mono text-[19px] font-bold">
          {payload.letter}
        </span>
      </p>

      <div className="space-y-2.5">
        {payload.categories.map((category) => (
          <div key={category} className="flex items-end gap-3">
            <span className="bg-accent text-on-accent mb-1 flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-[15px] font-bold">
              {payload.letter}
            </span>
            <Input
              label={category}
              value={words[category] ?? ''}
              placeholder="…"
              disabled={disabled}
              maxLength={40}
              onChange={(event) => edit(category, event.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
