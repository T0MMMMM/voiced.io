'use client'

import { MAX_PLAYERS } from '@/lib/rooms/options'
import type { Player } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'
import { isAbsent } from '@/stores/useRoomStore'

/** Deux lettres suffisent à se reconnaître dans un salon de huit. */
function initials(nickname: string): string {
  const parts = nickname.trim().split(/\s+/)
  const letters =
    parts.length > 1
      ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
      : nickname.trim().slice(0, 2)
  return letters.toUpperCase()
}

/**
 * Des places, pas une liste : les sièges vides comptent autant que les
 * occupés. On voit d'un coup d'œil qu'on attend encore quelqu'un, ce qui
 * est exactement la question qu'on se pose dans un lobby.
 *
 * Les joueurs ne sont pas distingués par une couleur : la palette n'en a
 * qu'une, et huit teintes inventées la casseraient. Ils le sont par leurs
 * initiales ; seuls l'hôte et vous-même portez une marque.
 */
export function PlayerSeats({
  players,
  youId,
  hostId,
}: {
  players: Player[]
  youId: string | null
  hostId: string | null
}) {
  const now = Date.now()
  const empty = Math.max(0, MAX_PLAYERS - players.length)

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {players.map((player) => {
        const away = isAbsent(player, now)
        const isYou = player.id === youId
        const isHost = player.id === hostId

        return (
          <li
            key={player.id}
            className={cn(
              'rounded-token flex flex-col items-center gap-2 px-3 py-4 text-center',
              'transition-opacity duration-300',
              isYou ? 'bg-accent-soft' : 'bg-surface shadow-token',
              away && 'opacity-45',
            )}
          >
            <span
              className={cn(
                'flex size-11 items-center justify-center rounded-full font-mono text-[15px] font-bold',
                isYou ? 'bg-accent text-on-accent' : 'bg-sunken text-fg',
              )}
            >
              {initials(player.nickname)}
            </span>

            <span className="w-full min-w-0">
              <span className="text-fg block truncate text-[14px] font-medium">
                {player.nickname}
              </span>
              <span className="eyebrow text-faint mt-0.5 block">
                {away ? 'Absent' : isHost ? 'Hôte' : isYou ? 'Vous' : 'Prêt'}
              </span>
            </span>
          </li>
        )
      })}

      {Array.from({ length: empty }, (_, i) => (
        <li
          key={`libre-${i}`}
          className="border-default rounded-token flex flex-col items-center justify-center gap-2 border border-dashed px-3 py-4"
        >
          <span className="border-default text-faint flex size-11 items-center justify-center rounded-full border border-dashed text-[18px]">
            +
          </span>
          <span className="eyebrow text-faint">Libre</span>
        </li>
      ))}
    </ul>
  )
}
