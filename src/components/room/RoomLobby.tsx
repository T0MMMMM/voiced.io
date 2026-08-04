'use client'

import { useEffect, useState } from 'react'
import { GamePicker } from '@/components/room/GamePicker'
import { PlayerSeats } from '@/components/room/PlayerSeats'
import { RoomCode } from '@/components/room/RoomCode'
import { Button, Checkbox, Panel, Segmented } from '@/components/ui'
import { PlayIcon, SlidersIcon, UsersIcon } from '@/components/ui/icons'
import type { GameId } from '@/lib/games'
import { setRoomGame, setRoomOptions, startGame, touchPlayer } from '@/lib/rooms/actions'
import { startQuiz } from '@/lib/quiz/actions'
import {
  COUNT_CHOICES,
  KIND_CHOICES,
  mergeOptions,
  optionsFor,
  PACE_CHOICES,
  type RoomOptions,
} from '@/lib/rooms/options'
import { useT } from '@/lib/i18n'
import type { Player, Room } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'

/** Reglages a plusieurs valeurs : ils s'affichent en controle segmente. */
type ScaleKey = 'pace' | 'questionCount'
/** Les formes ont leur propre controle, ni echelle, ni interrupteur. */
type ToggleKey = Exclude<keyof RoomOptions, ScaleKey | 'kinds'>

interface Scale {
  key: ScaleKey
  choices: readonly { value: string | number; label: string }[]
}

const SCALES: Scale[] = [
  { key: 'questionCount', choices: COUNT_CHOICES },
  // On ne regle plus une duree : chaque question tire son temps de sa
  // forme et de sa difficulte, et ce reglage ne fait que l'etirer.
  { key: 'pace', choices: PACE_CHOICES },
]

/**
 * Reglages annonces mais pas encore branches.
 *
 * On les laisse visibles, marques « bientot » et decoches : cacher ce qui
 * arrive priverait l'hote de savoir ou va le jeu, et le proposer sans
 * l'implementer serait une promesse non tenue au milieu d'une partie.
 */
