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
 * Les joueurs sur une seule ligne.
 *
 * Une grille de huit cases donnait au lobby l'allure d'un tableau de bord
 * alors qu'on n'y fait qu'une chose : attendre que le monde arrive. Une
 * ligne suffit, et la place libre restante se lit d'un coup d'œil sans
 * occuper un quart de l'écran.
 *
 * Les joueurs ne sont pas distingués par une couleur — la palette n'en a
 * qu'une, et huit teintes inventées la casseraient. Ils le sont par leurs
 * initiales ; seuls l'hôte et vous-même portez une marque.
 */
export function PlayerRow({
  players,
  youId,
  hostId,
}: {
  players: Player[]
  youId: string | null
  hostId: string | null
}) {
  const now = Date.now()
  const free = Math.max(0, MAX_PLAYERS - players.length)

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {players.map((player) => {
        const away = isAbsent(player, now)
        const isYou = player.id === youId
        const isHost = player.id === hostId

        return (
          <span
            key={player.id}
            title={`${player.nickname}${isHost ? ' · hôte' : ''}${away ? ' · absent' : ''}`}
            className={cn(
              'rounded-token flex shrink-0 items-center gap-2 py-1.5 pr-3 pl-1.5',
              'transition-opacity duration-300',
              isYou ? 'bg-accent-soft' : 'bg-surface shadow-token',
              away && 'opacity-45',
            )}
          >
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full font-mono text-[12px] font-bold',
                isYou ? 'bg-accent text-on-accent' : 'bg-sunken text-fg',
              )}
            >
              {initials(player.nickname)}
            </span>
            <span className="text-fg max-w-28 truncate text-[14px] font-medium">
              {player.nickname}
            </span>
            {isHost && <span className="eyebrow text-faint">Hôte</span>}
          </span>
        )
      })}

      {free > 0 && (
        <span className="border-default text-faint rounded-token shrink-0 border border-dashed px-3 py-2 text-[13px]">
          {free} place{free > 1 ? 's' : ''} libre{free > 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
