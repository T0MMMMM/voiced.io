'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui'
import type { ListPayload, QuestionComponentProps } from '@/lib/quiz/kinds'

/**
 * « Citez N ».
 *
 * Une case par réponse attendue, plutôt qu'un champ libre où l'on sépare
 * par des virgules : le compte demandé se lit dans la forme même, et
 * découper une phrase pour deviner combien de réponses elle contient est
 * une source d'erreurs qu'on peut simplement ne pas créer.
 *
 * Chaque case juste rapporte sa part : en trouver trois sur quatre vaut
 * bien mieux que rien.
 */
export function ListQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<ListPayload, { kind: 'liste'; items: string[] }>) {
  const count = Math.max(1, payload.count)
  const [items, setItems] = useState<string[]>(
    value?.items ?? Array.from({ length: count }, () => ''),
  )

  useEffect(() => {
    setItems(value?.items ?? Array.from({ length: count }, () => ''))
  }, [count, value?.items])

  function edit(index: number, text: string) {
    const next = [...items]
    next[index] = text
    setItems(next)
    onChange({ kind: 'liste', items: next })
  }

  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, index) => (
        <Input
          key={index}
          label={index === 0 ? `${count} réponses attendues` : undefined}
          value={items[index] ?? ''}
          placeholder={`Réponse ${index + 1}`}
          disabled={disabled}
          maxLength={80}
          autoFocus={index === 0}
          onChange={(event) => edit(index, event.target.value)}
        />
      ))}
    </div>
  )
}
