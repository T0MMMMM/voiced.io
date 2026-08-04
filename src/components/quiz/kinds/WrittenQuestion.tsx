'use client'

import { Input } from '@/components/ui'
import type { QuestionComponentProps, WrittenPayload } from '@/lib/quiz/kinds'

/**
 * Réponse libre.
 *
 * La forme la plus simple à jouer et la plus coûteuse à corriger : c'est
 * elle qui justifie le regroupement par similitude, sans quoi l'hôte lirait
 * trois fois la même réponse écrite de trois façons.
 */
export function WrittenQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<WrittenPayload, { kind: 'ecrite'; text: string }>) {
  return (
    <Input
      label="Votre réponse"
      value={value?.text ?? ''}
      placeholder={payload.placeholder ?? 'Tapez votre réponse'}
      disabled={disabled}
      maxLength={120}
      autoFocus
      onChange={(event) => onChange({ kind: 'ecrite', text: event.target.value })}
    />
  )
}
