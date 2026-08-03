'use client'

import { useEffect, useState } from 'react'
import { Button, Panel } from '@/components/ui'
import { PlayerSeats } from '@/components/room/PlayerSeats'
import { RoomCode } from '@/components/room/RoomCode'
import { Silhouette } from '@/components/room/Silhouette'
import { GAMES } from '@/lib/games'
import { ClipUploader } from '@/components/upload/ClipUploader'
import { PlayIcon, SlidersIcon, UploadIcon, UsersIcon } from '@/components/ui/icons'
import {
  setRoomClip,
  setRoomGame,
  setRoomOptions,
  startGame,
  touchPlayer,
} from '@/lib/rooms/actions'
import { mergeOptions, TIMER_CHOICES, type RoomOptions } from '@/lib/rooms/options'
import type { Player, Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

const TOGGLES: { key: keyof RoomOptions; label: string; hint: string }[] = [
  { key: 'shuffle', label: 'Ordre aléatoire', hint: 'Les questions ne tombent pas dans l’ordre' },
  { key: 'anonymousGrading', label: 'Correction anonyme', hint: 'L’hôte ne voit pas qui a répondu quoi' },
  { key: 'allowBets', label: 'Paris', hint: 'Chacun mise sur sa confiance avant de répondre' },
  { key: 'allowHints', label: 'Indices', hint: 'Des indices tombent, la question perd de la valeur' },
  { key: 'allowSteal', label: 'Question volée', hint: 'Celui qui passe laisse la main aux autres' },
]

function SectionTitle({
  icon,
  children,
  aside,
}: {
  icon: React.ReactNode
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-1">
      <span className="eyebrow text-faint flex items-center gap-2">
        <span className="[&>svg]:size-4">{icon}</span>
        {children}
      </span>
      {aside && <span className="eyebrow text-faint">{aside}</span>}
    </div>
  )
}

export function RoomLobby({
  room,
  players,
  youId,
}: {
  room: Room
  players: Player[]
  youId: string | null
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const you = players.find((player) => player.id === youId) ?? null
  const isHost = you?.is_host ?? false
  const options = mergeOptions(room.options)

  // Le doublage ne peut pas demarrer sans matiere a doubler.
  const needsClip = room.game === 'dub' && !room.clip_id

  // Battement de présence. Sans lui, un joueur reste « prêt » pour toujours,
  // y compris après avoir fermé son onglet.
  useEffect(() => {
    if (!youId) return
    void touchPlayer(youId)
    const timer = window.setInterval(() => void touchPlayer(youId), 10_000)
    return () => window.clearInterval(timer)
  }, [youId])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col items-center gap-6">
        <span className="bg-surface shadow-token rounded-token text-muted inline-flex items-center gap-2 px-3 py-1.5 text-[13px]">
          <span className="bg-accent size-2 animate-pulse rounded-full" />
          En direct · {players.length} joueur{players.length > 1 ? 's' : ''}
        </span>

        <RoomCode code={room.code} />
      </div>

      <section aria-label="Joueurs">
        <SectionTitle
          icon={<UsersIcon />}
          aside={isHost ? 'Vous arbitrez' : undefined}
        >
          Autour de la table
        </SectionTitle>
        <PlayerSeats players={players} youId={youId} hostId={room.host_player_id} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-label="Jeu">
          <SectionTitle
            icon={<PlayIcon />}
            aside={isHost ? 'Vous choisissez' : 'L’hôte choisit'}
          >
            Jeu
          </SectionTitle>

          <Panel padded={false} className="overflow-hidden">
            <ul className="divide-default divide-y">
              {GAMES.map((game) => {
                const chosen = room.game === game.id
                const available = game.href !== null
                const selectable = isHost && available && !busy

                return (
                  <li key={game.id}>
                    <button
                      type="button"
                      disabled={!selectable}
                      aria-pressed={chosen}
                      onClick={() => void run(() => setRoomGame(room.id, game.id))}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3.5 text-left',
                        'transition-colors duration-150',
                        chosen && 'bg-accent-soft',
                        selectable && !chosen && 'hover:bg-sunken',
                        !selectable && 'cursor-default',
                      )}
                    >
                      <Silhouette
                        gameId={game.id}
                        className={chosen ? 'bg-accent' : 'bg-wave-ref'}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-fg block text-[15px] font-medium">
                          {game.name}
                        </span>
                        {!available && (
                          <span className="eyebrow text-faint">Bientôt</span>
                        )}
                      </span>
                      {chosen && <span className="eyebrow text-accent">Choisi</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </section>

        <section aria-label="Réglages">
          <SectionTitle
            icon={<SlidersIcon />}
            aside={isHost ? undefined : 'Lecture seule'}
          >
            Réglages
          </SectionTitle>

          <Panel>
            <fieldset disabled={!isHost || busy} className="space-y-4">
              <div>
                <legend className="text-fg text-[15px] font-medium">Minuteur</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {TIMER_CHOICES.map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      aria-pressed={options.timerSec === choice.value}
                      onClick={() =>
                        void run(() =>
                          setRoomOptions(room.id, { timerSec: choice.value }),
                        )
                      }
                      className={cn(
                        'rounded-token px-3 py-1.5 text-[13px] transition-colors duration-150',
                        options.timerSec === choice.value
                          ? 'bg-accent text-on-accent'
                          : 'bg-sunken text-muted',
                        !isHost && 'cursor-default',
                      )}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="divide-default divide-y border-t border-t-[var(--border)] pt-1">
                {TOGGLES.map(({ key, label, hint }) => (
                  <label
                    key={key}
                    className={cn(
                      'flex items-start gap-3 py-2.5',
                      isHost ? 'cursor-pointer' : 'cursor-default',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={options[key] as boolean}
                      onChange={(event) =>
                        void run(() =>
                          setRoomOptions(room.id, { [key]: event.target.checked }),
                        )
                      }
                      className="accent-accent mt-0.5 size-4 shrink-0"
                    />
                    <span>
                      <span className="text-fg block text-[15px]">{label}</span>
                      <span className="text-faint block text-[13px]">{hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </Panel>
        </section>
      </div>

      {needsClip && (
        <section aria-label="Clip à doubler">
          <SectionTitle
            icon={<UploadIcon />}
            aside={isHost ? undefined : 'L’hôte s’en charge'}
          >
            Clip à doubler
          </SectionTitle>

          {isHost ? (
            <ClipUploader
              onUploaded={(clipId) => run(() => setRoomClip(room.id, clipId))}
            />
          ) : (
            <Panel className="text-muted py-8 text-center text-[15px]">
              L’hôte est en train de choisir un clip.
            </Panel>
          )}
        </section>
      )}

      <section className="flex flex-col items-center gap-4">
        {isHost ? (
          <Button
            size="lg"
            loading={busy}
            disabled={needsClip}
            className="gap-2.5"
            onClick={() => void run(() => startGame(room.id))}
          >
            <PlayIcon />
            {needsClip ? 'Importez un clip pour lancer' : 'Lancer la partie'}
          </Button>
        ) : (
          <p className="text-muted text-[15px]">
            En attente de l’hôte pour lancer la partie.
          </p>
        )}

        {error && (
          <p role="alert" className="text-rec text-[15px]">
            {error}
          </p>
        )}
      </section>
    </div>
  )
}
