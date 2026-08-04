'use client'

import { IconButton, Timecode } from '@/components/ui'
import { PlayIcon } from '@/components/ui/icons'
import type { Segment } from '@/lib/audio/breakpoints'
import { cn } from '@/lib/utils/cn'

/**
 * Les segments et leurs points de coupe.
 *
 * Le reglage fin se fait ici plutot que sur la partition : viser un trait
 * de deux pixels au dixieme de seconde pres est penible, alors que des
 * fleches sur une ligne de liste sont sans ambiguite. La partition reste le
 * moyen rapide, cette liste le moyen precis.
 */
export function SegmentList({
  segments,
  breakpoints,
  activeIndex,
  disabled,
  onPreview,
  onNudge,
  onRemove,
}: {
  segments: Segment[]
  breakpoints: number[]
  activeIndex: number | null
  disabled: boolean
  onPreview: (segment: Segment) => void
  onNudge: (breakpointIndex: number, deltaSec: number) => void
  onRemove: (breakpointIndex: number) => void
}) {
  if (segments.length <= 1) {
    return (
      <p className="text-faint border-default rounded-token border border-dashed px-4 py-5 text-center text-[13px]">
        Aucune coupe. Lancez la lecture et appuyez sur B à la fin de chaque
        réplique.
      </p>
    )
  }

  return (
    <ol className="divide-default divide-y">
      {segments.map((segment) => {
        // Le point qui ouvre ce segment. Le premier n'en a pas : il commence
        // au debut du clip, qui ne se deplace pas.
        const opener = segment.index - 1
        const hasOpener = opener >= 0 && opener < breakpoints.length

        return (
          <li
            key={segment.index}
            className={cn(
              'flex items-center gap-3 py-2.5 transition-colors duration-200',
              activeIndex === segment.index && 'bg-accent-soft -mx-3 px-3',
            )}
          >
            <span className="eyebrow text-faint tnum w-6 shrink-0">
              {String(segment.index + 1).padStart(2, '0')}
            </span>

            <span className="flex min-w-0 flex-1 items-baseline gap-2">
              <Timecode seconds={segment.start} className="text-fg" />
              <span className="text-faint text-[13px]">→</span>
              <Timecode seconds={segment.end} className="text-fg" />
              <Timecode
                seconds={segment.end - segment.start}
                mode="duration"
                className="text-faint ml-1"
              />
            </span>

            <IconButton
              label={`Écouter le segment ${segment.index + 1}`}
              size="sm"
              variant="ghost"
              disabled={disabled}
              onClick={() => onPreview(segment)}
            >
              <PlayIcon className="size-4" />
            </IconButton>

            {hasOpener ? (
              <span className="flex items-center gap-0.5">
                <IconButton
                  label={`Avancer la coupe de la réplique ${segment.index + 1} de 0,1 seconde`}
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onNudge(opener, -0.1)}
                >
                  <span aria-hidden="true" className="font-mono text-[13px]">
                    −
                  </span>
                </IconButton>
                <IconButton
                  label={`Retarder la coupe de la réplique ${segment.index + 1} de 0,1 seconde`}
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onNudge(opener, 0.1)}
                >
                  <span aria-hidden="true" className="font-mono text-[13px]">
                    +
                  </span>
                </IconButton>
                <IconButton
                  label={`Supprimer la coupe avant la réplique ${segment.index + 1}`}
                  size="sm"
                  variant="danger"
                  disabled={disabled}
                  onClick={() => onRemove(opener)}
                >
                  <span aria-hidden="true" className="text-[15px] leading-none">
                    ×
                  </span>
                </IconButton>
              </span>
            ) : (
              <span className="eyebrow text-faint pr-2">Début</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
