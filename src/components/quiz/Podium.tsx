'use client'

import { useEffect, useState } from 'react'
import { Panel } from '@/components/ui'
import { standings, type Standing } from '@/lib/quiz/actions'
import type { Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

/**
 * Le classement.
 *
 * C'est le moment que toute la partie prépare : personne n'a vu les
 * réponses des autres, et tout tombe d'un coup. Les scores montent en
 * s'ouvrant, du dernier au premier : l'ordre du dévoilement fait le
 * suspense, pas un effet.
 */
export function Podium({ room, youId }: { room: Room; youId: string | null }) {
  const [rows, setRows] = useState<Standing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void standings(room.id).then((result) => {
      setRows(result)
      setLoading(false)
    })
  }, [room.id])

  if (loading) {
    return (
      <p className="text-muted py-16 text-center text-[17px]">
        Comptage des points…
      </p>
    )
  }

  const best = rows[0]?.score ?? 0

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="eyebrow text-accent">Partie terminée</p>
        <h1 className="text-fg mt-3 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.035em]">
          {rows[0] ? `${rows[0].nickname} l’emporte.` : 'Personne n’a marqué.'}
        </h1>
      </header>

      <ol className="space-y-2">
        {rows.map((row, index) => {
          const isYou = row.playerId === youId
          // Le décalage part du bas : le premier apparaît en dernier.
          const delay = (rows.length - index) * 90

          return (
            <li
              key={row.playerId}
              className="rise"
              style={{ animationDelay: `${delay}ms` }}
            >
              <Panel
                className={cn(
                  'flex items-center gap-4',
                  isYou && 'bg-accent-soft',
                  index === 0 && 'shadow-lift',
                )}
              >
                <span
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full font-mono text-[15px] font-bold',
                    index === 0 ? 'bg-accent text-on-accent' : 'bg-sunken text-fg',
                  )}
                >
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="text-fg block truncate text-[17px] font-medium">
                    {row.nickname}
                    {isYou && (
                      <span className="text-faint font-normal"> · vous</span>
                    )}
                  </span>
                  {/* Une barre relative au meilleur score : on lit l'ecart
                      sans avoir a soustraire. */}
                  <span className="bg-sunken mt-1.5 block h-1 w-full overflow-hidden rounded-full">
                    <span
                      className="bg-accent block h-full rounded-full"
                      style={{
                        width: `${best > 0 ? (row.score / best) * 100 : 0}%`,
                      }}
                    />
                  </span>
                </span>

                <span className="tnum text-fg shrink-0 font-mono text-[19px] font-bold">
                  {Math.round(row.score * 10) / 10}
                </span>
              </Panel>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
