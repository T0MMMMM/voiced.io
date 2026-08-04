'use client'

import { Fragment, useEffect, useState } from 'react'
import type { QuestionComponentProps, TimelinePayload } from '@/lib/quiz/kinds'
import { cn } from '@/lib/utils/cn'

/**
 * La frise chronologique.
 *
 * Ce n'est pas un classement déguisé : des repères sont déjà datés et
 * posés sur l'axe, et il n'y a qu'un événement à situer entre eux. La
 * question devient « avant ou après la Révolution ? » plutôt que « remets
 * ces cinq choses dans l'ordre », ce qui est à la fois plus rapide à jouer
 * et plus proche de ce qu'on sait vraiment d'une date.
 *
 * L'axe descend, du plus ancien au plus récent : les repères portent des
 * titres, et une frise horizontale les aurait écrasés les uns sur les
 * autres dès le premier écran étroit.
 *
 * Se tromper d'un cran rapporte une part : viser le bon siècle n'est pas
 * la même erreur que tout renverser.
 */
export function TimelineQuestion({
  payload,
  value,
  disabled,
  onChange,
}: QuestionComponentProps<TimelinePayload, { kind: 'frise'; slot: number }>) {
  const [slot, setSlot] = useState<number | null>(value?.slot ?? null)

  useEffect(() => {
    setSlot(value?.slot ?? null)
  }, [payload.event, value?.slot])

  function place(index: number) {
    if (disabled) return
    setSlot(index)
    onChange({ kind: 'frise', slot: index })
  }

  /** Un intervalle avant le premier repère, un après le dernier. */
  const slots = payload.anchors.length + 1

  function Slot({ index }: { index: number }) {
    const chosen = slot === index

    return (
      <li>
        <button
          type="button"
          disabled={disabled}
          onClick={() => place(index)}
          aria-label={`Placer « ${payload.event} » à la position ${index + 1} sur ${slots}`}
          className={cn(
            'group flex w-full items-center gap-3 py-1 text-left',
            disabled && 'cursor-default',
          )}
        >
          {/* La pastille tient la place du repère sur l'axe : sans elle,
              l'intervalle choisi flotterait à côté de la ligne. */}
          <span className="flex w-9 shrink-0 justify-center">
            <span
              className={cn(
                'size-3 rounded-full border-2 transition-[background-color,border-color,transform] duration-200',
                chosen
                  ? 'bg-accent border-accent scale-125'
                  : 'border-[var(--border)] bg-transparent group-hover:border-[var(--accent)]',
              )}
            />
          </span>

          <span
            className={cn(
              'rounded-token flex-1 border border-dashed px-3 py-2 text-[15px]',
              'transition-[background-color,border-color,color] duration-200',
              chosen
                ? 'bg-accent-soft border-accent text-fg border-solid font-medium'
                : 'text-faint border-[var(--border)]',
              !chosen && !disabled && 'group-hover:text-muted',
            )}
          >
            {chosen ? payload.event : 'Placer ici'}
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-muted text-[15px]">
        Où placer{' '}
        <span className="text-fg font-medium">« {payload.event} »</span> sur la
        frise ?
      </p>

      {/* La ligne de temps court derrière les pastilles : c'est elle qui
          fait lire l'ensemble comme une frise et non comme une liste. */}
      <ol className="relative space-y-1">
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 left-[1.125rem] w-px bg-[var(--border)]"
        />

        <Slot index={0} />

        {payload.anchors.map((anchor, index) => (
          <Fragment key={anchor.label}>
            <li className="flex items-center gap-3 py-1">
              <span className="flex w-9 shrink-0 justify-center">
                <span className="bg-fg relative size-2.5 rounded-full" />
              </span>
              <span className="flex flex-1 flex-wrap items-baseline gap-x-2.5">
                <span className="tnum text-accent text-[13px] font-semibold">
                  {anchor.year < 0 ? `${Math.abs(anchor.year)} av. J.-C.` : anchor.year}
                </span>
                <span className="text-fg text-[15px]">{anchor.label}</span>
              </span>
            </li>
            <Slot index={index + 1} />
          </Fragment>
        ))}
      </ol>
    </div>
  )
}
