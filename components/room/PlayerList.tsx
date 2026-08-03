'use client'

import { isAbsent } from '@/stores/useRoomStore'
import type { Player } from '@/lib/supabase/types'
import { cn } from '@/lib/utils/cn'
import { MAX_PLAYERS } from '@/lib/rooms/options'

/** Deux lettres suffisent a se reconnaitre dans un salon de huit. */
function initials(nickname: string): string {
  const parts = nickname.trim().split(/\s+/)
  const letters =
    parts.length > 1
      ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`
      : nickname.trim().slice(0, 2)
  return letters.toUpperCase()
}

/**
 * Les joueurs ne sont pas distingues par une couleur : la palette n'en a
 * qu'une, et huit teintes inventees la casseraient. Ils le sont par leurs
 * initiales, et seuls l'hote et vous-meme portent une marque.
 */
export function PlayerList({
  players,
  youId,
  hostId,
}: {
  players: Player[]
  youId: string | null
  hostId: string | null
}) {
  const now = Date.now()

  return (
    <ul className="flex flex-wrap justify-center gap-3">
      {players.map((player) => {
        const away = isAbsent(player, now)
        const isYou = player.id === youId

        return (
          <li
            key={player.id}
            className={cn(
              'bg-surface shadow-token rounded-token flex items-center gap-3 py-2 pr-4 pl-2',
              away && 'opacity-45',
            )}
          >
            <span className="bg-sunken text-fg rounded-[8px] px-2 py-1.5 font-mono text-[13px] font-bold">
              {initials(player.nickname)}
            </span>
            <span className="min-w-0">
              <span className="text-fg block truncate text-[15px] font-medium">
                {player.nickname}
                {isYou && <span className="text-faint font-normal"> · vous</span>}
              </span>
              <span className="eyebrow text-faint block">
                {away ? 'Absent' : player.id === hostId ? 'Hôte' : 'Prêt'}
              </span>
            </span>
          </li>
        )
      })}

      {players.length < MAX_PLAYERS && (
        <li className="border-default text-faint rounded-token flex items-center border border-dashed px-4 text-[13px]">
          {MAX_PLAYERS - players.length} place
          {MAX_PLAYERS - players.length > 1 ? 's' : ''} libre
          {MAX_PLAYERS - players.length > 1 ? 's' : ''}
        </li>
      )}
    </ul>
  )
}
