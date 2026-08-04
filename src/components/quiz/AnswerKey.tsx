'use client'

import { frameFor, MapCanvas, MapPin } from '@/components/quiz/kinds/MapCanvas'
import { useT, type Dictionary } from '@/lib/i18n'
import type { MapPayload, Question, SilhouettePayload } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * La bonne réponse, mise en mots.
 *
 * Corriger sans l'avoir sous les yeux obligeait l'hôte à la connaître par
 * cœur, ou à ouvrir un autre onglet pendant que la table attend.
 */
function words(
  question: Question,
  expected: unknown,
  t: Dictionary,
): string | null {
  if (expected === null || expected === undefined) return null
  const value = expected as Record<string, unknown>

  switch (question.kind) {
    case 'ecrite':
    case 'silhouette':
      return (value.accepted as string[])?.join(' · ') ?? null

    case 'liste': {
      const accepted = (value.accepted as string[]) ?? []
      const count = (value.count as number) ?? accepted.length
      // Le vivier d'une liste tient rarement sur une ligne : on annonce
      // combien on en demandait, puis on déroule.
      return t.grading.amongst(count, accepted.join(' · '))
    }

    case 'estimation': {
      const unit = (question.payload as { unit?: string })?.unit
      return unit ? `${expected} ${unit}` : String(expected)
    }

    case 'classement':
      return (expected as string[]).join(' · ')

    case 'frise': {
      const year = value.year as number
      return year < 0 ? t.forms.bc(Math.abs(year)) : String(year)
    }

    case 'intrus':
      return String(expected)

    case 'association':
      return Object.entries(expected as Record<string, string>)
        .map(([left, right]) => `${left} → ${right}`)
        .join(' · ')

    case 'theme': {
      const levels = value.levels as Record<string, { accepted: string[] }>
      return Object.entries(levels ?? {})
        .map(([level, entry]) => `${level} : ${entry.accepted.join(' · ')}`)
        .join('  |  ')
    }

    case 'carte':
      return null

    default:
      return null
  }
}

/**
 * Ce que l'écran de correction montre en tête de question.
 *
 * Trois formes ne se lisent pas en texte et reviennent donc telles
 * qu'elles : la carte, avec le point attendu et celui de chacun ; et la
 * silhouette, qu'on ne peut pas corriger sans la revoir.
 */
export function AnswerKey({
  question,
  expected,
  placed,
}: {
  question: Question
  expected: unknown
  /** Les points posés par les joueurs, pour les questions de carte. */
  placed?: { nickname: string; lat: number; lng: number }[]
}) {
  const t = useT()

  if (question.kind === 'carte') {
    const payload = question.payload as MapPayload
    const frame = frameFor(payload)
    const point = (expected as { point?: { lat: number; lng: number } })?.point

    return (
      <div className="space-y-2">
        <MapCanvas frame={frame}>
          {(placed ?? []).map((entry, index) => (
            <MapPin
              key={index}
              frame={frame}
              lat={entry.lat}
              lng={entry.lng}
              tone="var(--text)"
              label={entry.nickname}
            />
          ))}
          {point && (
            <MapPin frame={frame} lat={point.lat} lng={point.lng} tone="var(--accent)" />
          )}
        </MapCanvas>

        <p className="text-faint text-[13px]">
          <span className="text-accent">●</span> {payload.target ?? t.grading.answer}
          {' · '}
          <span className="text-fg">●</span> {t.grading.playersDot}
        </p>
      </div>
    )
  }

  if (question.kind === 'silhouette') {
    const payload = question.payload as SilhouettePayload

    return (
      <div className="flex items-center gap-5">
        <div className="bg-sunken rounded-token size-32 shrink-0 p-3">
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <g transform={`rotate(${payload.rotate} 50 50)`}>
              <path d={payload.shape} fill="var(--accent)" />
            </g>
          </svg>
        </div>
        <div>
          <p className="eyebrow text-faint">{t.grading.answer}</p>
          <p className="text-fg mt-1 text-[19px] font-medium">
            {words(question, expected, t) ?? '?'}
          </p>
        </div>
      </div>
    )
  }

  const text = words(question, expected, t)
  if (!text) {
    return (
      <p className="text-faint text-[15px]">{t.grading.noExpected}</p>
    )
  }

  return (
    <div>
      <p className="eyebrow text-faint">{t.grading.expected}</p>
      <p className={cn('text-fg mt-1 text-[17px]', text.length > 90 && 'text-[15px]')}>
        {text}
      </p>
    </div>
  )
}
