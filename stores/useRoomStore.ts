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
 * les changements Postgres. Il devient impossible que deux joueurs voient
 * des choses differentes, et rafraichir la page restaure l'etat exact.
 */
export const useRoomStore = create<RoomState>((set) => {
  let cleanup: (() => void) | null = null
  let connectedTo: string | null = null

  return {
    room: null,
    players: [],
    loading: true,
    error: null,
    tick: 0,

    async connect(code) {
      // React monte deux fois les effets en developpement : sans ce garde,
      // le second appel recupere le canal deja abonne et tente d'y ajouter
      // des ecouteurs, ce que Realtime refuse apres `subscribe()`.
      if (connectedTo === code) return
      connectedTo = code

      cleanup?.()
      cleanup = null
      set({ loading: true, error: null })

      const supabase = createBrowserClient()

      // Un canal orphelin peut survivre a un demontage brutal : on nettoie
      // avant d'en ouvrir un nouveau sur le meme sujet.
      for (const channel of supabase.getChannels()) {
        if (channel.topic === `realtime:room:${code}`) {
          await supabase.removeChannel(channel)
        }
      }

      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .maybeSingle()

      if (!room) {
        connectedTo = null
        set({ loading: false, error: 'Aucun salon ne porte ce code.' })
        return
      }

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', room.id)
        .order('slot')

      set({ room, players: players ?? [], loading: false })

      async function refreshPlayers(roomId: string) {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomId)
          .order('slot')
        set({ players: data ?? [] })
      }

      // Un seul canal par salon : ouvrir plusieurs connexions Realtime pour
      // un meme onglet consommerait le quota gratuit pour rien.
      const channel = supabase
        .channel(`room:${code}`)
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

      const heartbeat = window.setInterval(
        () => set((state) => ({ tick: state.tick + 1 })),
        5_000,
      )

      cleanup = () => {
        window.clearInterval(heartbeat)
        void supabase.removeChannel(channel)
      }
    },

    disconnect() {
      cleanup?.()
      cleanup = null
      connectedTo = null
      set({ room: null, players: [], loading: true, error: null })
    },
  }
})
