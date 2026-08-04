'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Panel } from '@/components/ui'
import { IconButton } from '@/components/ui'
import { adjustScore, publishResults, standings, type Standing } from '@/lib/quiz/actions'
import type { Player, Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

/** Un demi-point existe : une liste à moitié juste en vaut un. */
const STEPS = [-1, -0.5, 0.5, 1]

/**
 * Le rattrapage, juste avant le podium.
 *
 * La machine se trompe et l'hôte aussi : une bonne réponse mal orthographiée
 * refusée, un doublon compté deux fois, une question dont personne n'était
 * d'accord. Revenir en arrière question par question coûterait dix minutes
 * et gâcherait la fin de partie ; on corrige le total, devant tout le monde.
 *
 * L'écran est visible de tous, et c'est voulu : un ajustement fait en
 * cachette serait suspect, fait à la vue de la table il se discute.
 */
export function ScoreFix({
  room,
  players,
  youId,
}: {
  room: Room
  players: Player[]
  youId: string | null
}) {
  const isHost = players.find((player) => player.id === youId)?.is_host ?? false

  const [rows, setRows] = useState<Standing[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setRows(await standings(room.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Lecture impossible.')
    }
  }, [room.id])

  useEffect(() => {
    void load()
  }, [load])

  // Les joueurs voient les ajustements arriver ; l'hôte, lui, a déjà son
  // écran à jour puisque c'est lui qui écrit.
  useEffect(() => {
    if (isHost) return
    const timer = window.setInterval(() => void load(), 2000)
    return () => window.clearInterval(timer)
  }, [isHost, load])

  /** L'écran bouge avant le serveur : un ajustement doit se sentir immédiat. */
  function adjust(playerId: string, delta: number) {
    setRows((current) =>
      [...current]
        .map((row) =>
          row.playerId === playerId
            ? { ...row, score: row.score + delta, bonus: row.bonus + delta }
            : row,
        )
        .sort((a, b) => b.score - a.score),
    )

    void adjustScore(playerId, delta).catch((cause) => {
      setError(cause instanceof Error ? cause.message : 'Ajustement impossible.')
      void load()
    })
  }

  async function publish() {
    setBusy(true)
    try {
      await publishResults(room.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Publication impossible.')
      setBusy(false)
    }
  }

  return (
    <div className="space-y-7">
      <header className="space-y-2 text-center">
        <p className="eyebrow text-accent">Avant le podium</p>
        <h1 className="text-fg text-[clamp(1.5rem,3.6vw,2.25rem)] leading-[1.15] font-medium tracking-[-0.025em] text-balance">
          Un point à rattraper ?
        </h1>
        <p className="text-muted text-[15px]">
          {isHost
            ? 'Ajustez les totaux si la correction a été injuste, puis publiez.'
            : 'L’hôte vérifie les totaux avant de publier les résultats.'}
        </p>
      </header>

      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.playerId}>
            <Panel className="flex flex-wrap items-center gap-4">
              <span className="min-w-0 flex-1">
                <span className="text-fg block text-[17px] font-medium">
                  {row.nickname}
                </span>
                {row.bonus !== 0 && (
                  <span
                    className={cn(
                      'mt-0.5 block text-[13px]',
                      row.bonus > 0 ? 'text-accent' : 'text-rec',
                    )}
                  >
                    {row.bonus > 0 ? '+' : ''}
                    {row.bonus} ajusté{Math.abs(row.bonus) > 1 ? 's' : ''}
                  </span>
                )}
              </span>

              <span className="tnum text-fg text-[19px] font-semibold">
                {row.score}
              </span>

              {isHost && (
                <span className="flex shrink-0 gap-1.5">
                  {STEPS.map((delta) => (
                    <IconButton
                      key={delta}
                      label={`${delta > 0 ? 'Ajouter' : 'Retirer'} ${Math.abs(delta)} point à ${row.nickname}`}
                      size="sm"
                      variant={delta > 0 ? 'raised' : 'danger'}
                      onClick={() => adjust(row.playerId, delta)}
                      className="text-[13px] font-medium"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </IconButton>
                  ))}
                </span>
              )}
            </Panel>
          </li>
        ))}
      </ul>

      {isHost && (
        <div className="flex justify-center">
          <Button size="lg" loading={busy} onClick={() => void publish()}>
            Publier les résultats
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {error}
        </p>
      )}
    </div>
  )
}
