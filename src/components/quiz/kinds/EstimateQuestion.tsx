'use client'

import { Input } from '@/components/ui'
import type { EstimatePayload, QuestionComponentProps } from '@/lib/quiz/kinds'

/**
 * Estimation chiffrée.
 *
 * Notée en dégressif sur l'écart relatif, jamais en tout ou rien : sur
 * « combien d'habitants ? », rater de cinq pour cent n'est pas la même
 * chose que rater de mille, et une note binaire rendrait la forme
 * frustrante au point qu'on ne la rejoue pas.
 */
export function EstimateQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<EstimatePayload, { kind: 'estimation'; value: number }>) {
  return (
    <div className="flex items-end gap-3">
      <Input
        label="Votre estimation"
        type="number"
        inputMode="numeric"
        mono
        value={value ? String(value.value) : ''}
        placeholder="0"
        disabled={disabled}
        autoFocus
        onChange={(event) =>
          onChange({ kind: 'estimation', value: Number(event.target.value) })
        }
      />
      {payload.unit && (
        <span className="text-muted pb-3 text-[15px] whitespace-nowrap">
          {payload.unit}
        </span>
      )}
    </div>
  )
}
