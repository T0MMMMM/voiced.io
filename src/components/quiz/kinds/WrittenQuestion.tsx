'use client'

import { Input } from '@/components/ui'
import type { QuestionComponentProps, WrittenPayload } from '@/lib/quiz/kinds'
import { useT } from '@/lib/i18n'

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
  const t = useT()
  return (
    <Input
      label={t.forms.yourAnswer}
      value={value?.text ?? ''}
      placeholder={payload.placeholder ?? t.forms.typeYourAnswer}
      disabled={disabled}
      maxLength={120}
      autoFocus
      onChange={(event) => onChange({ kind: 'ecrite', text: event.target.value })}
    />
  )
}
