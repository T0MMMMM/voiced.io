'use client'

import { useEffect, useState } from 'react'
import { Button, Panel } from '@/components/ui'
import { PlayerList } from '@/components/room/PlayerList'
import { RoomCode } from '@/components/room/RoomCode'
import { GAMES } from '@/lib/games'
import { setRoomGame, setRoomOptions, startGame, touchPlayer } from '@/lib/rooms/actions'
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

function Toggle({
  checked,
  disabled,
  label,
  hint,
  onChange,
}: {
  checked: boolean
  disabled: boolean
  label: string
  hint: string
  onChange: (next: boolean) => void
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-3 py-2.5',
        disabled && 'cursor-default opacity-55',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-accent mt-0.5 size-4 shrink-0"
      />
      <span>
        <span className="text-fg block text-[15px]">{label}</span>
        <span className="text-faint block text-[13px]">{hint}</span>
      </span>
    </label>
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

  // Battement de presence. Sans lui, un joueur reste « prêt » pour
  // toujours, y compris apres avoir ferme son onglet.
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
      <RoomCode code={room.code} />

      <section aria-label="Joueurs">
        <p className="eyebrow text-faint mb-3 text-center">
          {players.length} joueur{players.length > 1 ? 's' : ''}
        </p>
        <PlayerList players={players} youId={youId} hostId={room.host_player_id} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Panel>
          <h2 className="text-fg text-[15px] font-medium">Jeu</h2>
          <p className="text-faint mt-1 text-[13px]">
            {isHost ? 'Vous choisissez.' : 'L’hôte choisit.'}
          </p>

          <ul className="mt-4 space-y-1.5">
            {GAMES.map((game) => {
              const chosen = room.game === game.id
              const available = game.href !== null
              return (
                <li key={game.id}>
                  <button
                    type="button"
                    disabled={!isHost || busy || !available}
                    onClick={() => void run(() => setRoomGame(room.id, game.id))}
                    className={cn(
                      'rounded-token flex w-full items-center justify-between px-3 py-2 text-left text-[15px]',
                      'transition-colors duration-150',
                      chosen ? 'bg-accent-soft text-fg' : 'text-muted',
                      isHost && available && !chosen && 'hover:bg-sunken',
                      (!isHost || !available) && 'cursor-default',
                    )}
                  >
                    <span>{game.name}</span>
                    {!available && <span className="eyebrow text-faint">Bientôt</span>}
                    {chosen && <span className="eyebrow text-accent">Choisi</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel>
          <h2 className="text-fg text-[15px] font-medium">Réglages</h2>
          <p className="text-faint mt-1 text-[13px]">
            Visibles de tous, modifiables par l’hôte.
          </p>

          <div className="mt-4">
            <span className="text-fg block text-[15px]">Minuteur</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIMER_CHOICES.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  disabled={!isHost || busy}
                  onClick={() =>
                    void run(() => setRoomOptions(room.id, { timerSec: choice.value }))
                  }
                  className={cn(
                    'rounded-token px-3 py-1.5 text-[13px] transition-colors duration-150',
                    options.timerSec === choice.value
                      ? 'bg-accent text-on-accent'
                      : 'bg-sunken text-muted',
                    !isHost && 'cursor-default opacity-70',
                  )}
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-default mt-4 divide-y">
            {TOGGLES.map(({ key, label, hint }) => (
              <Toggle
                key={key}
                label={label}
                hint={hint}
                checked={options[key] as boolean}
                disabled={!isHost || busy}
                onChange={(next) =>
                  void run(() => setRoomOptions(room.id, { [key]: next }))
                }
              />
            ))}
          </div>
        </Panel>
      </section>

      <section className="flex flex-col items-center gap-4">
        {isHost ? (
          <Button
            size="lg"
            loading={busy}
            onClick={() => void run(() => startGame(room.id))}
          >
            Lancer la partie
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