const SOON: ToggleKey[] = ['allowBets', 'allowSteal']

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
    <div className="mb-2.5 flex items-center justify-between px-1">
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
  const t = useT()

  /** Les libelles vivent dans le dictionnaire, pas dans les tables. */
  function legendOf(key: ScaleKey): string {
    return key === 'questionCount' ? t.options.length : t.options.pace
  }

  function labelOf(key: ScaleKey, value: string | number): string {
    return key === 'questionCount'
      ? t.options.lengths[value as 10 | 20 | 30]
      : t.options.paces[value as 'calme' | 'normal' | 'rapide']
  }

  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const you = players.find((player) => player.id === youId) ?? null
  const isHost = you?.is_host ?? false
  const options = mergeOptions(room.options)

  // Un jeu sans réglage n'affiche pas de section vide : promettre des
  // réglages qui n'existent pas est pire que ne rien promettre.
  const available = optionsFor(room.game)
  const scales = SCALES.filter((scale) => available.includes(scale.key))

  const toggles = available.filter(
    (key): key is ToggleKey =>
      key !== 'pace' && key !== 'questionCount' && key !== 'kinds',
  )

  /**
   * Retire ou remet une forme.
   *
   * La derniere ne peut pas partir : un salon sans aucune forme n'aurait
   * plus rien a tirer, et le refus se lit mieux ici qu'au lancement.
   */
  function toggleKind(kind: (typeof KIND_CHOICES)[number]['value']) {
    const active = options.kinds.includes(kind)
    if (active && options.kinds.length === 1) return
    const next = active
      ? options.kinds.filter((current) => current !== kind)
      : [...options.kinds, kind]
    void run(() => setRoomOptions(room.id, { kinds: next }))
  }

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
    <div className="space-y-10">
      <div className="flex flex-col items-center gap-6">
        {/* Le nombre de joueurs se pose sur le code plutot que dans une
            pastille a lui : c'est la meme information, sans un bloc de plus
            au-dessus de l'element principal de l'ecran. */}
        <RoomCode code={room.code} present={players.length} />
      </div>

      <section aria-label="Joueurs">
        <SectionTitle icon={<UsersIcon />} aside={isHost ? t.room.hosting : undefined}>
          {t.room.table}
        </SectionTitle>
        <PlayerSeats players={players} youId={youId} hostId={room.host_player_id} />
      </section>

      <section aria-label="Jeu">
        <SectionTitle
          icon={<PlayIcon />}
          aside={isHost ? 'Vous choisissez' : 'L’hôte choisit'}
        >
          Jeu
        </SectionTitle>
        <GamePicker
          game={room.game as GameId}
          canChange={isHost && !busy}
          onChange={(next) => void run(() => setRoomGame(room.id, next))}
        />
      </section>

      {available.length > 0 && (
        <section aria-label="Réglages">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            className="mb-2.5 flex w-full items-center justify-between px-1"
          >
            <span className="eyebrow text-faint flex items-center gap-2">
              <SlidersIcon className="size-4" />
              {t.room.settings}
            </span>
            <span className="eyebrow text-faint flex items-center gap-1.5">
              {open ? t.room.hide : t.room.show}
              <svg
                viewBox="0 0 20 20"
                aria-hidden="true"
                className={cn(
                  'size-3.5 transition-transform duration-200',
                  open && 'rotate-180',
                )}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 8l5 5 5-5" />
              </svg>
            </span>
          </button>

          {open && (
            <Panel>
              <fieldset disabled={!isHost || busy} className="space-y-4">
                {scales.map((scale) => (
                  <div key={scale.key}>
                    <legend className="text-fg mb-2 text-[15px] font-medium">
                      {legendOf(scale.key)}
                    </legend>
                    <Segmented
                      label={legendOf(scale.key)}
                      options={scale.choices.map((choice) => ({
                        value: choice.value,
                        label: labelOf(scale.key, choice.value),
                      }))}
                      value={options[scale.key]}
                      disabled={!isHost || busy}
                      onChange={(next) =>
                        void run(() =>
                          setRoomOptions(room.id, { [scale.key]: next }),
                        )
                      }
                    />
                  </div>
                ))}

                {available.includes('kinds') && (
                  <div>
                    <legend className="text-fg mb-2 text-[15px] font-medium">
                      {t.options.kinds}
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {KIND_CHOICES.map((choice) => {
                        const active = options.kinds.includes(choice.value)
                        return (
                          <button
                            key={choice.value}
                            type="button"
                            aria-pressed={active}
                            disabled={!isHost || busy}
                            onClick={() => toggleKind(choice.value)}
                            className={cn(
                              'rounded-token px-3 py-1.5 text-[14px]',
                              'transition-[background-color,color,transform] duration-200',
                              'active:scale-[0.97]',
                              active
                                ? 'bg-accent text-on-accent'
                                : 'bg-sunken text-muted',
                              (!isHost || busy) && 'cursor-default',
                            )}
                          >
                            {choice.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {toggles.length > 0 && (
                  <div
                    className={cn(
                      'divide-default divide-y',
                      scales.length > 0 && 'border-t border-t-[var(--border)] pt-1',
                    )}
                  >
                    {toggles.map((key) => {
                      const soon = SOON.includes(key)
                      return (
                        <Checkbox
                          key={key}
                          label={
                            soon ? `${t.options[key]} · ${t.common.soon}` : t.options[key]
                          }
                          hint={t.options[`${key}Hint` as const]}
                          checked={soon ? false : options[key]}
                          disabled={soon}
                          onChange={(event) =>
                            void run(() =>
                              setRoomOptions(room.id, { [key]: event.target.checked }),
                            )
                          }
                        />
                      )
                    })}
                  </div>
                )}
              </fieldset>
            </Panel>
          )}
        </section>
      )}

      <section className="flex flex-col items-center gap-4">
        {isHost ? (
          <Button
            size="lg"
            loading={busy}
            className="gap-2.5"
            onClick={() =>
              void run(() =>
                // Le quiz doit tirer ses questions avant de demarrer ; les
                // autres jeux se contentent de changer d'etat.
                room.game === 'quiz' ? startQuiz(room.id) : startGame(room.id),
              )
            }
          >
            <PlayIcon />
            {t.room.start}
          </Button>
        ) : (
          <p className="text-muted text-[15px]">
            {t.room.waiting}
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
