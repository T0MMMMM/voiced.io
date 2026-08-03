'use client'

import { formatDuration } from '@/lib/utils/time'

export interface LocalTake {
  id: string
  author: string
  startSec: number
  durationMs: number
  url: string
}

/**
 * Les prises, posées sur la même échelle de temps que la partition juste
 * au-dessus : on voit d'un coup d'œil ce qui est déjà couvert et les
 * silences qu'il reste à remplir.
 */
export function TakeLane({
  takes,
  duration,
}: {
  takes: LocalTake[]
  duration: number
}) {
  if (takes.length === 0) {
    return (
      <p className="text-faint border-default rounded-token border border-dashed px-4 py-4 text-center text-[13px]">
        Personne n’a encore parlé. Placez la tête de lecture et appuyez sur R.
      </p>
    )
  }

  return (
    <div className="rounded-token bg-sunken border-default relative h-10 w-full overflow-hidden border">
      {takes.map((take) => (
        <div
          key={take.id}
          title={`${take.author} · ${formatDuration(take.durationMs / 1000)}`}
          className="bg-accent absolute inset-y-1 flex items-center overflow-hidden rounded-[6px] px-2"
          style={{
            left: `${(take.startSec / duration) * 100}%`,
            width: `${Math.max((take.durationMs / 1000 / duration) * 100, 1.5)}%`,
          }}
        >
          <span className="eyebrow text-on-accent truncate">{take.author}</span>
        </div>
      ))}
    </div>
  )
}
