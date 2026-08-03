import { Panel } from '@/components/ui'
import { formatBytes } from '@/lib/clips/validate'
import { formatDuration } from '@/lib/utils/time'

/**
 * L'état de l'envoi en cours. La progression est réelle — elle vient des
 * évènements de la requête — parce qu'une barre qui avance toute seule
 * ment sur ce qui reste à attendre.
 */
export function UploadStatus({
  name,
  size,
  durationSec,
  progress,
}: {
  name: string
  size: number
  durationSec?: number
  progress: number
}) {
  const percent = Math.round(progress * 100)

  return (
    <Panel className="w-full">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-fg truncate text-[15px] font-medium">{name}</p>
        <p className="eyebrow text-faint tnum shrink-0">{percent} %</p>
      </div>

      <p className="text-muted mt-1 text-[13px]">
        {formatBytes(size)}
        {durationSec ? ` · ${formatDuration(durationSec)}` : ''}
      </p>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progression de l’envoi"
        className="bg-sunken mt-4 h-1.5 w-full overflow-hidden rounded-full"
      >
        <div
          className="bg-accent h-full rounded-full transition-[width] duration-200 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </Panel>
  )
}
