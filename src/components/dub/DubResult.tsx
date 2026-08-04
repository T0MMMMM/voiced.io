'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Panel, Timecode } from '@/components/ui'
import { PlayIcon } from '@/components/ui/icons'
import { VideoStage, type VideoStageHandle } from '@/components/video/VideoStage'
import { DubMixer } from '@/lib/audio/mixer'
import { reopenRoom } from '@/lib/rooms/actions'
import { listTakes, type SavedTake } from '@/lib/takes/actions'
import type { Player, Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

export interface DubResultProps {
  room: Room
  players: Player[]
  youId: string | null
  videoUrl: string
  durationSec: number
  aspectRatio: number
  takes: SavedTake[]
}

/**
 * Le doublage fini.
 *
 * C'est le moment que tout le reste prepare : personne n'a entendu personne
 * pendant la partie, et tout sort d'un coup. L'ecran ne propose donc qu'une
 * chose, appuyer sur lecture, et ne montre le detail qu'apres.
 */
export function DubResult({
  room,
  players,
  youId,
  videoUrl,
  durationSec,
  aspectRatio,
  takes: initialTakes,
}: DubResultProps) {
  const stage = useRef<VideoStageHandle>(null)
  const mixer = useRef<DubMixer | null>(null)

  /**
   * Les prises sont relues a l'arrivee.
   *
   * Celles recues en props datent du rendu serveur, c'est-a-dire de
   * l'ouverture de la page, donc d'avant les enregistrements. En basculant
   * sur le resultat, on heritait de cette photo perimee : une video muette
   * alors que les prises existaient bel et bien.
   */
  const [takes, setTakes] = useState<SavedTake[]>(initialTakes)

  useEffect(() => {
    void listTakes(room.id).then(setTakes)
  }, [room.id])

  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const you = players.find((player) => player.id === youId)
  const isHost = you?.is_host ?? false

  useEffect(() => () => mixer.current?.dispose(), [])

  const play = useCallback(async () => {
    if (playing) {
      mixer.current?.stop()
      stage.current?.pause()
      setPlaying(false)
      return
    }

    setLoading(true)
    setWarning(null)
    mixer.current ??= new DubMixer()
    const { loaded, total } = await mixer.current.load(
      takes.map((take) => ({
        id: take.id,
        url: take.url,
        startSec: take.startSec,
        durationSec: take.durationMs / 1000,
      })),
    )
    setLoading(false)

    if (loaded === 0 && total > 0) {
      setWarning('Aucune prise n’a pu être lue. Rechargez la page et réessayez.')
      return
    }
    if (loaded < total) {
      setWarning(`${total - loaded} prise(s) sur ${total} n’ont pas pu être lues.`)
    }

    await mixer.current.start(0)
    // La bande originale se tait : c'est votre version qu'on écoute.
    stage.current?.playSilentFrom(0)
    setPlaying(true)
  }, [playing, takes])

  const byPlayer = players
    .map((player) => ({
      player,
      count: takes.filter((take) => take.playerId === player.id).length,
    }))
    .filter((entry) => entry.count > 0)

  return (
    <div className="space-y-8">
      <header className="text-center">
        <p className="eyebrow text-accent">Doublage terminé</p>
        <h1 className="text-fg mt-3 text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.05] font-medium tracking-[-0.035em]">
          Écoutez ce que ça donne.
        </h1>
        <p className="text-muted mx-auto mt-4 max-w-md text-[17px] leading-relaxed">
          {takes.length} prise{takes.length > 1 ? 's' : ''} par{' '}
          {byPlayer.length} voix. Personne ne les a entendues avant maintenant.
        </p>
      </header>

      <VideoStage
        ref={stage}
        src={videoUrl}
        onTime={() => {}}
        onPlayingChange={setPlaying}
        onEnded={() => {
          mixer.current?.stop()
          setPlaying(false)
        }}
        aspectRatio={aspectRatio}
      />

      <div className="flex justify-center">
        <Button size="lg" className="gap-2.5" loading={loading} onClick={() => void play()}>
          {!loading && <PlayIcon />}
          {playing ? 'Arrêter' : 'Lancer le doublage complet'}
        </Button>
      </div>

      {warning && (
        <p role="alert" className="text-rec text-center text-[15px]">
          {warning}
        </p>
      )}

      <Panel>
        <h2 className="text-fg mb-3 text-[15px] font-medium">Les voix</h2>
        <ul className="divide-default divide-y">
          {byPlayer.map(({ player, count }) => (
            <li
              key={player.id}
              className={cn(
                'flex items-center justify-between py-2.5',
                player.id === youId && 'text-fg',
              )}
            >
              <span className="text-fg text-[15px]">
                {player.nickname}
                {player.id === youId && (
                  <span className="text-faint font-normal"> · vous</span>
                )}
              </span>
              <span className="eyebrow text-faint">
                {count} prise{count > 1 ? 's' : ''}
              </span>
            </li>
          ))}
        </ul>

        <ol className="divide-default mt-4 divide-y border-t border-t-[var(--border)]">
          {takes.map((take) => (
            <li key={take.id} className="flex items-center gap-3 py-2">
              <Timecode seconds={take.startSec} className="text-fg" />
              <span className="text-muted min-w-0 flex-1 truncate text-[15px]">
                {take.author}
              </span>
              <Timecode
                seconds={take.durationMs / 1000}
                mode="duration"
                className="text-faint"
              />
            </li>
          ))}
        </ol>
      </Panel>

      <p className="text-faint text-center text-[13px]">
        Durée de la scène : <Timecode seconds={durationSec} mode="duration" />
      </p>

      {isHost && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            loading={busy}
            onClick={() => {
              setBusy(true)
              void reopenRoom(room.id).finally(() => setBusy(false))
            }}
          >
            Reprendre les enregistrements
          </Button>
        </div>
      )}
    </div>
  )
}
