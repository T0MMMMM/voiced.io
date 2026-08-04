'use client'

import { create } from 'zustand'
import { createBrowserClient } from '@/lib/supabase/client'
import type { Player, Room } from '@/lib/supabase/types'

/** Au-dela, un joueur est considere absent — sans etre supprime. */
export const ABSENT_AFTER_MS = 30_000

interface RoomState {
  room: Room | null
  players: Player[]
  loading: boolean
  error: string | null
  /** Incremente toutes les cinq secondes pour reevaluer les absences. */
  tick: number
  connect: (code: string) => Promise<void>
  disconnect: () => void
}

export function isAbsent(player: Player, now: number = Date.now()): boolean {
  return now - new Date(player.last_seen_at).getTime() > ABSENT_AFTER_MS
}

/**
 * La base de donnees est l'unique source de verite : chaque transition
 * d'etat est une ecriture, et tous les ecrans se redessinent en ecoutant
 * les changements Postgres.
 *
 * Deux precautions rendent la connexion sure face au double montage des
 * effets en developpement :
 *
 *   · un jeton de session — apres chaque `await`, une tentative dont le
 *     jeton n'est plus le courant abandonne et nettoie derriere elle ;
 *   · un nom de canal unique par tentative — sans lui, deux connexions
 *     concurrentes recuperent le meme canal, et ajouter des ecouteurs a
 *     un canal deja abonne est refuse par Realtime.
 */
export const useRoomStore = create<RoomState>((set) => {
  let cleanup: (() => void) | null = null
  let session = 0

  return {
    room: null,
    players: [],
    loading: true,
    error: null,
    tick: 0,

    async connect(code) {
      const mine = ++session

      cleanup?.()
      cleanup = null
      set({ loading: true, error: null })

      const supabase = createBrowserClient()

      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (mine !== session) return

      if (!room) {
        set({ loading: false, error: 'Aucun salon ne porte ce code.' })
        return
      }

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('slot')

      if (mine !== session) return

      set({ room, players: players ?? [], loading: false })

      async function refreshPlayers(roomId: string) {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomId)
          .order('slot')
        set({ players: data ?? [] })
      }

      const channel = supabase
        .channel(`room:${code}:${mine}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rooms',
            filter: `id=eq.${room.id}`,
          },
          (payload) => set({ room: payload.new as Room }),
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'players',
            filter: `room_id=eq.${room.id}`,
          },
          () => void refreshPlayers(room.id),
        )
        .subscribe()

      // Une tentative devenue obsolete pendant l'abonnement doit refermer
      // son propre canal, sinon il resterait ouvert pour rien.
      if (mine !== session) {
        void supabase.removeChannel(channel)
        return
      }

      const ticker = window.setInterval(
        () => set((state) => ({ tick: state.tick + 1 })),
        5_000,
      )

      cleanup = () => {
        window.clearInterval(ticker)
        void supabase.removeChannel(channel)
      }
    },

    disconnect() {
      // Invalide toute tentative en cours : sans cela, un `connect` encore
      // suspendu sur un `await` reprendrait et ouvrirait un canal orphelin.
      session++
      cleanup?.()
      cleanup = null
      set({ room: null, players: [], loading: true, error: null })
    },
  }
})
