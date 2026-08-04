'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuestionComponentProps, TimelinePayload } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/** Une année négative se lit « avant Jésus-Christ », jamais « -2560 ». */
function readYear(year: number): string {
  const rounded = Math.round(year)
  return rounded < 0 ? `${Math.abs(rounded)} av. J.-C.` : String(rounded)
}

/**
 * La frise chronologique.
 *
 * Toutes les questions de date passent par elle : on fait glisser un
 * curseur sur un axe du temps plutôt que de taper une année au clavier.
 * Taper « 1789 » est un examen ; faire glisser jusqu'à tomber entre deux
 * repères est un jeu, et c'est le geste qui donne envie de discuter avec
 * la table pendant qu'on cherche.
 *
 * Les repères datés restent affichés sous l'axe. Ils ne sont pas là pour
 * décorer : sans eux, un axe nu de mille ans ne veut rien dire, et on
 * répondrait au hasard.
 *
 * La note est dégressive à l'écart en années. Tomber à cinq ans près
 * rapporte presque tout, ce qui récompense le raisonnement même sans la
 * date exacte en tête.
 */
export function TimelineQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<TimelinePayload, { kind: 'frise'; year: number }>) {
  const middle = Math.round((payload.from + payload.to) / 2)
  const [year, setYear] = useState<number>(value?.year ?? middle)
  const [touched, setTouched] = useState(value != null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setYear(value?.year ?? Math.round((payload.from + payload.to) / 2))
    setTouched(value != null)
  }, [payload.from, payload.to, value])

  const span = Math.max(1, payload.to - payload.from)
  const ratio = (year - payload.from) / span

  function commit(next: number) {
    const clamped = Math.min(payload.to, Math.max(payload.from, Math.round(next)))
    setYear(clamped)
    setTouched(true)
    onChange({ kind: 'frise', year: clamped })
  }

  /** Une position à l'écran devient une année sur l'axe. */
  function yearAt(clientX: number): number {
    const rect = track.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return year
    const part = (clientX - rect.left) / rect.width
    return payload.from + part * span
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return
    // La capture suit le doigt même quand il sort de la piste : sans elle,
    // glisser un peu trop haut lâchait le curseur en pleine course.
    event.currentTarget.setPointerCapture(event.pointerId)
    commit(yearAt(event.clientX))
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return
    commit(yearAt(event.clientX))
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return
    // Le pas au clavier suit l'échelle : un axe de mille ans ne se parcourt
    // pas année par année, et un axe de trente ans ne se règle pas par dix.
    const step = span > 400 ? 10 : 1
    const jump = span > 400 ? 100 : 10

    const moves: Record<string, number> = {
      ArrowLeft: -step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowUp: step,
      PageDown: -jump,
      PageUp: jump,
    }

    if (event.key === 'Home') return void (event.preventDefault(), commit(payload.from))
    if (event.key === 'End') return void (event.preventDefault(), commit(payload.to))

    const move = moves[event.key]
    if (move === undefined) return
    event.preventDefault()
    commit(year + move)
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-muted text-[15px]">{payload.event}</p>
        <p
          className={cn(
            'tnum mt-1 text-[clamp(2rem,6vw,3rem)] leading-none font-medium tracking-[-0.03em]',
            touched ? 'text-fg' : 'text-faint',
          )}
        >
          {readYear(year)}
        </p>
      </div>

      {/* La piste occupe toute la largeur : c'est elle qu'on vise, pas la
          poignée, sinon le geste demanderait de la précision au pixel. */}
      <div
        ref={track}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Année pour : ${payload.event}`}
        aria-valuemin={payload.from}
        aria-valuemax={payload.to}
        aria-valuenow={year}
        aria-valuetext={readYear(year)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className={cn(
          'relative h-16 touch-none select-none',
          'focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-4',
          'rounded-token',
          disabled ? 'cursor-default' : 'cursor-ew-resize',
        )}
      >
        <span
          aria-hidden="true"
          className="bg-sunken absolute top-1/2 right-0 left-0 h-2 -translate-y-1/2 rounded-full"
        />
        <span
          aria-hidden="true"
          className="bg-accent absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full"
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />

        {/* Les graduations donnent l'échelle ; sans elles, la poignée
            glisse dans le vide. */}
        {payload.marks?.map((mark) => {
          const at = ((mark.year - payload.from) / span) * 100
          if (at < 0 || at > 100) return null

          return (
            <span
              key={mark.label}
              aria-hidden="true"
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${at}%` }}
            >
              <span className="bg-surface border-default block size-1.5 rounded-full border" />
            </span>
          )
        })}

        <span
          aria-hidden="true"
          className={cn(
            'bg-surface shadow-token absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full',
            'border-accent border-2 transition-transform duration-150',
            !disabled && 'hover:scale-110',
          )}
          style={{ left: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>

      <div className="text-faint tnum flex justify-between text-[13px]">
        <span>{readYear(payload.from)}</span>
        <span>{readYear(payload.to)}</span>
      </div>

      {payload.marks && payload.marks.length > 0 && (
        <ul className="text-faint flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13px]">
          {payload.marks.map((mark) => (
            <li key={mark.label}>
              <span className="tnum text-accent">{readYear(mark.year)}</span>{' '}
              {mark.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
